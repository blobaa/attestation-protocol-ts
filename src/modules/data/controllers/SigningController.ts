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

import { SignDataParams, SignedData } from "../../../types";
import { ISigningService } from "../../internal-types";


export default class SigningController {
    private readonly service: ISigningService;


    constructor(service: ISigningService) {
        this.service = service;
    }

    public run(params: SignDataParams, forTestnet = true): SignedData {
        return this.service.run(params, forTestnet);
    }
}