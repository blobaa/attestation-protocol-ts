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

import { VerifySignedDataParams, VerifySignedDataResponse } from "../../../types";
import { IVerificationService } from "../../internal-types";


export default class VerificationController {
    private readonly service: IVerificationService;


    constructor(service: IVerificationService) {
        this.service = service;
    }

    public run(url: string, params: VerifySignedDataParams, forTestnet = true): Promise<VerifySignedDataResponse> {
        return this.service.run(url, params, forTestnet);
    }
}