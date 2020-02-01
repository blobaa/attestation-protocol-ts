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
import { EntityType, ErrorCode, objectAny, State } from "../../..";
import { ACCOUNT_PREFIX } from "../../../constants";
import { AttestationResponse } from "../../../types";
import DataFields from "../../lib/DataFields";
import Helper from "../../lib/Helper";
import ServiceHelper from "./utils/ServiceHelper";


export default class UpdateService {
    private readonly request: IRequest;
    private readonly helper: ServiceHelper;


    constructor(request: IRequest) {
        this.request = request;
        this.helper = new ServiceHelper(request);
    }


    public async update(url: string, params: objectAny, entity: EntityType): Promise<AttestationResponse> {
        const ownDataFields = new DataFields();
        let isStateUpdate = false;
        if (params.newState) {isStateUpdate = true}

        const myAccount = account.convertPassphraseToAccountRs(params.passphrase);
        const attestorAccount = (params.myAttestorAccount && params.myAttestorAccount) || myAccount;
        const attestationContext = ownDataFields.setAttestationContext(params.attestationContext);


        await this.helper.checkOwnEntityAndState(url, myAccount, attestorAccount, attestationContext, ownDataFields, isStateUpdate, entity);


        let oldDataFields = new DataFields();

        if (entity !== EntityType.ROOT) {
            const recipient = this.helper.getRecipient(params);
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
            if (error.code !== ErrorCode.NO_ERROR) {return Promise.reject(error)}
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
                    this.helper.createAttestationTransaction(url, params.passphrase, newAttestedAccount, newDataFields),
                    this.helper.createAttestationTransaction(url, params.passphrase, this.helper.getRecipient(params), oldDataFields)
                ]);
                return { transactionId: responses[0].fullHash };
            } catch (e) {
                return Promise.reject(Helper.getError(e));
            }
        } else {
            try {
                const response = await this.helper.createAttestationTransaction(url, params.passphrase, this.helper.getRecipient(params), newDataFields);
                return { transactionId: response.fullHash };
            } catch (e) {
                return Promise.reject(Helper.getError(e));
            }
        }
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
            if (error.code !== ErrorCode.NO_ERROR) {return Promise.reject(error)}

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

    private isDeprecationRequest(params: objectAny): boolean {
        return (params.newRootAccount || params.newIntermediateAccount || params.newLeafAccount);
    }

    private getNewRecipient(params: objectAny): string {
        if (params.newIntermediateAccount) {return params.newIntermediateAccount}
        if (params.newLeafAccount) {return params.newLeafAccount}
        if (params.newRootAccount) {return params.newRootAccount}
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

}