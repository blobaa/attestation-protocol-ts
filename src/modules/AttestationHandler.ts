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
import { ACCOUNT_PREFIX } from "../constants";
import { AttestationResponse, CreateAttestationUncheckedParams, CreateIntermediateAttestationParams, CreateLeafAttestationParams, CreateRootAttestationParams, EntityType, ErrorCode, IAttestation, objectAny, RevokeAttestationUncheckedParams, RevokeIntermediateAttestationParams, RevokeLeafAttestationParams, RevokeRootAttestationParams, State, UpdateIntermediateAttestationParams, UpdateLeafAttestationParams, UpdateRootAttestationParams } from "../types";
import DataFields from "./lib/DataFields";
import Helper from "./lib/Helper";


export default class AttestationHandler implements IAttestation {

    private request: IRequest;



    constructor(request = new Request()) {
        this.request = request;
    }


    public createRootAttestation = async (url: string, params: CreateRootAttestationParams): Promise<AttestationResponse> => {
        const response = await this.createAttestation(url, params, EntityType.ROOT);
        return { transactionId: response.fullHash };
    }

    private createAttestation = async (url: string, params: objectAny, entityType: EntityType, runChecks = true): Promise<SetAccountPropertyResponse> => {
        const dataFields = new DataFields();

        params.payload = params.payload || "";
        const error = dataFields.checkPayload(params.payload);
        if (error.code !== ErrorCode.NO_ERROR) return Promise.reject(error);


        if (runChecks) {
            const myAccount = account.convertPassphraseToAccountRs(params.passphrase);
            const attestorAccount = (params.myAttestorAccount && params.myAttestorAccount) || myAccount;

            if (this.isNotRootAttestation(params)) {
                if (myAccount === this.getRecipient(params)) {
                    const _error = Helper.createError(ErrorCode.SELF_ATTESTATION_NOT_ALLOWED);
                    return Promise.reject(_error);
                }

                const attestationContext = dataFields.setAttestationContext(params.attestationContext);
                await this.checkOwnEntityAndState(url, myAccount, attestorAccount, attestationContext, new DataFields(), false, entityType);

            } else {
                 await this.checkRootAttestation(url, myAccount, attestorAccount, dataFields.setAttestationContext(params.attestationContext));
            }
        }


        dataFields.attestationContext = params.attestationContext;
        dataFields.state = State.ACTIVE;
        dataFields.entityType = entityType;
        dataFields.payload = params.payload;

        return await this.createAttestationTransaction(url, params.passphrase, this.getRecipient(params), dataFields);
    }

    private isNotRootAttestation = (params: objectAny): boolean => {
        return (params.intermediateAccount || params.leafAccount);
    }

    private checkOwnEntityAndState = async (url: string, myAccount: string, attestorAccount: string, attestationContext: string,
                                            dataFields: DataFields, isStateUpdate: boolean, entity: EntityType): Promise<void> => {
        try {
            dataFields.attestationContext = attestationContext;

            const response = await this.request.getAccountProperties(url, {
                    setter: attestorAccount,
                    recipient: myAccount,
                    property: dataFields.attestationContext
                });
            const propertyObject = response.properties[0];

            if (!propertyObject) {
                const _error = Helper.createError(ErrorCode.ATTESTATION_CONTEXT_NOT_FOUND, [ myAccount ]);
                return Promise.reject(_error);
            }

            const error = dataFields.consumeDataFieldString(propertyObject.value);
            if (error.code !== ErrorCode.NO_ERROR) return Promise.reject(error);

            if (dataFields.entityType === EntityType.LEAF) {
                const _error = Helper.createError(ErrorCode.ATTESTATION_NOT_ALLOWED);
                return Promise.reject(_error);
            }
            if (dataFields.state !== State.ACTIVE && !isStateUpdate) {
                const _error = Helper.createError(ErrorCode.ENTITY_NOT_ACTIVE);
                return Promise.reject(_error);
            }
            if (!this.isEntityPermitted(dataFields.entityType, entity)) {
                const entityType = this.getEntityTypeName(dataFields.entityType);
                const entityName = this.getEntityTypeName(entity);
                return Promise.reject(Helper.createError(ErrorCode.ATTESTATION_NOT_ALLOWED, [ entityType, entityName ]));
            }

        } catch (error) {
            return Promise.reject(Helper.getError(error));
        }
    }

    private checkRootAttestation = async (url: string, myAccount: string, attestorAccount: string, attestationContext: string): Promise<void> => {
        try {
            const response = await this.request.getAccountProperties(url, { setter: attestorAccount, recipient: myAccount, property: attestationContext });
            const propertyObject = response.properties[0];
            if (propertyObject) {
                const error = Helper.createError(ErrorCode.ATTESTATION_CONTEXT_ALREADY_SET, [myAccount, attestationContext, attestorAccount]);
                return Promise.reject(error);
            }
        } catch (error) {
            return Promise.reject(Helper.getError(error));
        }
    }

    private createAttestationTransaction = async (url: string, passphrase: string,
                                                  accountToAttest: string, dataFields: DataFields ): Promise<SetAccountPropertyResponse> => {
        const propertyRequestParams: SetAccountPropertyParams = {
            chain: ChainId.IGNIS,
            property: dataFields.attestationContext,
            recipient: accountToAttest,
            secretPhrase: passphrase,
            value: dataFields.createDataFieldsString()
        };

        try {
            return await this.request.setAccountProperty(url, propertyRequestParams);
        } catch (error) {
            return Promise.reject(Helper.getError(error));
        }
    }

    private getRecipient = (params: objectAny): string => {
        if (params.intermediateAccount) return params.intermediateAccount;
        if (params.leafAccount) return params.leafAccount;
        return account.convertPassphraseToAccountRs(params.passphrase);
    }


    public createIntermediateAttestation = async (url: string, params: CreateIntermediateAttestationParams): Promise<AttestationResponse> => {
        const response = await this.createAttestation(url, params, EntityType.INTERMEDIATE);
        return { transactionId: response.fullHash };
    }


    public createLeafAttestation = async (url: string, params: CreateLeafAttestationParams): Promise<AttestationResponse> => {
        const response = await this.createAttestation(url, params, EntityType.LEAF);
        return { transactionId: response.fullHash };
    }


    public createAttestationUnchecked = async (url: string, params: CreateAttestationUncheckedParams): Promise<AttestationResponse> => {
        const _params = { ...params } as objectAny;

        if (params.entityType === EntityType.INTERMEDIATE) _params.intermediateAccount = params.account;
        if (params.entityType === EntityType.LEAF) _params.leafAccount = params.account;

        delete _params.account;
        delete _params.entityType;


        const response = await this.createAttestation(url, _params, params.entityType, false);
        return { transactionId: response.fullHash };
    }


    public updateRootAttestation = async (url: string, params: UpdateRootAttestationParams): Promise<AttestationResponse> => {
        const response = await this.updateAttestation(url, params, EntityType.ROOT);
        return { transactionId: response.fullHash };
    }

    private updateAttestation = async (url: string, params: objectAny, entity: EntityType): Promise<SetAccountPropertyResponse> => {
        const ownDataFields = new DataFields();
        let isStateUpdate = false;
        if (params.newState) isStateUpdate = true;

        const myAccount = account.convertPassphraseToAccountRs(params.passphrase);
        const attestorAccount = (params.myAttestorAccount && params.myAttestorAccount) || myAccount;
        const attestationContext = ownDataFields.setAttestationContext(params.attestationContext);

        await this.checkOwnEntityAndState(url, myAccount, attestorAccount, attestationContext, ownDataFields, isStateUpdate, entity);


        let oldDataFields = new DataFields();

        if (entity !== EntityType.ROOT) {
            const recipient = this.getRecipient(params);
            await this.checkAttestedEntityAndState(url, recipient, myAccount, ownDataFields.attestationContext, oldDataFields, isStateUpdate, entity);
        } else {
            oldDataFields = ownDataFields;
        }


        const newDataFields = new DataFields(oldDataFields);

        if (params.newState) {
            if (params.newState === oldDataFields.state) {
                const _error = Helper.createError(ErrorCode.STATE_ALREADY_SET);
                return Promise.reject(_error);
            }
            if (params.newState === State.DEPRECATED) {
                const _error = Helper.createError(ErrorCode.DEPRECATE_STATE_CANNOT_BE_SET);
                return Promise.reject(_error);
            }
            newDataFields.state = params.newState;
        }

        if (params.newPayload) {
            const error = oldDataFields.checkPayload(params.newPayload);
            if (error.code !== ErrorCode.NO_ERROR) return Promise.reject(error);
            if (params.newPayload === oldDataFields.payload) {
                const _error = Helper.createError(ErrorCode.PAYLOAD_ALREADY_SET);
                return Promise.reject(_error);
            }
            newDataFields.payload = params.newPayload;
        }


        if (this.isDeprecationRequest(params)) {
            const newAttestedAccount = this.getNewRecipient(params);

            oldDataFields.state = State.DEPRECATED;
            oldDataFields.redirectAccount = newAttestedAccount.substring(ACCOUNT_PREFIX.length);
            newDataFields.state = State.ACTIVE;

            await this.checkNewAttestedAccount(url, newAttestedAccount, oldDataFields.attestationContext, myAccount);


            try {
                const responses = await Promise.all([
                    this.createAttestationTransaction(url, params.passphrase, newAttestedAccount, newDataFields),
                    this.createAttestationTransaction(url, params.passphrase, this.getRecipient(params), oldDataFields)
                ]);
                return responses[0];
            } catch (e) {
                return Promise.reject(Helper.getError(e));
            }
        } else {
            try {
                return this.createAttestationTransaction(url, params.passphrase, this.getRecipient(params), newDataFields);
            } catch (e) {
                return Promise.reject(Helper.getError(e));
            }
        }
    }

    private isEntityPermitted = (attestorEntity: EntityType, myEntity: EntityType): boolean => {
        if (myEntity === EntityType.ROOT) return attestorEntity === EntityType.ROOT;
        if (myEntity === EntityType.INTERMEDIATE) return (attestorEntity === EntityType.INTERMEDIATE || attestorEntity === EntityType.ROOT);
        if (myEntity === EntityType.LEAF) return (attestorEntity === EntityType.INTERMEDIATE || attestorEntity === EntityType.ROOT);
        return false;
    }

    private getEntityTypeName = (entityType: EntityType): string => {
        if (entityType === EntityType.ROOT) return "root";
        if (entityType === EntityType.INTERMEDIATE) return "intermediate";
        if (entityType === EntityType.LEAF) return "leaf";
        return "";
    }

    private checkAttestedEntityAndState = async (url: string, attestedAccount: string, attestor: string, attestationContext: string,
                                                 dataFields = new DataFields(), isStateUpdate: boolean, entity: EntityType): Promise<void> => {
        try {
            dataFields.attestationContext = attestationContext;

            const response = await this.request.getAccountProperties(url, {
                    recipient: attestedAccount,
                    setter: attestor,
                    property: dataFields.attestationContext
                });
            const propertyObject = response.properties[0];

            if (!propertyObject) {
                const _error = Helper.createError(ErrorCode.ATTESTATION_CONTEXT_NOT_FOUND, [ attestedAccount ]);
                return Promise.reject(_error);
            }

            const error = dataFields.consumeDataFieldString(propertyObject.value);
            if (error.code !== ErrorCode.NO_ERROR) return Promise.reject(error);

            if (dataFields.state !== State.ACTIVE && !isStateUpdate) {
                const _error = Helper.createError(ErrorCode.ENTITY_NOT_ACTIVE);
                return Promise.reject(_error);
            }
            if (dataFields.entityType !== entity) {
                const entityTypeName = this.getEntityTypeName(dataFields.entityType);
                const _error = Helper.createError(ErrorCode.WRONG_ENTITY_TYPE, [ entityTypeName ]);
                return Promise.reject(_error);
            }
        } catch (error) {
            return Promise.reject(Helper.getError(error));
        }
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

    private checkNewAttestedAccount = async (url: string, newAccount: string, attestationContext: string, myAccount: string): Promise<void> => {
        try {
            const response = await this.request.getAccountProperties(url, { recipient: newAccount, property: attestationContext, setter: myAccount });
            if (response.properties.length !== 0) {
                const error = Helper.createError(ErrorCode.ATTESTATION_CONTEXT_ALREADY_SET, [newAccount, attestationContext, myAccount]);
                return Promise.reject(error);
            }
        } catch (error) {
            return Promise.reject(Helper.getError(error));
        }
    }


    public updateIntermediateAttestation = async (url: string, params: UpdateIntermediateAttestationParams): Promise<AttestationResponse> => {
        const response = await this.updateAttestation(url, params, EntityType.INTERMEDIATE);
        return { transactionId: response.fullHash };
    }


    public updateLeafAttestation = async (url: string, params: UpdateLeafAttestationParams): Promise<AttestationResponse> => {
        const response = await this.updateAttestation(url, params, EntityType.LEAF);
        return { transactionId: response.fullHash };
    }


    public revokeRootAttestation = async (url: string, params: RevokeRootAttestationParams): Promise<AttestationResponse> => {
        const response = await this.revokeAttestation(url, params, EntityType.ROOT);
        return { transactionId: response.fullHash };
    }

    private revokeAttestation = async (url: string, params: objectAny, entityType: EntityType, runChecks = true): Promise<DeleteAccountPropertyResponse> => {
        const dataFields = new DataFields();
        dataFields.attestationContext = params.attestationContext;
        let recipient = (params.account && params.account) || "";


        if (runChecks) {
            const myAccount = account.convertPassphraseToAccountRs(params.passphrase);
            recipient = this.getRecipient(params);
            await this.checkRevokeAttestation(url, recipient, myAccount, dataFields.attestationContext, entityType);
        } else {
            recipient = params.account;
        }

        return await this.createRevokeTransaction(url, params.passphrase, recipient, dataFields.attestationContext);
    }

    private checkRevokeAttestation = async (url: string, attestedAccount: string, attestorAccount: string,
                                            attestationContext: string, entityType: EntityType): Promise<void> => {
        try {
            const response = await this.request.getAccountProperties(url, {
                    setter: attestorAccount,
                    recipient: attestedAccount,
                    property: attestationContext
                });
            const propertyObject = response.properties[0];

            if (!propertyObject) {
                const _error = Helper.createError(ErrorCode.ATTESTATION_CONTEXT_NOT_FOUND, [ attestedAccount ]);
                return Promise.reject(_error);
            }

            const dataFields = new DataFields();
            const error = dataFields.consumeDataFieldString(propertyObject.value);
            if (error.code !== ErrorCode.NO_ERROR) return Promise.reject(error);

            if (dataFields.entityType !== entityType) {
                const settedTypeName = this.getEntityTypeName(entityType);
                const foundTypeName = this.getEntityTypeName(dataFields.entityType);
                const _error = Helper.createError(ErrorCode.ENTITY_MISMATCH, [ settedTypeName, foundTypeName ]);
                return Promise.reject(_error);
            }

        } catch (error) {
            return Promise.reject(Helper.getError(error));
        }
    }

    private createRevokeTransaction = async (url: string, passphrase: string,
                                       attestedAccount: string, attestationContext: string): Promise<DeleteAccountPropertyResponse> => {
        const propertyRequestParams: DeleteAccountPropertyParams = {
            chain: ChainId.IGNIS,
            property: attestationContext,
            recipient: attestedAccount,
            secretPhrase: passphrase
        };
        try {
            return await this.request.deleteAccountProperty(url, propertyRequestParams);
        } catch (error) {
            return Promise.reject(Helper.getError(error));
        }
    }


    public revokeIntermediateAttestation = async (url: string, params: RevokeIntermediateAttestationParams): Promise<AttestationResponse> => {
        const response = await this.revokeAttestation(url, params, EntityType.INTERMEDIATE);
        return { transactionId: response.fullHash };
    }


    public revokeLeafAttestation = async (url: string, params: RevokeLeafAttestationParams): Promise<AttestationResponse> => {
        const response = await this.revokeAttestation(url, params, EntityType.LEAF);
        return { transactionId: response.fullHash };
    }


    public revokeAttestationUnchecked = async (url: string, params: RevokeAttestationUncheckedParams): Promise<AttestationResponse> => {
        const response = await this.revokeAttestation(url, params, EntityType.LEAF, false);
        return { transactionId: response.fullHash };
    }
}
