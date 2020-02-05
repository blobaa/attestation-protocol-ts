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

import { account, IRequest } from "@somedotone/ardor-ts";
import { EntityType, ErrorCode, State } from "../../..";
import { ACCOUNT_PREFIX } from "../../../constants";
import { AttestationResponse } from "../../../types";
import DataFields from "../../lib/DataFields";
import Helper from "../../lib/Helper";
import { IAttestationService, objectAny } from "../../internal-types";
import ServiceHelper from "./utils/ServiceHelper";


export default class UpdateService implements IAttestationService {
    private readonly request: IRequest;
    private readonly helper: ServiceHelper;


    constructor(request: IRequest) {
        this.request = request;
        this.helper = new ServiceHelper(request);
    }


    public async run(url: string, params: objectAny, entity: EntityType): Promise<AttestationResponse> {
        const currentDataFields = await this.checkEntitiesAndGetCurrentDataFields(url, params, entity);
        const newDataFields = new DataFields(currentDataFields);

        if (params.newState) {
            await this.checkNewState(params.newState, currentDataFields.state);
            newDataFields.state = params.newState;
        }

        if (params.newPayload) {
            await this.checkNewPayload(params.newPayload, currentDataFields.payload);
            newDataFields.payload = params.newPayload;
        }


        if (this.isDeprecationRequest(params)) {
            return await this.deprecateAccount(url, params, currentDataFields, newDataFields);
        } else {
            return await this.updateDataFields(url, params, newDataFields);
        }
    }

    private async checkEntitiesAndGetCurrentDataFields(url: string, params: objectAny, entity: EntityType): Promise<DataFields> {
        const ownDataFields = new DataFields();
        const isStateUpdate = params.newState || false;

        const myAccount = account.convertPassphraseToAccountRs(params.passphrase);
        const attestorAccount = params.myAttestorAccount || myAccount;
        const attestationContext = ownDataFields.setAttestationContext(params.attestationContext);

        await this.helper.checkOwnEntityAndState(url, myAccount, attestorAccount, attestationContext, ownDataFields, isStateUpdate, entity);


        let currentDataFields = new DataFields();

        if (entity !== EntityType.ROOT) {
            const recipient = this.helper.getRecipient(params);
            await this.checkAttestedEntityAndState(url, recipient, myAccount, attestationContext, currentDataFields, isStateUpdate, entity);
        } else {
            currentDataFields = ownDataFields;
        }

        return currentDataFields;
    }

    private async checkAttestedEntityAndState(url: string, attestedAccount: string, attestor: string, attestationContext: string,
                                                 dataFields = new DataFields(), isStateUpdate: boolean, entity: EntityType): Promise<void> {
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
            if (error.code !== ErrorCode.NO_ERROR) {
                return Promise.reject(error);
            }

            if (dataFields.state !== State.ACTIVE && !isStateUpdate) {
                const _error = Helper.createError(ErrorCode.ENTITY_NOT_ACTIVE);
                return Promise.reject(_error);
            }
            if (dataFields.entityType !== entity) {
                const entityTypeName = this.helper.getEntityTypeName(dataFields.entityType);
                const _error = Helper.createError(ErrorCode.WRONG_ENTITY_TYPE, [ entityTypeName ]);
                return Promise.reject(_error);
            }
        } catch (error) {
            return Promise.reject(Helper.getError(error));
        }
    }

    private async checkNewState(newState: State, currentState: State): Promise<void> {
        if (newState === currentState) {
            const _error = Helper.createError(ErrorCode.STATE_ALREADY_SET);
            return Promise.reject(_error);
        }
        if (newState === State.DEPRECATED) {
            const _error = Helper.createError(ErrorCode.DEPRECATE_STATE_CANNOT_BE_SET);
            return Promise.reject(_error);
        }
    }

    private async checkNewPayload(newPayload: string, currentPayload: string): Promise<void> {
        const dataFields = new DataFields();
        const error = dataFields.checkPayload(newPayload);

        if (error.code !== ErrorCode.NO_ERROR) {
            return Promise.reject(error);
        }
        if (newPayload === currentPayload) {
            const _error = Helper.createError(ErrorCode.PAYLOAD_ALREADY_SET);
            return Promise.reject(_error);
        }
    }

    private isDeprecationRequest(params: objectAny): boolean {
        return (params.newRootAccount || params.newIntermediateAccount || params.newLeafAccount);
    }

    private async deprecateAccount(url: string, params: objectAny, currentDataFields: DataFields, newDataFields: DataFields): Promise<AttestationResponse> {
        const newAttestedAccount = this.getNewRecipient(params);

        currentDataFields.state = State.DEPRECATED;
        currentDataFields.redirectAccount = newAttestedAccount.substring(ACCOUNT_PREFIX.length);
        newDataFields.state = State.ACTIVE;
        const myAccount = account.convertPassphraseToAccountRs(params.passphrase);
        await this.checkNewAttestedAccount(url, newAttestedAccount, currentDataFields.attestationContext, myAccount);


        try {
            const responses = await Promise.all([
                this.helper.createAttestationTransaction(url, params.passphrase, newAttestedAccount, newDataFields),
                this.helper.createAttestationTransaction(url, params.passphrase, this.helper.getRecipient(params), currentDataFields)
            ]);
            return { transactionId: responses[0].fullHash };
        } catch (e) {
            return Promise.reject(Helper.getError(e));
        }
    }

    private getNewRecipient(params: objectAny): string {
        if (params.newIntermediateAccount) {
            return params.newIntermediateAccount;
        }
        if (params.newLeafAccount) {
            return params.newLeafAccount;
        }
        if (params.newRootAccount) {
            return params.newRootAccount;
        }
        return "";
    }

    private async checkNewAttestedAccount(url: string, newAccount: string, attestationContext: string, myAccount: string): Promise<void> {
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

    private async updateDataFields(url: string, params: objectAny, newDataFields: DataFields): Promise<AttestationResponse> {
        try {
            const response = await this.helper.createAttestationTransaction(url, params.passphrase, this.helper.getRecipient(params), newDataFields);
            return { transactionId: response.fullHash };
        } catch (e) {
            return Promise.reject(Helper.getError(e));
        }
    }
}