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

import { account, ChainId, IRequest, SetAccountPropertyParams, SetAccountPropertyResponse, DeleteAccountPropertyResponse, DeleteAccountPropertyParams } from "@somedotone/ardor-ts";
import { EntityType, ErrorCode, State } from "../../../..";
import DataFields from "../../../lib/DataFields";
import Helper from "../../../lib/Helper";
import { objectAny } from "../../../internal-types";


export default class ServiceHelper {
    private readonly request: IRequest;


    constructor(request: IRequest) {
        this.request = request;
    }


    public async checkOwnEntityAndState(url: string, myAccount: string, attestorAccount: string, attestationContext: string,
                                            dataFields: DataFields, isStateUpdate: boolean, entity: EntityType): Promise<void> {
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
            if (error.code !== ErrorCode.NO_ERROR) {
                return Promise.reject(error);
            }

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

    private isEntityPermitted(attestorEntity: EntityType, myEntity: EntityType): boolean {
        if (myEntity === EntityType.ROOT) {
            return attestorEntity === EntityType.ROOT;
        }
        if (myEntity === EntityType.INTERMEDIATE) {
            return (attestorEntity === EntityType.INTERMEDIATE || attestorEntity === EntityType.ROOT);
        }
        if (myEntity === EntityType.LEAF) {
            return (attestorEntity === EntityType.INTERMEDIATE || attestorEntity === EntityType.ROOT);
        }
        return false;
    }


    public getEntityTypeName(entityType: EntityType): string {
        if (entityType === EntityType.ROOT) {
            return "root";
        }
        if (entityType === EntityType.INTERMEDIATE) {
            return "intermediate";
        }
        if (entityType === EntityType.LEAF) {
            return "leaf";
        }
        return "";
    }


    public getRecipient(params: objectAny): string {
        if (params.intermediateAccount) {
            return params.intermediateAccount;
        }
        if (params.leafAccount) {
            return params.leafAccount;
        }
        return account.convertPassphraseToAccountRs(params.passphrase);
    }


    public async createAttestationTransaction(url: string, passphrase: string,
                                              accountToAttest: string, dataFields: DataFields,
                                              feeNQT?: number ): Promise<SetAccountPropertyResponse> {
        const propertyRequestParams: SetAccountPropertyParams = {
            chain: ChainId.IGNIS,
            property: dataFields.attestationContext,
            recipient: accountToAttest,
            secretPhrase: passphrase,
            value: dataFields.createDataFieldsString()
        };

        if (feeNQT) {
            propertyRequestParams.feeNQT = feeNQT;
        }

        try {
            return await this.request.setAccountProperty(url, propertyRequestParams);
        } catch (error) {
            return Promise.reject(Helper.getError(error));
        }
    }


    public async createRevokeTransaction(url: string, params: objectAny, attestedAccount: string, feeNQT?: number): Promise<DeleteAccountPropertyResponse> {
        const passphrase = params.passphrase;
        const dataFields = new DataFields();
        const attestationContext = dataFields.setAttestationContext(params.attestationContext);

        const propertyRequestParams: DeleteAccountPropertyParams = {
            chain: ChainId.IGNIS,
            property: attestationContext,
            recipient: attestedAccount,
            secretPhrase: passphrase
        };

        if (feeNQT) {
            propertyRequestParams.feeNQT = feeNQT;
        }

        try {
            return await this.request.deleteAccountProperty(url, propertyRequestParams);
        } catch (error) {
            return Promise.reject(Helper.getError(error));
        }
    }
}