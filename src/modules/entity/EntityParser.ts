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
import { GetEntityParams, GetEntityResponse, IEntity } from "../../types";
import ParsingController from "./controller/ParsingController";
import GetEntityService from "./service/GetEntityService";


export default class EntityParser implements IEntity {

    private request: IRequest;


    constructor(request = new Request()) {
        this.request = request;
    }


    public getEntity = async (url: string, params: GetEntityParams): Promise<GetEntityResponse> => {
        const controller = new ParsingController(new GetEntityService(this.request));
        return controller.run(url, params);
    }
}
