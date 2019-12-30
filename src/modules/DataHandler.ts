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

import { account, DecodeTokenParams, IRequest, Request, time } from '@somedotone/ardor-ts';
import { ACCOUNT_PREFIX, MAX_DEPRECATION_HOPS } from '../constants';
import { SignedData, SignDataParams, EntityCheckParams, EntityType, ErrorCode, IData, State, VerifySignedDataParams, VerifySignedDataResponse, SignedDataCheckParams } from '../types';
import DataFields from './lib/DataFields';
import Helper from './lib/Helper';
import TokenData from './lib/TokenData';


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
        const tokenDataString = TokenData.createTokenDataString(params.attestationPath, params.attestationContext, params.payload)
        const creatorAccount = account.convertPassphraseToAccountRs(params.passphrase);

        const signedData: SignedData = {
            payload: params.payload,
            attestationContext: params.attestationContext,
            attestationPath: params.attestationPath && params.attestationPath || [ creatorAccount ],
            signature: account.generateToken(tokenDataString, params.passphrase, forTestnet),
            creatorAccount: creatorAccount
        } 

        return signedData;
    }

        
    public verifySignedData = async (url: string, params: VerifySignedDataParams, forTestnet = false): Promise<VerifySignedDataResponse> => {
        const signedDataCheckCallback = params.signedDataCheckCallback && params.signedDataCheckCallback || this.defaultSignedDataCb;
        const entityCheckCallback = params.entityCheckCallback && params.entityCheckCallback || this.defaultEntityCb;

        await this.checkSignedDataObject(url, params.signedData, signedDataCheckCallback, forTestnet);
        const trustChainResponse = await this.parseTrustChain(url, params.signedData, params.trustedRootAccount, entityCheckCallback);

        return Promise.resolve({activeRootAccount: trustChainResponse.activeRoot, verifiedTrustChain: trustChainResponse.parsedChain});
    }

    private defaultSignedDataCb = (signedDataCheck: SignedDataCheckParams): boolean => true;
    private defaultEntityCb = (entity: EntityCheckParams): boolean => true;

    private checkSignedDataObject = async (url: string, signedData: SignedData, signedDataCheckCallback: (signedDataCheck: SignedDataCheckParams) => boolean, forTestnet: boolean): Promise<void> => {
        try {
            const params: DecodeTokenParams = {
                data: TokenData.createTokenDataString(signedData.attestationPath, signedData.attestationContext, signedData.payload),
                token: signedData.signature
            };

            const tokenResponse = await this.request.decodeToken(url, params);
            if(!tokenResponse.valid) return Promise.reject({ code: ErrorCode.INVALID_SIGNATURE, description: "Invalid signature token. The signature does not belong to the data object" });
            if(tokenResponse.accountRS !== signedData.creatorAccount) return Promise.reject({ code: ErrorCode.WRONG_CREATOR_ACCOUNT, description: "Wrong creator account. The specified creator account '" + signedData.creatorAccount + "' does not match with the calculated account '" + tokenResponse.accountRS + "'." });


            const signedDataCheckParams: SignedDataCheckParams = {
                signedData: signedData,
                signatureTime: time.convertArdorToUnixTimestamp(tokenResponse.timestamp, forTestnet)
            };

            if(!signedDataCheckCallback(signedDataCheckParams)) return Promise.reject({ code: ErrorCode.SIGNED_DATA_CALLBACK_ERROR, description: "Data object check callback error. Your callback returned false" });

        } catch(error) {
            return Promise.reject(Helper.getError(error));
        }
    }

    private parseTrustChain = async (url: string, signedData: SignedData, trustedRoot: string, entityCheckCallback: (entity: EntityCheckParams) => boolean): Promise<{activeRoot: string, parsedChain: string[]}> => {
        let trustedRootFound = false;
        let trustPath = this.setTrustPath(signedData);
        let verificationPath: string[] = [];

        for(let i = 0 ; i < trustPath.length ; i++) {
            
            let dataFields = new DataFields();
            const verificationParams = this.setVerificationParameter(trustPath, i);
            let attestedAccount = verificationParams.attestedAccount;
            let attestor = verificationParams.attestor;
            let deprecationHops = 0;
            let deprecatedEntityType = undefined;

            do {

                verificationPath.push(attestedAccount);
                dataFields = await this.getAndCheckDataFields(url, attestedAccount, attestor, signedData.attestationContext, verificationParams.state);
                
                if(dataFields.state === State.DEPRECATED && deprecatedEntityType === undefined) deprecatedEntityType = dataFields.entityType;
                if(deprecatedEntityType !== undefined && deprecatedEntityType !== dataFields.entityType) return Promise.reject({ code: ErrorCode.ENTITY_MISMATCH, description: "Entity mismatch. The entity type of redirect account '" + attestedAccount + "' mismatches from its origin account." });

                if(verificationParams.state === TrustPathState.END && attestedAccount === trustedRoot) trustedRootFound = true;


                const entity: EntityCheckParams = {
                    account: attestedAccount,
                    entityType: dataFields.entityType,
                    payload: dataFields.payload,
                    state: dataFields.state,
                    protocolVersion: dataFields.version
                };
                if(!entityCheckCallback(entity)) return Promise.reject({ code: ErrorCode.ENTITY_CALLBACK_ERROR, description: "Entity check callback error. Your callback returned false" });


                if(deprecationHops >= MAX_DEPRECATION_HOPS) return Promise.reject({ code: ErrorCode.TOO_MANY_DEPRECATION_HOPS, description: "Too many deprecation hops. Processed too many deprecation hops for account '" + verificationParams.attestedAccount + "'." });


                attestedAccount = ACCOUNT_PREFIX + dataFields.redirectAccount;
                if(verificationParams.state === TrustPathState.END) attestor = attestedAccount;
                
                deprecationHops++;
            } while(dataFields.state === State.DEPRECATED);

        }

        if(!trustedRootFound) return Promise.reject({ code: ErrorCode.TRUSTED_ROOT_NOT_FOUND, description: "Trusted root not found. Your specified trusted root account '" + trustedRoot + "' could not be found." })
        return Promise.resolve({ activeRoot: verificationPath[verificationPath.length - 1], parsedChain: verificationPath });
    }

    private setTrustPath = (signedData: SignedData): string[] => {
        return this.isCreatorAccountRoot(signedData) ? [ signedData.creatorAccount ] : signedData.attestationPath && [ signedData.creatorAccount, ...signedData.attestationPath ] || [];
    }

    private isCreatorAccountRoot = (signedData: SignedData): boolean => {
        return (!signedData.attestationPath || signedData.attestationPath.length === 0 || signedData.attestationPath[0] === signedData.creatorAccount);
    }

    private setVerificationParameter = (trustPath: string[], counter: number): {attestor: string, attestedAccount: string, state: TrustPathState} => {
        if(counter === trustPath.length - 1) return { 
                attestor: trustPath[counter], 
                attestedAccount: trustPath[counter], 
                state: TrustPathState.END 
            };
        else if(counter === 0) return { 
                attestor: trustPath[counter + 1], 
                attestedAccount: trustPath[counter], 
                state: TrustPathState.BEGIN
            };
        else return { 
                attestor: trustPath[counter + 1], 
                attestedAccount: trustPath[counter], 
                state: TrustPathState.ONGOING
            };
    }

    private getAndCheckDataFields = async (url: string, attestedAccount: string, attestorAccount: string, attestationContext: string, state: TrustPathState): Promise<DataFields> => {
        try {
            const dataFields = new DataFields();
            dataFields.attestationContext = attestationContext;

            const response = await this.request.getAccountProperties(url, { setter: attestorAccount, recipient: attestedAccount, property: dataFields.attestationContext });
            const propertyObject = response.properties[0];
            if(!propertyObject) return Promise.reject({code: ErrorCode.ATTESTATION_CONTEXT_NOT_FOUND, description: "Attestation context not found. Attestation context '" + dataFields.attestationContext + "' could not be found at account '" + attestedAccount + "' set by attestor ' " + attestorAccount + "'."});

            let error = dataFields.consumeDataFieldString(propertyObject.value);
            if(error.code !== ErrorCode.NO_ERROR) return Promise.reject(error);

            if(dataFields.entityType === EntityType.LEAF && state !== TrustPathState.BEGIN) return Promise.reject({code: ErrorCode.LEAF_ATTESTOR_NOT_ALLOWED, description: "Leaf entity cannot attest. Account '" + attestedAccount + "' tries to act as attestor but is a leaf entity"});
            if(dataFields.entityType !== EntityType.ROOT && state === TrustPathState.END) return Promise.reject({code: ErrorCode.END_ENTITY_NOT_ROOT, description: "Trust path doesn't end with root entity. Account '" + attestedAccount + "' is not a root entity"});
            if(dataFields.entityType === EntityType.ROOT && state !== TrustPathState.END) return Promise.reject({code: ErrorCode.ROOT_ENTITY_IN_MIDDLE_OF_PATH, description: "Root entity in the middle of the trust path. Account '" + attestedAccount + "' was detected in the middle of the trust path but is a root entity"})

            if(dataFields.state === State.INACTIVE) return Promise.reject({code: ErrorCode.ENTITY_INACTIVE, description: "Entity inactive. Account '"+ attestedAccount + "' is inactive."});
            if(dataFields.state === State.DEPRECATED && state === TrustPathState.BEGIN) return Promise.reject({code: ErrorCode.CREATOR_ACCOUNT_DEPRECATED, description: "Creator account deprecated. The data object creator account '"+ attestedAccount + "' is deprecated."});

            return dataFields;
        } catch(error) {
            return Promise.reject(Helper.getError(error));
        }
    }

}