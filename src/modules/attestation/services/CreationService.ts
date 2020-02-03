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
import { AttestationResponse, EntityType, ErrorCode, IAttestationService, objectAny, State } from "../../../types";
import DataFields from "../../lib/DataFields";
import Helper from "../../lib/Helper";
import ServiceHelper from "./utils/ServiceHelper";


export default class CreationService implements IAttestationService {
    private readonly request: IRequest;
    private readonly helper: ServiceHelper;


    constructor(request: IRequest) {
        this.request = request;
        this.helper = new ServiceHelper(request);
    }


    public async run(url: string, params: objectAny, entityType: EntityType, runChecks: boolean): Promise<AttestationResponse> {
        if (runChecks) {
            return await this.create(url, params, entityType, true);
        } else {
            const _params = { ...params };

            if (params.entityType === EntityType.INTERMEDIATE) {
                _params.intermediateAccount = params.account;
            }
            if (params.entityType === EntityType.LEAF) {
                _params.leafAccount = params.account;
            }

            delete _params.account;
            delete _params.entityType;

            return await this.create(url, _params, params.entityType, false);
        }
    }

    private async create(url: string, params: objectAny, entityType: EntityType, runChecks: boolean): Promise<AttestationResponse> {
        const dataFields = new DataFields();
        params.payload = params.payload || "";

        const error = dataFields.checkPayload(params.payload);
        if (error.code !== ErrorCode.NO_ERROR) {
            return Promise.reject(error);
        }


        if (runChecks && this.isNotRootAttestation(params)) {
            await this.checkNonRootAttestation(url, params, entityType);
        } else if (runChecks) {
            await this.checkRootAttestation(url, params);
        }


        return await this.createAttestation(url, params, entityType);
    }

    private isNotRootAttestation(params: objectAny): boolean {
        return (params.intermediateAccount || params.leafAccount);
    }

    private async checkNonRootAttestation(url: string, params: objectAny, entityType: EntityType): Promise<void> {
        const myAccount = account.convertPassphraseToAccountRs(params.passphrase);
        const attestorAccount = params.myAttestorAccount || myAccount;

        if (myAccount === this.helper.getRecipient(params)) {
            const _error = Helper.createError(ErrorCode.SELF_ATTESTATION_NOT_ALLOWED);
            return Promise.reject(_error);
        }

        const dataFields = new DataFields();
        const attestationContext = dataFields.setAttestationContext(params.attestationContext);
        await this.helper.checkOwnEntityAndState(url, myAccount, attestorAccount, attestationContext, new DataFields(), false, entityType);
    }

    private async checkRootAttestation(url: string, params: objectAny): Promise<void> {
        const myAccount = account.convertPassphraseToAccountRs(params.passphrase);
        const attestorAccount = params.myAttestorAccount || myAccount;
        const dataFields = new DataFields();
        const attestationContext = dataFields.setAttestationContext(params.attestationContext);

        try {
            const response = await this.request.getAccountProperties(url, {
                    setter: attestorAccount,
                    recipient: myAccount,
                    property: attestationContext
                });
            const propertyObject = response.properties[0];

            if (propertyObject) {
                const error = Helper.createError(ErrorCode.ATTESTATION_CONTEXT_ALREADY_SET, [ myAccount, attestationContext, attestorAccount ]);
                return Promise.reject(error);
            }

        } catch (error) {
            return Promise.reject(Helper.getError(error));
        }
    }

    private async createAttestation(url: string, params: objectAny, entityType: EntityType): Promise<AttestationResponse> {
        const dataFields = new DataFields();
        dataFields.attestationContext = params.attestationContext;
        dataFields.state = State.ACTIVE;
        dataFields.entityType = entityType;
        dataFields.payload = params.payload;

        const response = await this.helper.createAttestationTransaction(url, params.passphrase, this.helper.getRecipient(params), dataFields);
        return { transactionId: response.fullHash };
    }
}