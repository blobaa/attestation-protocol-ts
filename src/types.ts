export type objectAny = {[name: string]: any};


export interface Error {
    code: ErrorCode;
    description: string;
}

export enum ErrorCode {
    NO_ERROR = -1,
    UNKNOWN = 500,

    CONNECTION_ERROR,
    NODE_ERROR,
    
    ATTESTATION_CONTEXT_NOT_FOUND,

    WRONG_NUMBER_OF_DATA_FIELDS,

    WRONG_VERSION_LENGTH,
    WRONG_VERSION,

    WRONG_ENTITY_TYPE_LENGTH,
    WRONG_ENTITY_TYPE,
    UNKNOWN_ENTITY_TYPE,

    WRONG_STATE_TYPE_LENGTH,
    STATE_ALREADY_SET,
    DEPRECATE_STATE_CANNOT_BE_SET,
    UNKNOWN_STATE_TYPE,
    ENTITY_NOT_ACTIVE,
    ENTITY_INACTIVE,

    WRONG_REDIRECT_ACCOUNT_LENGTH,
    INVALID_REDIRECT_ACCOUNT,

    PAYLOAD_TOO_LONG,
    PAYLOAD_ALREADY_SET,

    ATTESTATION_NOT_ALLOWED,
    ATTESTATION_CONTEXT_ALREADY_SET,

    SELF_ATTESTATION_NOT_ALLOWED,

    LEAF_ATTESTOR_NOT_ALLOWED,
    END_ENTITY_NOT_ROOT,
    ROOT_ENTITY_IN_MIDDLE_OF_PATH,

    INVALID_SIGNATURE,
    WRONG_CLAIM_CREATOR_ACCOUNT,
    CLAIM_CREATOR_DEPRECATED,

    CLAIM_CALLBACK_ERROR,
    ENTITY_CALLBACK_ERROR,

    TOO_MANY_DEPRECATION_HOPS,
    ENTITY_MISMATCH,
    
    TRUSTED_ROOT_NOT_FOUND
}


export enum EntityType {
    ROOT = 'r',
    INTERMEDIATE = 'i',
    LEAF = 'l'
}


export enum State {
    ACTIVE = 'a',
    INACTIVE = 'i',
    DEPRECATED = 'd'
}


export interface CreateRootAttestationParams {
    passphrase: string;
    attestationContext: string;
    payload?: string;
}

export interface CreateIntermediateAttestationParams {
    passphrase: string;
    attestationContext: string;
    intermediateAccount: string;
    myAttestorAccount?: string;
    payload?: string;
}

export interface CreateLeafAttestationParams {
    passphrase: string;
    attestationContext: string;
    leafAccount: string;
    myAttestorAccount?: string;
    payload?: string;
}

export interface CreateAttestationUncheckedParams {
    passphrase: string;
    attestationContext: string;
    account: string;
    entityType: EntityType;
    payload?: string;
}

export interface AttestationResponse {
    transactionId: string;
}


export interface UpdateRootAttestationParams {
    passphrase: string;
    attestationContext: string;
    newPayload?: string;
    newState?: State.ACTIVE | State.INACTIVE;
    newRootAccount?: string;
}

export interface UpdateIntermediateAttestationParams {
    passphrase: string;
    attestationContext: string;
    intermediateAccount: string;
    myAttestorAccount?: string;
    newPayload?: string;
    newState?: State.ACTIVE | State.INACTIVE; 
    newIntermediateAccount?: string;
}

export interface UpdateLeafAttestationParams {
    passphrase: string;
    attestationContext: string;
    leafAccount: string;
    myAttestorAccount?: string;
    newPayload?: string;
    newState?: State.ACTIVE | State.INACTIVE;
    newLeafAccount?: string;
}


export interface RevokeRootAttestationParams {
    passphrase: string;
    attestationContext: string;
}

export interface RevokeIntermediateAttestationParams {
    passphrase: string;
    attestationContext: string;
    intermediateAccount?: string;
}

export interface RevokeLeafAttestationParams {
    passphrase: string;
    attestationContext: string;
    leafAccount?: string;
}

export interface RevokeAttestationUncheckedParams {
    passphrase: string;
    attestationContext: string;
    account: string;
}


export interface IAttestation {
    createRootAttestation: (url: string, params: CreateRootAttestationParams) => Promise<AttestationResponse>;
    createIntermediateAttestation: (url: string, params: CreateIntermediateAttestationParams) => Promise<AttestationResponse>;
    createLeafAttestation: (url: string, params: CreateLeafAttestationParams) => Promise<AttestationResponse>;
    createAttestationUnchecked: (url: string, params: CreateAttestationUncheckedParams) => Promise<AttestationResponse>;

    updateRootAttestation: (url: string, params: UpdateRootAttestationParams) => Promise<AttestationResponse>;
    updateIntermediateAttestation: (url: string, params: UpdateIntermediateAttestationParams) => Promise<AttestationResponse>;
    updateLeafAttestation: (url: string, params: UpdateLeafAttestationParams) => Promise<AttestationResponse>;

    revokeRootAttestation: (url: string, params: RevokeRootAttestationParams) => Promise<AttestationResponse>;
    revokeIntermediateAttestation: (url: string, params: RevokeIntermediateAttestationParams) => Promise<AttestationResponse>;
    revokeLeafAttestation: (url: string, params: RevokeLeafAttestationParams) => Promise<AttestationResponse>
    revokeAttestationUnchecked: (url: string, params: RevokeAttestationUncheckedParams) => Promise<AttestationResponse>;
}


export interface ClaimObject {
    payload: string;
    attestationPath: string[];
    attestationContext: string;
    creatorAccount: string;
    signature: string;
}

export interface CreateClaimParams {
    passphrase: string;
    attestationPath?: string[];
    attestationContext: string;
    payload: string;
}


export interface VerifyClaimParams {
    claim: ClaimObject;
    trustedRootAccount: string;
    claimCheckCallback?: (claim: ClaimCheckParams) => boolean;
    entityCheckCallback?: (entity: EntityCheckParams) => boolean;
}

export interface VerifyClaimResponse {
    activeRootAccount: string;
    verifiedTrustChain: string[];
}

export interface EntityCheckParams {
    account: string;
    entityType: EntityType;
    state: State;
    payload: string;
    protocolVersion: string;
}

export interface ClaimCheckParams {
    claim: ClaimObject;
    creationTime: number;
}


export interface IClaim {
    createClaim: (params: CreateClaimParams, forTestnet?: boolean) => ClaimObject;
    verifyClaim: (url: string, params: VerifyClaimParams, forTestnet?: boolean) => Promise<VerifyClaimResponse>;
}


export interface GetEntityParams {
    account: string;
    attestor?: string;
    attestationContext: string;
}

export interface GetEntityResponse {
    account: string;
    attestationContext: string;
    entityType: EntityType;
    state: State;
    payload: string;
    protocolVersion: string;
    redirectAccount: string;
}


export interface IEntity {
    getEntity: (url: string, params: GetEntityParams) => Promise<GetEntityResponse>;
}