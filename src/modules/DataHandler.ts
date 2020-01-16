/*
 *  Copyright (C) 2019  Attila Aldemir <a_aldemir@hotmail.de>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published
 *  by the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { account, DecodeTokenParams, IRequest, Request, time } from "@somedotone/ardor-ts";
import { ACCOUNT_PREFIX, MAX_DEPRECATION_HOPS } from "../constants";
import { EntityCheckParams, EntityType, ErrorCode, IData, SignDataParams, SignedData, SignedDataCheckParams, State, VerifySignedDataParams, VerifySignedDataResponse } from "../types";
import DataFields from "./lib/DataFields";
import Helper from "./lib/Helper";
import TokenData from "./lib/TokenData";


enum TrustPathState {
    BEGIN,
    ONGOING,
    END
}

export default class DataHandler implements IData {

    private request: IRequest;



    constructor(request = new Request()) {
        this.request = request;
    }


    public signData = (params: SignDataParams, forTestnet = false): SignedData => {
        const tokenDataString = TokenData.createTokenDataString(params.attestationPath, params.attestationContext, params.payload);
        const creatorAccount = account.convertPassphraseToAccountRs(params.passphrase);

        const signedData: SignedData = {
            attestationContext: params.attestationContext,
            attestationPath: (params.attestationPath && params.attestationPath) || [ creatorAccount ],
            creatorAccount,
            payload: params.payload,
            signature: account.generateToken(tokenDataString, params.passphrase, forTestnet)
        };

        return signedData;
    }


    public verifySignedData = async (url: string, params: VerifySignedDataParams, forTestnet = false): Promise<VerifySignedDataResponse> => {
        const signedDataCheckCallback = (params.signedDataCheckCallback && params.signedDataCheckCallback) || this.defaultSignedDataCb;
        const entityCheckCallback = (params.entityCheckCallback && params.entityCheckCallback) || this.defaultEntityCb;

        await this.checkSignedDataObject(url, params.signedData, signedDataCheckCallback, forTestnet);
        const trustChainResponse = await this.parseTrustChain(url, params.signedData, params.trustedRootAccount, entityCheckCallback);

        return { activeRootAccount: trustChainResponse.activeRoot, verifiedTrustChain: trustChainResponse.parsedChain };
    }

    private defaultSignedDataCb = (): boolean => true;
    private defaultEntityCb = (): boolean => true;

    private checkSignedDataObject = async (url: string, signedData: SignedData, signedDataCheckCallback: (signedDataCheck: SignedDataCheckParams) => boolean,
                                           forTestnet: boolean): Promise<void> => {
        try {
            const params: DecodeTokenParams = {
                data: TokenData.createTokenDataString(signedData.attestationPath, signedData.attestationContext, signedData.payload),
                token: signedData.signature
            };

            const tokenResponse = await this.request.decodeToken(url, params);
            if (!tokenResponse.valid) {
                const _error = Helper.createError(ErrorCode.INVALID_SIGNATURE);
                return Promise.reject(_error);
            }
            if (tokenResponse.accountRS !== signedData.creatorAccount) {
                const _error = Helper.createError(ErrorCode.WRONG_CREATOR_ACCOUNT, [ signedData.creatorAccount, tokenResponse.accountRS ]);
                return Promise.reject(_error);
            }


            const signedDataCheckParams: SignedDataCheckParams = {
                signatureTime: time.convertArdorToUnixTimestamp(tokenResponse.timestamp, forTestnet),
                signedData
            };
            if (!signedDataCheckCallback(signedDataCheckParams)) {
                const _error = Helper.createError(ErrorCode.SIGNED_DATA_CALLBACK_ERROR);
                return Promise.reject(_error);
            }

        } catch (error) {
            return Promise.reject(Helper.getError(error));
        }
    }

    private parseTrustChain = async (url: string, signedData: SignedData, trustedRoot: string,
                                     entityCheckCallback: (entity: EntityCheckParams) => boolean): Promise<{ activeRoot: string; parsedChain: string[] }> => {
        let trustedRootFound = false;
        const trustPath = this.setTrustPath(signedData);
        const verificationPath: string[] = [];

        for (let i = 0 ; i < trustPath.length ; i++) {
            let dataFields = new DataFields();
            const verificationParams = this.setVerificationParameter(trustPath, i);
            let attestedAccount = verificationParams.attestedAccount;
            let attestor = verificationParams.attestor;
            let deprecationHops = 0;
            let deprecatedEntityType;

            do {
                verificationPath.push(attestedAccount);
                dataFields = await this.getAndCheckDataFields(url, attestedAccount, attestor, signedData.attestationContext, verificationParams.state);

                if (dataFields.state === State.DEPRECATED && deprecatedEntityType === undefined) deprecatedEntityType = dataFields.entityType;
                if (deprecatedEntityType !== undefined && deprecatedEntityType !== dataFields.entityType) {
                    const _error = Helper.createError(ErrorCode.ENTITY_MISMATCH, [ attestedAccount ]);
                    return Promise.reject(_error);
                }

                if (verificationParams.state === TrustPathState.END && attestedAccount === trustedRoot) trustedRootFound = true;


                const entity: EntityCheckParams = {
                    account: attestedAccount,
                    entityType: dataFields.entityType,
                    payload: dataFields.payload,
                    protocolVersion: dataFields.version,
                    state: dataFields.state
                };
                if (!entityCheckCallback(entity)) {
                    const _error = Helper.createError(ErrorCode.ENTITY_CALLBACK_ERROR);
                    return Promise.reject(_error);
                }


                if (deprecationHops >= MAX_DEPRECATION_HOPS) {
                    const _error = Helper.createError(ErrorCode.TOO_MANY_DEPRECATION_HOPS, [ verificationParams.attestedAccount ]);
                    return Promise.reject(_error);
                }


                attestedAccount = ACCOUNT_PREFIX + dataFields.redirectAccount;
                if (verificationParams.state === TrustPathState.END) attestor = attestedAccount;

                deprecationHops++;
            } while (dataFields.state === State.DEPRECATED);
        }

        if (!trustedRootFound) {
            const _error = Helper.createError(ErrorCode.TRUSTED_ROOT_NOT_FOUND, [ trustedRoot ]);
            return Promise.reject(_error);
        }
        return { activeRoot: verificationPath[verificationPath.length - 1], parsedChain: verificationPath };
    }

    private setTrustPath = (signedData: SignedData): string[] => {
        return this.isCreatorAccountRoot(signedData) ? [ signedData.creatorAccount ]
                                                     : (signedData.attestationPath && [ signedData.creatorAccount, ...signedData.attestationPath ]) || [];
    }

    private isCreatorAccountRoot = (signedData: SignedData): boolean => {
        return (!signedData.attestationPath || signedData.attestationPath.length === 0 || signedData.attestationPath[0] === signedData.creatorAccount);
    }

    private setVerificationParameter = (trustPath: string[], counter: number): {attestor: string; attestedAccount: string; state: TrustPathState} => {
        if (counter === trustPath.length - 1) return {
                attestedAccount: trustPath[counter],
                attestor: trustPath[counter],
                state: TrustPathState.END
            };
        else if (counter === 0) return {
                attestedAccount: trustPath[counter],
                attestor: trustPath[counter + 1],
                state: TrustPathState.BEGIN
            };
        else return {
                attestedAccount: trustPath[counter],
                attestor: trustPath[counter + 1],
                state: TrustPathState.ONGOING
            };
    }

    private getAndCheckDataFields = async (url: string, attestedAccount: string, attestorAccount: string,
                                           attestationContext: string, state: TrustPathState): Promise<DataFields> => {
        try {
            const dataFields = new DataFields();
            dataFields.attestationContext = attestationContext;

            const response = await this.request.getAccountProperties(url, {
                    setter: attestorAccount,
                    recipient: attestedAccount,
                    property: dataFields.attestationContext
                });
            const propertyObject = response.properties[0];

            if (!propertyObject) {
                const _error = Helper.createError(ErrorCode.ATTESTATION_CONTEXT_NOT_FOUND, [ attestedAccount ]);
                return Promise.reject(_error);
            }

            const error = dataFields.consumeDataFieldString(propertyObject.value);
            if (error.code !== ErrorCode.NO_ERROR) return Promise.reject(error);

            if (dataFields.entityType === EntityType.LEAF && state !== TrustPathState.BEGIN) {
                const _error = Helper.createError(ErrorCode.LEAF_ATTESTOR_NOT_ALLOWED, [ attestedAccount ]);
                return Promise.reject(_error);
            }
            if (dataFields.entityType !== EntityType.ROOT && state === TrustPathState.END) {
                const _error = Helper.createError(ErrorCode.END_ENTITY_NOT_ROOT, [ attestedAccount ]);
                return Promise.reject(_error);
            }
            if (dataFields.entityType === EntityType.ROOT && state !== TrustPathState.END) {
                const _error = Helper.createError(ErrorCode.ROOT_ENTITY_IN_MIDDLE_OF_PATH, [ attestedAccount ]);
                return Promise.reject(_error);
            }

            if (dataFields.state === State.INACTIVE) {
                const _error = Helper.createError(ErrorCode.ENTITY_INACTIVE, [ attestedAccount ]);
                return Promise.reject(_error);
            }
            if (dataFields.state === State.DEPRECATED && state === TrustPathState.BEGIN) {
                const _error = Helper.createError(ErrorCode.CREATOR_ACCOUNT_DEPRECATED, [ attestedAccount ]);
                return Promise.reject(_error);
            }

            return dataFields;
        } catch (error) {
            return Promise.reject(Helper.getError(error));
        }
    }
}
