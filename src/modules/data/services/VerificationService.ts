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

import { DecodeTokenParams, DecodeTokenResponse, IRequest, time } from "@blobaa/ardor-ts";
import { ACCOUNT_PREFIX, MAX_DEPRECATION_HOPS, noError } from "../../../constants";
import { EntityCheckCallback, EntityCheckParams, EntityType, Error, ErrorCode, SignedData, SignedDataCheckCallback, SignedDataCheckParams, State, VerifySignedDataParams, VerifySignedDataResponse } from "../../../types";
import DataFields from "../../lib/DataFields";
import Helper from "../../lib/Helper";
import { IVerificationService } from "../../internal-types";
import TokenData from "./utils/TokenData";


enum TrustPathState {
    BEGIN,
    ONGOING,
    END
}

type VerificationParams = {
    attestor: string;
    attestedAccount: string;
    state: TrustPathState;
}


export default class VerificationService implements IVerificationService {
    private readonly request: IRequest;


    constructor(request: IRequest) {
        this.request = request;
    }


    public async run(url: string, params: VerifySignedDataParams, forTestnet: boolean): Promise<VerifySignedDataResponse> {
        const signedDataCheckCallback = params.signedDataCheckCallback || this.defaultSignedDataCb;
        const entityCheckCallback = params.entityCheckCallback || this.defaultEntityCb;

        await this.checkSignedDataObject(url, params.signedData, signedDataCheckCallback, forTestnet);
        const trustChainResponse = await this.parseTrustChain(url, params.signedData, params.trustedRootAccount, entityCheckCallback);

        return { activeRootAccount: trustChainResponse.activeRoot, verifiedTrustChain: trustChainResponse.parsedChain };
    }

    private defaultSignedDataCb(): boolean {
        return true;
    }

    private defaultEntityCb(): boolean {
        return true;
    }

    private async checkSignedDataObject(url: string, signedData: SignedData, signedDataCheckCallback: SignedDataCheckCallback,
                                           forTestnet: boolean): Promise<void> {
        const signatureResponse = await this.checkSignature(url, signedData);
        await this.callSignedDataCheckCallback(signedData, signedDataCheckCallback, signatureResponse, forTestnet);
    }

    private async checkSignature(url: string, signedData: SignedData): Promise<DecodeTokenResponse> {
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

            return tokenResponse;

        } catch (error) {
            return Promise.reject(Helper.getError(error));
        }
    }

    private async callSignedDataCheckCallback(signedData: SignedData, signedDataCheckCallback: SignedDataCheckCallback,
                                              signatureResponse: DecodeTokenResponse, forTestnet: boolean): Promise<void> {
         const signedDataCheckParams: SignedDataCheckParams = {
            signatureTime: time.convertArdorToUnixTimestamp(signatureResponse.timestamp, forTestnet),
            signedData
        };
        if (!signedDataCheckCallback(signedDataCheckParams)) {
            const _error = Helper.createError(ErrorCode.SIGNED_DATA_CALLBACK_ERROR);
            return Promise.reject(_error);
        }
    }

    private async parseTrustChain(url: string, signedData: SignedData, trustedRoot: string,
                                     entityCheckCallback: EntityCheckCallback): Promise<{ activeRoot: string; parsedChain: string[] }> {
        let trustedRootFound = false;
        const trustPath = this.setTrustPath(signedData);
        const verificationPath: string[] = [];

        for (let i = 0 ; i < trustPath.length ; i++) {
            const verificationParams = this.setVerificationParameter(trustPath, i);

            await this.parseDeprecationPath(url, verificationParams, signedData.attestationContext, (dataFields: DataFields, attestedAccount: string) => {
                verificationPath.push(attestedAccount);

                if (verificationParams.state === TrustPathState.END && attestedAccount === trustedRoot) {
                    trustedRootFound = true;
                }

                return this.callEntityCheckCallback(dataFields, attestedAccount, entityCheckCallback);
            });
        }

        if (!trustedRootFound) {
            const _error = Helper.createError(ErrorCode.TRUSTED_ROOT_NOT_FOUND, [ trustedRoot ]);
            return Promise.reject(_error);
        }

        return {
            activeRoot: verificationPath[verificationPath.length - 1],
            parsedChain: verificationPath
        };
    }

    private setTrustPath(signedData: SignedData): string[] {
        return this.isCreatorAccountRoot(signedData) ? [ signedData.creatorAccount ]
                                                     : (signedData.attestationPath && [ signedData.creatorAccount, ...signedData.attestationPath ]) || [];
    }

    private isCreatorAccountRoot(signedData: SignedData): boolean {
        return (!signedData.attestationPath || signedData.attestationPath.length === 0 || signedData.attestationPath[0] === signedData.creatorAccount);
    }

    private setVerificationParameter(trustPath: string[], counter: number): VerificationParams {
        if (counter === trustPath.length - 1) {
            return {
                attestedAccount: trustPath[counter],
                attestor: trustPath[counter],
                state: TrustPathState.END
            };
        } else if (counter === 0) {
            return {
                attestedAccount: trustPath[counter],
                attestor: trustPath[counter + 1],
                state: TrustPathState.BEGIN
            };
        } else {
            return {
                attestedAccount: trustPath[counter],
                attestor: trustPath[counter + 1],
                state: TrustPathState.ONGOING
            };
        }
    }

    private async parseDeprecationPath(url: string, verificationParams: VerificationParams, attestationContext: string,
                                       trustChainCallback: (dataFields: DataFields, attestedAccount: string) => Error): Promise<void> {
        let dataFields: DataFields;
        let deprecationHops = 0;
        let deprecatedEntityType;
        let attestor = verificationParams.attestor;
        let attestedAccount = verificationParams.attestedAccount;
        const state = verificationParams.state;

        do {
            dataFields = await this.getAndCheckDataFields(url, attestedAccount, attestor, attestationContext, state);

            if (dataFields.state === State.DEPRECATED && deprecatedEntityType === undefined) {
                deprecatedEntityType = dataFields.entityType;
            }
            if (deprecatedEntityType !== undefined && deprecatedEntityType !== dataFields.entityType) {
                const _error = Helper.createError(ErrorCode.ENTITY_MISMATCH, [ attestedAccount ]);
                return Promise.reject(_error);
            }

            const error = trustChainCallback(dataFields, attestedAccount);
            if (error !== noError) {
                return Promise.reject(error);
            }

            attestedAccount = ACCOUNT_PREFIX + dataFields.redirectAccount;
            if (state === TrustPathState.END) {
                attestor = attestedAccount;
            }

            if (deprecationHops >= MAX_DEPRECATION_HOPS) {
                const _error = Helper.createError(ErrorCode.TOO_MANY_DEPRECATION_HOPS, [ attestedAccount ]);
                return Promise.reject(_error);
            }

            deprecationHops++;
        } while (dataFields.state === State.DEPRECATED);
    }

    private async getAndCheckDataFields(url: string, attestedAccount: string, attestorAccount: string,
                                           attestationContext: string, state: TrustPathState): Promise<DataFields> {
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
            if (error.code !== ErrorCode.NO_ERROR) {
                return Promise.reject(error);
            }

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

    private callEntityCheckCallback(dataFields: DataFields, attestedAccount: string, entityCheckCallback: EntityCheckCallback): Error {
        const entity: EntityCheckParams = {
            account: attestedAccount,
            entityType: dataFields.entityType,
            payload: dataFields.payload,
            protocolVersion: dataFields.version,
            state: dataFields.state
        };
        if (!entityCheckCallback(entity)) {
            return Helper.createError(ErrorCode.ENTITY_CALLBACK_ERROR);
        }
        return noError;
    }
}