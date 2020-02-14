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

export type Error = {
    code: ErrorCode;
    description: string;
};

export enum ErrorCode {
    NO_ERROR = -1,
    UNKNOWN = 500,

    CONNECTION_ERROR,                   // 501
    NODE_ERROR,                         // 502

    ATTESTATION_CONTEXT_NOT_FOUND,      // 503

    WRONG_NUMBER_OF_DATA_FIELDS,        // 504

    WRONG_VERSION_LENGTH,               // 505
    WRONG_VERSION,                      // 506

    WRONG_ENTITY_TYPE_LENGTH,           // 507
    WRONG_ENTITY_TYPE,                  // 508
    UNKNOWN_ENTITY_TYPE,                // 509

    WRONG_STATE_TYPE_LENGTH,            // 510
    STATE_ALREADY_SET,                  // 511
    DEPRECATE_STATE_CANNOT_BE_SET,      // 512
    UNKNOWN_STATE_TYPE,                 // 513
    ENTITY_NOT_ACTIVE,                  // 514
    ENTITY_INACTIVE,                    // 515

    WRONG_REDIRECT_ACCOUNT_LENGTH,      // 516
    INVALID_REDIRECT_ACCOUNT,           // 517

    PAYLOAD_TOO_LONG,                   // 518
    PAYLOAD_ALREADY_SET,                // 519

    ATTESTATION_NOT_ALLOWED,            // 520
    ATTESTATION_CONTEXT_ALREADY_SET,    // 521

    SELF_ATTESTATION_NOT_ALLOWED,       // 522

    LEAF_ATTESTOR_NOT_ALLOWED,          // 523
    END_ENTITY_NOT_ROOT,                // 524
    ROOT_ENTITY_IN_MIDDLE_OF_PATH,      // 525

    INVALID_SIGNATURE,                  // 526
    WRONG_CREATOR_ACCOUNT,              // 527
    CREATOR_ACCOUNT_DEPRECATED,         // 528

    SIGNED_DATA_CALLBACK_ERROR,         // 529
    ENTITY_CALLBACK_ERROR,              // 530

    TOO_MANY_DEPRECATION_HOPS,          // 531
    ENTITY_MISMATCH,                    // 532

    TRUSTED_ROOT_NOT_FOUND              // 533
}


export enum EntityType {
    ROOT = "r",
    INTERMEDIATE = "i",
    LEAF = "l"
}


export enum State {
    ACTIVE = "a",
    INACTIVE = "i",
    DEPRECATED = "d"
}


export type CreateRootAttestationParams = {
    passphrase: string;
    attestationContext: string;
    payload?: string;
    fee?: number;
};

export type CreateIntermediateAttestationParams = {
    passphrase: string;
    attestationContext: string;
    intermediateAccount: string;
    myAttestorAccount?: string;
    payload?: string;
    fee?: number;
};

export type CreateLeafAttestationParams = {
    passphrase: string;
    attestationContext: string;
    leafAccount: string;
    myAttestorAccount?: string;
    payload?: string;
    fee?: number;
};

export type CreateAttestationUncheckedParams = {
    passphrase: string;
    attestationContext: string;
    account: string;
    entityType: EntityType;
    payload?: string;
    fee?: number;
};

export type AttestationResponse = {
    transactionId: string;
};


export type UpdateRootAttestationParams = {
    passphrase: string;
    attestationContext: string;
    newPayload?: string;
    newState?: State.ACTIVE | State.INACTIVE;
    newRootAccount?: string;
    fee?: number;
};

export type UpdateIntermediateAttestationParams = {
    passphrase: string;
    attestationContext: string;
    intermediateAccount: string;
    myAttestorAccount?: string;
    newPayload?: string;
    newState?: State.ACTIVE | State.INACTIVE;
    newIntermediateAccount?: string;
    fee?: number;
};

export type UpdateLeafAttestationParams = {
    passphrase: string;
    attestationContext: string;
    leafAccount: string;
    myAttestorAccount?: string;
    newPayload?: string;
    newState?: State.ACTIVE | State.INACTIVE;
    newLeafAccount?: string;
    fee?: number;
};


export type RevokeRootAttestationParams = {
    passphrase: string;
    attestationContext: string;
    fee?: number;
};

export type RevokeIntermediateAttestationParams = {
    passphrase: string;
    attestationContext: string;
    intermediateAccount?: string;
    fee?: number;
};

export type RevokeLeafAttestationParams = {
    passphrase: string;
    attestationContext: string;
    leafAccount?: string;
    fee?: number;
};

export type RevokeAttestationUncheckedParams = {
    passphrase: string;
    attestationContext: string;
    account: string;
    fee?: number;
};


export interface IAttestation {
    createRootAttestation(url: string, params: CreateRootAttestationParams): Promise<AttestationResponse>;
    createIntermediateAttestation(url: string, params: CreateIntermediateAttestationParams): Promise<AttestationResponse>;
    createLeafAttestation(url: string, params: CreateLeafAttestationParams): Promise<AttestationResponse>;
    createAttestationUnchecked(url: string, params: CreateAttestationUncheckedParams): Promise<AttestationResponse>;

    updateRootAttestation(url: string, params: UpdateRootAttestationParams): Promise<AttestationResponse>;
    updateIntermediateAttestation(url: string, params: UpdateIntermediateAttestationParams): Promise<AttestationResponse>;
    updateLeafAttestation(url: string, params: UpdateLeafAttestationParams): Promise<AttestationResponse>;

    revokeRootAttestation(url: string, params: RevokeRootAttestationParams): Promise<AttestationResponse>;
    revokeIntermediateAttestation(url: string, params: RevokeIntermediateAttestationParams): Promise<AttestationResponse>;
    revokeLeafAttestation(url: string, params: RevokeLeafAttestationParams): Promise<AttestationResponse>;
    revokeAttestationUnchecked(url: string, params: RevokeAttestationUncheckedParams): Promise<AttestationResponse>;
}


export type SignedData = {
    payload: string;
    attestationPath: string[];
    attestationContext: string;
    creatorAccount: string;
    signature: string;
};

export type SignDataParams = {
    passphrase: string;
    attestationPath?: string[];
    attestationContext: string;
    payload: string;
};


export type VerifySignedDataParams = {
    signedData: SignedData;
    trustedRootAccount: string;
    signedDataCheckCallback?: SignedDataCheckCallback;
    entityCheckCallback?: EntityCheckCallback;
};

export type SignedDataCheckCallback = (signedDataCheck: SignedDataCheckParams) => boolean;
export type EntityCheckCallback = (entity: EntityCheckParams) => boolean;


export type VerifySignedDataResponse = {
    activeRootAccount: string;
    verifiedTrustChain: string[];
};

export type EntityCheckParams = {
    account: string;
    entityType: EntityType;
    state: State;
    payload: string;
    protocolVersion: string;
};

export type SignedDataCheckParams = {
    signedData: SignedData;
    signatureTime: number;
};


export interface IData {
    signData(params: SignDataParams, forTestnet?: boolean): SignedData;
    verifySignedData(url: string, params: VerifySignedDataParams, forTestnet?: boolean): Promise<VerifySignedDataResponse>;
}


export type GetEntityParams = {
    account: string;
    attestor?: string;
    attestationContext: string;
};

export type GetEntityResponse = {
    account: string;
    attestationContext: string;
    entityType: EntityType;
    state: State;
    payload: string;
    protocolVersion: string;
    redirectAccount: string;
};


export interface IEntity {
    getEntity(url: string, params: GetEntityParams): Promise<GetEntityResponse>;
}