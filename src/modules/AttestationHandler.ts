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

import { account, ChainId, DeleteAccountPropertyParams, DeleteAccountPropertyResponse, IRequest, Request, SetAccountPropertyParams, SetAccountPropertyResponse } from "@somedotone/ardor-ts";
import { ACCOUNT_PREFIX, noError } from "../constants";
import { AttestationResponse, CreateAttestationUncheckedParams, CreateIntermediateAttestationParams, CreateLeafAttestationParams, CreateRootAttestationParams, EntityType, Error, ErrorCode, IAttestation, objectAny, RevokeAttestationUncheckedParams, RevokeIntermediateAttestationParams, RevokeLeafAttestationParams, RevokeRootAttestationParams, State, UpdateIntermediateAttestationParams, UpdateLeafAttestationParams, UpdateRootAttestationParams } from "../types";
import DataFields from "./lib/DataFields";
import Helper from "./lib/Helper";


export default class AttestationHandler implements IAttestation {

    private request: IRequest;



    constructor(request = new Request()) {
        this.request = request;
    }


    public createRootAttestation = async (url: string, params: CreateRootAttestationParams): Promise<AttestationResponse> => {
        try {
            const response = await this.createAttestation(url, params, EntityType.ROOT);
            return Promise.resolve({ transactionId: response.fullHash });
        } catch (error) {
            return Promise.reject(Helper.getError(error));
        }
    }

    private createAttestation = async (url: string, params: objectAny, entityType: EntityType, skipChecks= false): Promise<SetAccountPropertyResponse> => {
        const dataFields = new DataFields();

        params.payload = params.payload || "";
        let error = dataFields.checkPayload(params.payload);
        if (error.code !== ErrorCode.NO_ERROR) return Promise.reject(error);


        if (!skipChecks) {
            const myAccount = account.convertPassphraseToAccountRs(params.passphrase);
            const attestorAccount = params.myAttestorAccount && params.myAttestorAccount || myAccount;

            if (this.isNotRootAttestation(params)) {
                if (myAccount === this.getRecipient(params)) return Promise.reject({ code: ErrorCode.SELF_ATTESTATION_NOT_ALLOWED, description: "Self attestation is not allowed. Only a root entity is permitted to self attest." });
                error = await this.checkOwnEntityAndState(url, myAccount, attestorAccount, dataFields.setAttestationContext(params.attestationContext), new DataFields(), false, entityType);
                if (error.code !== ErrorCode.NO_ERROR) return Promise.reject(error);

            } else {
                error = await this.checkRootAttestation(url, myAccount, attestorAccount, dataFields.setAttestationContext(params.attestationContext));
                if (error.code !== ErrorCode.NO_ERROR) return Promise.reject(error);
            }
        }


        dataFields.attestationContext = params.attestationContext;
        dataFields.state = State.ACTIVE;
        dataFields.entityType = entityType;
        dataFields.payload = params.payload;

        return this.createAttestationTransaction(url, params.passphrase, this.getRecipient(params), dataFields);
    }

    private isNotRootAttestation = (params: objectAny): boolean => {
        return (params.intermediateAccount || params.leafAccount);
    }

    private checkOwnEntityAndState = async (url: string, myAccount: string, attestorAccount: string, attestationContext: string, dataFields: DataFields, isStateUpdate: boolean, entity: EntityType): Promise<Error> => {
        try {
            dataFields.attestationContext = attestationContext;

            const response = await this.request.getAccountProperties(url, { setter: attestorAccount, recipient: myAccount, property: dataFields.attestationContext });
            const propertyObject = response.properties[0];
            if (!propertyObject) return { code: ErrorCode.ATTESTATION_CONTEXT_NOT_FOUND, description: "Attestation context not found. The specified attestation context could not be found at account '" + myAccount + "'." };

            const error = dataFields.consumeDataFieldString(propertyObject.value);
            if (error.code !== ErrorCode.NO_ERROR) return Promise.reject(error);

            if (dataFields.entityType === EntityType.LEAF) return Promise.reject({ code: ErrorCode.ATTESTATION_NOT_ALLOWED, description: "Attestation not allowed. A leaf entity is not allowed to attest." });
            if (dataFields.state !== State.ACTIVE && !isStateUpdate) return Promise.reject({ code: ErrorCode.ENTITY_NOT_ACTIVE, description: "Entity is not active. An entity must be in state active to attest." });
            if (!this.isEntityPermitted(dataFields.entityType, entity)) return Promise.reject({ code: ErrorCode.ATTESTATION_NOT_ALLOWED, description: "Attestation not allowed. A " + this.getEntityTypeName(dataFields.entityType) + " entity is not allowed to attest a " + this.getEntityTypeName(entity) + "." });

        } catch (error) {
            return Promise.reject(Helper.getError(error));
        }

        return noError;
    }

    private checkRootAttestation = async (url: string, myAccount: string, attestorAccount: string, attestationContext: string): Promise<Error> => {
        try {
            const response = await this.request.getAccountProperties(url, { setter: attestorAccount, recipient: myAccount, property: attestationContext });
            const propertyObject = response.properties[0];
            if (propertyObject) return {code: ErrorCode.ATTESTATION_CONTEXT_ALREADY_SET, description: "Attestation context already set. The new account already has a property with name '" + attestationContext + "' set by account '" + attestorAccount + "'." };

        } catch (error) {
            return Promise.reject(Helper.getError(error));
        }

        return noError;
    }

    private createAttestationTransaction = async (url: string, passphrase: string, accountToAttest: string, dataFields: DataFields ): Promise<SetAccountPropertyResponse> => {
        const propertyRequestParams: SetAccountPropertyParams = {
            chain: ChainId.IGNIS,
            property: dataFields.attestationContext,
            recipient: accountToAttest,
            secretPhrase: passphrase,
            value: dataFields.createDataFieldsString()
        };
        return this.request.setAccountProperty(url, propertyRequestParams);
    }

    private getRecipient = (params: objectAny): string => {
        if (params.intermediateAccount) return params.intermediateAccount;
        if (params.leafAccount) return params.leafAccount;
        return account.convertPassphraseToAccountRs(params.passphrase);
    }


    public createIntermediateAttestation = async (url: string, params: CreateIntermediateAttestationParams): Promise<AttestationResponse> => {
        try {
            const response = await this.createAttestation(url, params, EntityType.INTERMEDIATE);
            return Promise.resolve({ transactionId: response.fullHash });
        } catch (error) {
            return Promise.reject(Helper.getError(error));
        }
    }


    public createLeafAttestation = async (url: string, params: CreateLeafAttestationParams): Promise<AttestationResponse> => {
        try {
            const response = await this.createAttestation(url, params, EntityType.LEAF);
            return Promise.resolve({ transactionId: response.fullHash });
        } catch (error) {
            return Promise.reject(Helper.getError(error));
        }
    }


    public createAttestationUnchecked = async (url: string, params: CreateAttestationUncheckedParams): Promise<AttestationResponse> => {
        const _params = { ...params } as objectAny;

        if (params.entityType === EntityType.INTERMEDIATE) _params.intermediateAccount = params.account;
        if (params.entityType === EntityType.LEAF) _params.leafAccount = params.account;

        delete _params.account;
        delete _params.entityType;


        try {
            const response = await this.createAttestation(url, _params, params.entityType, true);
            return Promise.resolve({ transactionId: response.fullHash });
        } catch (error) {
            return Promise.reject(Helper.getError(error));
        }
    }


    public updateRootAttestation = async (url: string, params: UpdateRootAttestationParams): Promise<AttestationResponse> => {
        try {
            const response = await this.updateAttestation(url, params, EntityType.ROOT);
            return Promise.resolve({ transactionId: response.fullHash });
        } catch (error) {
            return Promise.reject(Helper.getError(error));
        }
    }

    private updateAttestation = async (url: string, params: objectAny, entity: EntityType): Promise<SetAccountPropertyResponse> => {
        const ownDataFields = new DataFields();
        let isStateUpdate = false;
        if (params.newState) isStateUpdate = true;

        const myAccount = account.convertPassphraseToAccountRs(params.passphrase);
        const attestorAccount = params.myAttestorAccount && params.myAttestorAccount || myAccount;

        let error = await this.checkOwnEntityAndState(url, myAccount, attestorAccount, ownDataFields.setAttestationContext(params.attestationContext), ownDataFields, isStateUpdate, entity);
        if (error.code !== ErrorCode.NO_ERROR) return Promise.reject(error);


        let oldDataFields = new DataFields();

        if (entity !== EntityType.ROOT) {
            error = await this.checkAttestedEntityAndState(url, this.getRecipient(params), myAccount, ownDataFields.attestationContext, oldDataFields, isStateUpdate, entity);
            if (error.code !== ErrorCode.NO_ERROR) return Promise.reject(error);
        } else {
            oldDataFields = ownDataFields;
        }


        const newDataFields = new DataFields(oldDataFields);

        if (params.newState) {
            if (params.newState === oldDataFields.state) return Promise.reject({ code: ErrorCode.STATE_ALREADY_SET, description: "State already set. Your requested state has the same value as the current state." });
            if (params.newState === State.DEPRECATED) return Promise.reject({ code: ErrorCode.DEPRECATE_STATE_CANNOT_BE_SET, description: "Deprecate state cannot be set directly. Set redirect account instead." });
            newDataFields.state = params.newState;
        }

        if (params.newPayload) {
            error = oldDataFields.checkPayload(params.newPayload);
            if (error.code !== ErrorCode.NO_ERROR) return Promise.reject(error);
            if (params.newPayload === oldDataFields.payload) return Promise.reject({ code: ErrorCode.PAYLOAD_ALREADY_SET, description: "Payload already set. Your requested payload has the same value as the current payload." });
            newDataFields.payload = params.newPayload;
        }


        if (this.isDeprecationRequest(params)) {
            const newAttestedAccount = this.getNewRecipient(params);

            oldDataFields.state = State.DEPRECATED;
            oldDataFields.redirectAccount = newAttestedAccount.substring(ACCOUNT_PREFIX.length);
            newDataFields.state = State.ACTIVE;

            const accountCheckError = await this.checkNewAttestedAccount(url, newAttestedAccount, oldDataFields.attestationContext, myAccount);
            if (accountCheckError.code !== ErrorCode.NO_ERROR) return Promise.reject(accountCheckError);

            return Promise.all([
                this.createAttestationTransaction(url, params.passphrase, newAttestedAccount, newDataFields),
                this.createAttestationTransaction(url, params.passphrase, this.getRecipient(params), oldDataFields)
            ]).then(value => Promise.resolve(value[0]));

        } else {
            return this.createAttestationTransaction(url, params.passphrase, this.getRecipient(params), newDataFields);
        }
    }

    private isEntityPermitted = (attestorEntity: EntityType, myEntity: EntityType): boolean => {
        if (myEntity === EntityType.ROOT) return attestorEntity === EntityType.ROOT;
        if (myEntity === EntityType.INTERMEDIATE) return (attestorEntity === EntityType.INTERMEDIATE || attestorEntity === EntityType.ROOT);
        if (myEntity === EntityType.LEAF) return (attestorEntity === EntityType.INTERMEDIATE || attestorEntity === EntityType.ROOT);
        return false;
    }

    private getEntityTypeName = (entityType: EntityType): string => {
        if (entityType == EntityType.ROOT) return "root";
        if (entityType == EntityType.INTERMEDIATE) return "intermediate";
        if (entityType == EntityType.LEAF) return "leaf";
        return "";
    }

    private checkAttestedEntityAndState = async (url: string, attestedAccount: string, attestor: string, attestationContext: string, dataFields = new DataFields(), isStateUpdate: boolean, entity: EntityType): Promise<Error> => {
        try {
            dataFields.attestationContext = attestationContext;

            const response = await this.request.getAccountProperties(url, { recipient: attestedAccount, setter: attestor, property: dataFields.attestationContext });
            const propertyObject = response.properties[0];
            if (!propertyObject) return { code: ErrorCode.ATTESTATION_CONTEXT_NOT_FOUND, description: "Attestation context not found. The specified attestation context could not be found for account '" + attestedAccount + "'." };

            const error = dataFields.consumeDataFieldString(propertyObject.value);
            if (error.code !== ErrorCode.NO_ERROR) return Promise.reject(error);

            if (dataFields.state !== State.ACTIVE && !isStateUpdate) return Promise.reject({ code: ErrorCode.ENTITY_NOT_ACTIVE, description: "Entity is not active. Inactive entities cannot be updated." });
            if (dataFields.entityType !== entity) return Promise.reject({ code: ErrorCode.WRONG_ENTITY_TYPE, description: "Wrong entity type. Entity '" + this.getEntityTypeName(dataFields.entityType) + "' does not match with your request." });
        } catch (error) {
            return Promise.reject(Helper.getError(error));
        }

        return noError;
    }

    private isDeprecationRequest = (params: objectAny): boolean => {
        return (params.newRootAccount || params.newIntermediateAccount || params.newLeafAccount);
    }

    private getNewRecipient = (params: objectAny): string => {
        if (params.newIntermediateAccount) return params.newIntermediateAccount;
        if (params.newLeafAccount) return params.newLeafAccount;
        if (params.newRootAccount) return params.newRootAccount;
        return "";
    }

    private checkNewAttestedAccount = async (url: string, newAccount: string, attestationContext: string, myAccount: string): Promise<Error> => {
        try {
            const response = await this.request.getAccountProperties(url, { recipient: newAccount, property: attestationContext, setter: myAccount });
            if (response.properties.length !== 0) return Promise.resolve({ code: ErrorCode.ATTESTATION_CONTEXT_ALREADY_SET, description: "Attestation context already set. The new account '" + newAccount + "' already has a property with the name '" + myAccount + "' set by '" + attestationContext + "'." });
            return Promise.resolve(noError);
        } catch (error) {
            return Promise.reject(Helper.getError(error));
        }
    }


    public updateIntermediateAttestation = async (url: string, params: UpdateIntermediateAttestationParams): Promise<AttestationResponse> => {
        try {
            const response = await this.updateAttestation(url, params, EntityType.INTERMEDIATE);
            return Promise.resolve({ transactionId: response.fullHash });
        } catch (error) {
            return Promise.reject(Helper.getError(error));
        }
    }


    public updateLeafAttestation = async (url: string, params: UpdateLeafAttestationParams): Promise<AttestationResponse> => {
        try {
            const response = await this.updateAttestation(url, params, EntityType.LEAF);
            return Promise.resolve({ transactionId: response.fullHash });
        } catch (error) {
            return Promise.reject(Helper.getError(error));
        }
    }


    public revokeRootAttestation = async (url: string, params: RevokeRootAttestationParams): Promise<AttestationResponse> => {
        try {
            const response = await this.revokeAttestation(url, params, EntityType.ROOT);
            return Promise.resolve({ transactionId: response.fullHash });
        } catch (error) {
            return Promise.reject(Helper.getError(error));
        }
    }

    private revokeAttestation = async (url: string, params: objectAny, entityType: EntityType, skipChecks= false): Promise<DeleteAccountPropertyResponse> => {
        const dataFields = new DataFields();
        dataFields.attestationContext = params.attestationContext;
        let recipient = params.account && params.account || "";


        if (!skipChecks) {
            const myAccount = account.convertPassphraseToAccountRs(params.passphrase);
            recipient = this.getRecipient(params);

            const error = await this.checkRevokeAttestation(url, recipient, myAccount, dataFields.attestationContext, entityType);
            if (error.code !== ErrorCode.NO_ERROR) return Promise.reject(error);

        } else {
            recipient = params.account;
        }

        return this.createRevokeTransaction(url, params.passphrase, recipient, dataFields.attestationContext);
    }

    private checkRevokeAttestation = async (url: string, attestedAccount: string, attestorAccount: string, attestationContext: string, entityType: EntityType): Promise<Error> => {
        try {
            const response = await this.request.getAccountProperties(url, { setter: attestorAccount, recipient: attestedAccount, property: attestationContext });
            const propertyObject = response.properties[0];
            if (!propertyObject) return { code: ErrorCode.ATTESTATION_CONTEXT_NOT_FOUND, description: "Attestation context not found. The specified attestation context could not be found at account '" + attestedAccount + "'."  };

            const dataFields = new DataFields();
            const error = dataFields.consumeDataFieldString(propertyObject.value);
            if (error.code !== ErrorCode.NO_ERROR) return error;

            if (dataFields.entityType !== entityType) return { code: ErrorCode.ENTITY_MISMATCH, description: "Entity mismatch. You're trying to revoke a '" + this.getEntityTypeName(entityType) + "' attestation, but the found attestation is of type '" + this.getEntityTypeName(dataFields.entityType) + "'." };

        } catch (error) {
            return Promise.reject(Helper.getError(error));
        }

        return noError;
    }

    private createRevokeTransaction = (url: string, passphrase: string, attestedAccount: string, attestationContext: string): Promise<SetAccountPropertyResponse> => {
        const propertyRequestParams: DeleteAccountPropertyParams = {
            chain: ChainId.IGNIS,
            property: attestationContext,
            recipient: attestedAccount,
            secretPhrase: passphrase
        };
        return this.request.deleteAccountProperty(url, propertyRequestParams);
    }


    public revokeIntermediateAttestation = async (url: string, params: RevokeIntermediateAttestationParams): Promise<AttestationResponse> => {
        try {
            const response = await this.revokeAttestation(url, params, EntityType.INTERMEDIATE);
            return Promise.resolve({ transactionId: response.fullHash });
        } catch (error) {
            return Promise.reject(Helper.getError(error));
        }
    }


    public revokeLeafAttestation = async (url: string, params: RevokeLeafAttestationParams): Promise<AttestationResponse> => {
        try {
            const response = await this.revokeAttestation(url, params, EntityType.LEAF);
            return Promise.resolve({ transactionId: response.fullHash });
        } catch (error) {
            return Promise.reject(Helper.getError(error));
        }
    }


    public revokeAttestationUnchecked = async (url: string, params: RevokeAttestationUncheckedParams): Promise<AttestationResponse> => {
        try {
            const response = await this.revokeAttestation(url, params, EntityType.LEAF, true);
            return Promise.resolve({ transactionId: response.fullHash });
        } catch (error) {
            return Promise.reject(Helper.getError(error));
        }
    }
}
