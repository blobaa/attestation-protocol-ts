import { account, DecodeTokenParams, IRequest, Request, time } from 'ardor-ts';
import { ACCOUNT_PREFIX, MAX_DEPRECATION_HOPS } from '../constants';
import { ClaimCheckParams, ClaimObject, CreateClaimParams, EntityCheckParams, EntityType, ErrorCode, IClaim, State, VerifyClaimParams, VerifyClaimResponse } from '../types';
import DataFields from './lib/DataFields';
import Helper from './lib/Helper';
import TokenData from './lib/TokenData';


enum TrustPathState {
    BEGIN,
    ONGOING,
    END
}

export default class ClaimHandler implements IClaim {

    private request: IRequest;



    constructor(request = new Request()) {
        this.request = request;
    }


    public createClaim = (params: CreateClaimParams, forTestnet = false): ClaimObject => {
        const tokenDataString = TokenData.createTokenDataString(params.attestationPath, params.attestationContext, params.payload)
        const creatorAccount = account.convertPassphraseToAccountRs(params.passphrase);

        const claimObject: ClaimObject = {
            payload: params.payload,
            attestationContext: params.attestationContext,
            attestationPath: params.attestationPath && params.attestationPath || [ creatorAccount ],
            signature: account.generateToken(tokenDataString, params.passphrase, forTestnet),
            creatorAccount: creatorAccount
        } 

        return claimObject;
    }

        
    public verifyClaim = async (url: string, params: VerifyClaimParams, forTestnet = false): Promise<VerifyClaimResponse> => {
        const claimCheckCallback = params.claimCheckCallback && params.claimCheckCallback || this.defaultClaimCb;
        const entityCheckCallback = params.entityCheckCallback && params.entityCheckCallback || this.defaultEntityCb;

        await this.checkClaim(url, params.claim, claimCheckCallback, forTestnet);
        const trustChainResponse = await this.parseTrustChain(url, params.claim, params.trustedRootAccount, entityCheckCallback);

        return Promise.resolve({activeRootAccount: trustChainResponse.activeRoot, verifiedTrustChain: trustChainResponse.parsedChain});
    }

    private defaultClaimCb = (claim: ClaimCheckParams): boolean => true;
    private defaultEntityCb = (entity: EntityCheckParams): boolean => true;

    private checkClaim = async (url: string, claim: ClaimObject, claimCheckCallback: (claim: ClaimCheckParams) => boolean, forTestnet: boolean): Promise<void> => {
        try {
            const params: DecodeTokenParams = {
                data: TokenData.createTokenDataString(claim.attestationPath, claim.attestationContext, claim.payload),
                token: claim.signature
            };

            const tokenResponse = await this.request.decodeToken(url, params);
            if(!tokenResponse.valid) return Promise.reject({ code: ErrorCode.INVALID_SIGNATURE, description: "Invalid signature token. The signature does not belong to the claim" });
            if(tokenResponse.accountRS !== claim.creatorAccount) return Promise.reject({ code: ErrorCode.WRONG_CLAIM_CREATOR_ACCOUNT, description: "Wrong creator account. The specified claim creator account '" + claim.creatorAccount + "' does not match with the calculated account '" + tokenResponse.accountRS + "'." });


            const claimCheckParams: ClaimCheckParams = {
                claim: claim,
                creationTime: time.convertArdorToUnixTimestamp(tokenResponse.timestamp, forTestnet)
            };

            if(!claimCheckCallback(claimCheckParams)) return Promise.reject({ code: ErrorCode.CLAIM_CALLBACK_ERROR, description: "Claim check callback error. Your claimCheckCallback returned false" });

        } catch(error) {
            return Promise.reject(Helper.getError(error));
        }
    }

    private parseTrustChain = async (url: string, claim: ClaimObject, trustedRoot: string, entityCheckCallback: (entity: EntityCheckParams) => boolean): Promise<{activeRoot: string, parsedChain: string[]}> => {
        let trustedRootFound = false;
        let trustPath = this.setTrustPath(claim);
        let verificationPath: string[] = [];

        for(let i = 0 ; i < trustPath.length ; i++) {
            
            let dataFields = new DataFields();
            const verificationParams = this.setVerificationParameter(trustPath, i);
            let claimant = verificationParams.claimant;
            let attestor = verificationParams.attestor;
            let deprecationHops = 0;
            let deprecatedEntityType = undefined;

            do {

                verificationPath.push(claimant);
                dataFields = await this.getAndCheckDataFields(url, claimant, attestor, claim.attestationContext, verificationParams.state);
                
                if(dataFields.state === State.DEPRECATED && deprecatedEntityType === undefined) deprecatedEntityType = dataFields.entityType;
                if(deprecatedEntityType !== undefined && deprecatedEntityType !== dataFields.entityType) return Promise.reject({ code: ErrorCode.ENTITY_MISMATCH, description: "Entity mismatch. The entity type of redirect account '" + claimant + "' mismatches from its origin account." });

                if(verificationParams.state === TrustPathState.END && claimant === trustedRoot) trustedRootFound = true;


                const entity: EntityCheckParams = {
                    account: claimant,
                    entityType: dataFields.entityType,
                    payload: dataFields.payload,
                    state: dataFields.state,
                    protocolVersion: dataFields.version
                };
                if(!entityCheckCallback(entity)) return Promise.reject({ code: ErrorCode.ENTITY_CALLBACK_ERROR, description: "Entity check callback error. Your entityCheckCallback returned false" });


                if(deprecationHops >= MAX_DEPRECATION_HOPS) return Promise.reject({ code: ErrorCode.TOO_MANY_DEPRECATION_HOPS, description: "Too many deprecation hops. Processed too many deprecation hops for account '" + verificationParams.claimant + "'." });


                claimant = ACCOUNT_PREFIX + dataFields.redirectAccount;
                if(verificationParams.state === TrustPathState.END) attestor = claimant;
                
                deprecationHops++;
            } while(dataFields.state === State.DEPRECATED);

        }

        if(!trustedRootFound) return Promise.reject({ code: ErrorCode.TRUSTED_ROOT_NOT_FOUND, description: "Trusted root not found. Your specified trusted root account '" + trustedRoot + "' could not be found." })
        return Promise.resolve({ activeRoot: verificationPath[verificationPath.length - 1], parsedChain: verificationPath });
    }

    private setTrustPath = (claim: ClaimObject): string[] => {
        return this.isClaimCreatorRoot(claim) ? [ claim.creatorAccount ] : claim.attestationPath && [ claim.creatorAccount, ...claim.attestationPath ] || [];
    }

    private isClaimCreatorRoot = (claim: ClaimObject): boolean => {
        return (!claim.attestationPath || claim.attestationPath.length === 0 || claim.attestationPath[0] === claim.creatorAccount);
    }

    private setVerificationParameter = (trustPath: string[], counter: number): {attestor: string, claimant: string, state: TrustPathState} => {
        if(counter === trustPath.length - 1) return { 
                attestor: trustPath[counter], 
                claimant: trustPath[counter], 
                state: TrustPathState.END 
            };
        else if(counter === 0) return { 
                attestor: trustPath[counter + 1], 
                claimant: trustPath[counter], 
                state: TrustPathState.BEGIN
            };
        else return { 
                attestor: trustPath[counter + 1], 
                claimant: trustPath[counter], 
                state: TrustPathState.ONGOING
            };
    }

    private getAndCheckDataFields = async (url: string, claimantAccount: string, attestorAccount: string, attestationContext: string, state: TrustPathState): Promise<DataFields> => {
        try {
            const dataFields = new DataFields();
            dataFields.attestationContext = attestationContext;

            const response = await this.request.getAccountProperties(url, { setter: attestorAccount, recipient: claimantAccount, property: dataFields.attestationContext });
            const propertyObject = response.properties[0];
            if(!propertyObject) return Promise.reject({code: ErrorCode.ATTESTATION_CONTEXT_NOT_FOUND, description: "Attestation context not found. Attestation context '" + dataFields.attestationContext + "' could not be found at claimant '" + claimantAccount + "' set by attestor ' " + attestorAccount + "'."});

            let error = dataFields.consumeDataFieldString(propertyObject.value);
            if(error.code !== ErrorCode.NO_ERROR) return Promise.reject(error);

            if(dataFields.entityType === EntityType.LEAF && state !== TrustPathState.BEGIN) return Promise.reject({code: ErrorCode.LEAF_ATTESTOR_NOT_ALLOWED, description: "Leaf entity cannot attest. Account '" + claimantAccount + "' tries to act as attestor but is a leaf entity"});
            if(dataFields.entityType !== EntityType.ROOT && state === TrustPathState.END) return Promise.reject({code: ErrorCode.END_ENTITY_NOT_ROOT, description: "Trust path doesn't end with root entity. Account '" + claimantAccount + "' is not a root entity"});
            if(dataFields.entityType === EntityType.ROOT && state !== TrustPathState.END) return Promise.reject({code: ErrorCode.ROOT_ENTITY_IN_MIDDLE_OF_PATH, description: "Root entity in the middle of the trust path. Account '" + claimantAccount + "' was detected in the middle of the trust path but is a root entity"})

            if(dataFields.state === State.INACTIVE) return Promise.reject({code: ErrorCode.ENTITY_INACTIVE, description: "Entity inactive. Account '"+ claimantAccount + "' is inactive."});
            if(dataFields.state === State.DEPRECATED && state === TrustPathState.BEGIN) return Promise.reject({code: ErrorCode.CLAIM_CREATOR_DEPRECATED, description: "Claim creator account deprecated. The claim creator account '"+ claimantAccount + "' is deprecated."});

            return dataFields;
        } catch(error) {
            return Promise.reject(Helper.getError(error));
        }
    }

}