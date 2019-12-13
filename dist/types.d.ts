export declare type objectAny = {
    [name: string]: any;
};
export interface Error {
    code: ErrorCode;
    description: string;
}
export declare enum ErrorCode {
    NO_ERROR = -1,
    UNKNOWN = 500,
    CONNECTION_ERROR = 501,
    NODE_ERROR = 502,
    ATTESTATION_CONTEXT_NOT_FOUND = 503,
    WRONG_NUMBER_OF_DATA_FIELDS = 504,
    WRONG_VERSION_LENGTH = 505,
    WRONG_VERSION = 506,
    WRONG_ENTITY_TYPE_LENGTH = 507,
    WRONG_ENTITY_TYPE = 508,
    UNKNOWN_ENTITY_TYPE = 509,
    WRONG_STATE_TYPE_LENGTH = 510,
    STATE_ALREADY_SET = 511,
    DEPRECATE_STATE_CANNOT_BE_SET = 512,
    UNKNOWN_STATE_TYPE = 513,
    ENTITY_NOT_ACTIVE = 514,
    ENTITY_INACTIVE = 515,
    WRONG_REDIRECT_ACCOUNT_LENGTH = 516,
    INVALID_REDIRECT_ACCOUNT = 517,
    PAYLOAD_TOO_LONG = 518,
    PAYLOAD_ALREADY_SET = 519,
    ATTESTATION_NOT_ALLOWED = 520,
    ATTESTATION_CONTEXT_ALREADY_SET = 521,
    SELF_ATTESTATION_NOT_ALLOWED = 522,
    LEAF_ATTESTOR_NOT_ALLOWED = 523,
    END_ENTITY_NOT_ROOT = 524,
    ROOT_ENTITY_IN_MIDDLE_OF_PATH = 525,
    INVALID_SIGNATURE = 526,
    WRONG_CLAIM_CREATOR_ACCOUNT = 527,
    CLAIM_CREATOR_DEPRECATED = 528,
    CLAIM_CALLBACK_ERROR = 529,
    ENTITY_CALLBACK_ERROR = 530,
    TOO_MANY_DEPRECATION_HOPS = 531,
    ENTITY_MISMATCH = 532,
    TRUSTED_ROOT_NOT_FOUND = 533
}
export declare enum EntityType {
    ROOT = "r",
    INTERMEDIATE = "i",
    LEAF = "l"
}
export declare enum State {
    ACTIVE = "a",
    INACTIVE = "i",
    DEPRECATED = "d"
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
    revokeLeafAttestation: (url: string, params: RevokeLeafAttestationParams) => Promise<AttestationResponse>;
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
