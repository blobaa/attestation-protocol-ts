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

import { IRequest, Request } from "@somedotone/ardor-ts";
import { IData, SignDataParams, SignedData, VerifySignedDataParams, VerifySignedDataResponse } from "../../types";
import SigningController from "./controllers/SigningController";
import VerificationController from "./controllers/VerificationController";
import SigningService from "./services/SigningService";
import VerificationService from "./services/VerificationService";


export default class DataHandler implements IData {

    private request: IRequest;


    constructor(request = new Request()) {
        this.request = request;
    }


    public signData(params: SignDataParams, forTestnet = false): SignedData {
        const controller = new SigningController(new SigningService());
        return controller.run(params, forTestnet);
    }


    public async verifySignedData(url: string, params: VerifySignedDataParams, forTestnet = false): Promise<VerifySignedDataResponse> {
        const controller = new VerificationController(new VerificationService(this.request));
        return await controller.run(url, params, forTestnet);
    }
}
