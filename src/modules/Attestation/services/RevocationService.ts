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
import { EntityType, ErrorCode, objectAny } from "../../..";
import { AttestationResponse, RevokeAttestationUncheckedParams } from "../../../types";
import DataFields from "../../lib/DataFields";
import Helper from "../../lib/Helper";
import ServiceHelper from "./utils/ServiceHelper";


export default class RevocationService {
    private readonly request: IRequest;
    private readonly helper: ServiceHelper;


    constructor(request: IRequest) {
        this.request = request;
        this.helper = new ServiceHelper(request);
    }


    public async revoke(url: string, params: objectAny, entityType: EntityType, runChecks = true): Promise<AttestationResponse> {
        const dataFields = new DataFields();
        dataFields.attestationContext = params.attestationContext;
        let recipient = (params.account && params.account) || "";


        if (runChecks) {
            const myAccount = account.convertPassphraseToAccountRs(params.passphrase);
            recipient = this.helper.getRecipient(params);
            await this.checkRevokeAttestation(url, recipient, myAccount, dataFields.attestationContext, entityType);
        } else {
            recipient = params.account;
        }

        const response = await this.createRevokeTransaction(url, params.passphrase, recipient, dataFields.attestationContext);
        return { transactionId: response.fullHash };
    }

    private async checkRevokeAttestation(url: string, attestedAccount: string, attestorAccount: string,
                                            attestationContext: string, entityType: EntityType): Promise<void> {
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
            if (error.code !== ErrorCode.NO_ERROR) {return Promise.reject(error)}

            if (dataFields.entityType !== entityType) {
                const settedTypeName = this.helper.getEntityTypeName(entityType);
                const foundTypeName = this.helper.getEntityTypeName(dataFields.entityType);
                const _error = Helper.createError(ErrorCode.ENTITY_MISMATCH, [ settedTypeName, foundTypeName ]);
                return Promise.reject(_error);
            }

        } catch (error) {
            return Promise.reject(Helper.getError(error));
        }
    }

    private async createRevokeTransaction(url: string, passphrase: string,
                                       attestedAccount: string, attestationContext: string): Promise<DeleteAccountPropertyResponse> {
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


    public async revokeUnchecked(url: string, params: RevokeAttestationUncheckedParams): Promise<AttestationResponse> {
        return await this.revoke(url, params, EntityType.LEAF, false);
    }
}