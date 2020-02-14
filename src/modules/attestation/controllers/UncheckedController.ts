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

import { AttestationResponse, EntityType } from "../../../types";
import { IAttestationService, objectAny } from "../../internal-types";
import { IGNIS_ONE_COIN } from "../../../constants";


export default class UncheckedController {
    private readonly service: IAttestationService;


    constructor(service: IAttestationService) {
        this.service = service;
    }


    public async run(url: string, params: objectAny): Promise<AttestationResponse> {
        if (params.fee) {
            params.feeNQT = params.fee * IGNIS_ONE_COIN;
            delete params.fee;
        }
        return await this.service.run(url, params, EntityType.ROOT, false);
    }
}