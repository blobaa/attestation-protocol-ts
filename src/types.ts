import { type } from "os";

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

export type objectAny = {[name: string]: any};


export type Error = {
    code: ErrorCode;
    description: string;
};

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
    WRONG_CREATOR_ACCOUNT,
    CREATOR_ACCOUNT_DEPRECATED,

    SIGNED_DATA_CALLBACK_ERROR,
    ENTITY_CALLBACK_ERROR,

    TOO_MANY_DEPRECATION_HOPS,
    ENTITY_MISMATCH,

    TRUSTED_ROOT_NOT_FOUND
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
};

export type CreateIntermediateAttestationParams = {
    passphrase: string;
    attestationContext: string;
    intermediateAccount: string;
    myAttestorAccount?: string;
    payload?: string;
};

export type CreateLeafAttestationParams = {
    passphrase: string;
    attestationContext: string;
    leafAccount: string;
    myAttestorAccount?: string;
    payload?: string;
};

export type CreateAttestationUncheckedParams = {
    passphrase: string;
    attestationContext: string;
    account: string;
    entityType: EntityType;
    payload?: string;
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
};

export type UpdateIntermediateAttestationParams = {
    passphrase: string;
    attestationContext: string;
    intermediateAccount: string;
    myAttestorAccount?: string;
    newPayload?: string;
    newState?: State.ACTIVE | State.INACTIVE;
    newIntermediateAccount?: string;
};

export type UpdateLeafAttestationParams = {
    passphrase: string;
    attestationContext: string;
    leafAccount: string;
    myAttestorAccount?: string;
    newPayload?: string;
    newState?: State.ACTIVE | State.INACTIVE;
    newLeafAccount?: string;
};


export type RevokeRootAttestationParams = {
    passphrase: string;
    attestationContext: string;
};

export type RevokeIntermediateAttestationParams = {
    passphrase: string;
    attestationContext: string;
    intermediateAccount?: string;
};

export type RevokeLeafAttestationParams = {
    passphrase: string;
    attestationContext: string;
    leafAccount?: string;
};

export type RevokeAttestationUncheckedParams = {
    passphrase: string;
    attestationContext: string;
    account: string;
};


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
    signedDataCheckCallback?: (signedDataCheck: SignedDataCheckParams) => boolean;
    entityCheckCallback?: (entity: EntityCheckParams) => boolean;
};

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
    signData: (params: SignDataParams, forTestnet?: boolean) => SignedData;
    verifySignedData: (url: string, params: VerifySignedDataParams, forTestnet?: boolean) => Promise<VerifySignedDataResponse>;
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
    getEntity: (url: string, params: GetEntityParams) => Promise<GetEntityResponse>;
}
