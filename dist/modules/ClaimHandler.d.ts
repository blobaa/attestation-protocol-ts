import { Request } from 'ardor-ts';
import { ClaimObject, CreateClaimParams, IClaim, VerifyClaimParams, VerifyClaimResponse } from '../types';
export default class ClaimHandler implements IClaim {
    private request;
    constructor(request?: Request);
    createClaim: (params: CreateClaimParams, forTestnet?: boolean) => ClaimObject;
    verifyClaim: (url: string, params: VerifyClaimParams, forTestnet?: boolean) => Promise<VerifyClaimResponse>;
    private defaultClaimCb;
    private defaultEntityCb;
    private checkClaim;
    private parseTrustChain;
    private setTrustPath;
    private isClaimCreatorRoot;
    private setVerificationParameter;
    private getAndCheckDataFields;
}
