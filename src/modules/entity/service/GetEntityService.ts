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

import { IRequest } from "@somedotone/ardor-ts";
import { ErrorCode, GetEntityParams, GetEntityResponse, IGetEntityService } from "../../../types";
import DataFields from "../../lib/DataFields";
import Helper from "../../lib/Helper";


export default class GetEntityService implements IGetEntityService {
    private readonly request: IRequest;


    constructor(request: IRequest) {
        this.request = request;
    }


    public async run(url: string, params: GetEntityParams): Promise<GetEntityResponse> {
        try {
            const dataFields = new DataFields();
            dataFields.attestationContext = params.attestationContext;

            const attestor = params.attestor || params.account;
            const response = await this.request.getAccountProperties(url, {
                    setter: attestor,
                    recipient: params.account,
                    property: dataFields.attestationContext
                });
            const propertyObject = response.properties[0];

            if (!propertyObject) {
                const _error = Helper.createError(ErrorCode.ATTESTATION_CONTEXT_NOT_FOUND, [ params.account ]);
                return Promise.reject(_error);
            }

            const error = dataFields.consumeDataFieldString(propertyObject.value);
            if (error.code !== ErrorCode.NO_ERROR) {
                return Promise.reject(error);
            }


            const entity: GetEntityResponse = {
                account: params.account,
                attestationContext: dataFields.attestationContext,
                entityType: dataFields.entityType,
                payload: dataFields.payload,
                protocolVersion: dataFields.version,
                redirectAccount: dataFields.redirectAccount,
                state: dataFields.state
            };
            return Promise.resolve(entity);
        } catch (error) {
            return Promise.reject(Helper.getError(error));
        }
    }
}