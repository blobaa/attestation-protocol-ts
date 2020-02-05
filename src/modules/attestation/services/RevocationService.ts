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

import { account, ChainId, DeleteAccountPropertyParams, DeleteAccountPropertyResponse, IRequest } from "@somedotone/ardor-ts";
import { EntityType, ErrorCode } from "../../..";
import { AttestationResponse } from "../../../types";
import DataFields from "../../lib/DataFields";
import Helper from "../../lib/Helper";
import { IAttestationService, objectAny } from "../../internal-types";
import ServiceHelper from "./utils/ServiceHelper";


export default class RevocationService implements IAttestationService {
    private readonly request: IRequest;
    private readonly helper: ServiceHelper;


    constructor(request: IRequest) {
        this.request = request;
        this.helper = new ServiceHelper(request);
    }


    public async run(url: string, params: objectAny, entityType: EntityType, runChecks: boolean): Promise<AttestationResponse> {
        if (runChecks) {
            return this.revoke(url, params, entityType, true);
        } else {
            return await this.revoke(url, params, EntityType.LEAF, false);
        }
    }

    public async revoke(url: string, params: objectAny, entityType: EntityType, runChecks: boolean): Promise<AttestationResponse> {
        const dataFields = new DataFields();
        dataFields.attestationContext = params.attestationContext;
        let recipient = "";


        if (runChecks) {
            await this.checkRevokeAttestation(url, params, entityType);
            recipient = this.helper.getRecipient(params);
        } else {
            recipient = params.account;
        }


        return await this.revokeAttestation(url, params, recipient);
    }

    private async checkRevokeAttestation(url: string, params: objectAny, entityType: EntityType): Promise<void> {
        const attestedAccount = this.helper.getRecipient(params);
        const attestorAccount = account.convertPassphraseToAccountRs(params.passphrase);
        const dataFields = new DataFields();
        const attestationContext = dataFields.setAttestationContext(params.attestationContext);

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

            const error = dataFields.consumeDataFieldString(propertyObject.value);
            if (error.code !== ErrorCode.NO_ERROR) {
                return Promise.reject(error);
            }

            if (dataFields.entityType !== entityType) {
                const setTypeName = this.helper.getEntityTypeName(entityType);
                const foundTypeName = this.helper.getEntityTypeName(dataFields.entityType);
                const _error = Helper.createError(ErrorCode.ENTITY_MISMATCH, [ setTypeName, foundTypeName ]);
                return Promise.reject(_error);
            }

        } catch (error) {
            return Promise.reject(Helper.getError(error));
        }
    }

    private async createRevokeTransaction(url: string, params: objectAny, attestedAccount: string): Promise<DeleteAccountPropertyResponse> {
        const passphrase = params.passphrase;
        const dataFields = new DataFields();
        const attestationContext = dataFields.setAttestationContext(params.attestationContext);

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

    private async revokeAttestation(url: string, params: objectAny, recipient: string): Promise<AttestationResponse> {
        const response = await this.createRevokeTransaction(url, params, recipient);
        return { transactionId: response.fullHash };
    }
}