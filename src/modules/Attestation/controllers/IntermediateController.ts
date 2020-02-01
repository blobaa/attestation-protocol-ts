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
import { AttestationResponse, CreateIntermediateAttestationParams, EntityType, RevokeIntermediateAttestationParams, UpdateIntermediateAttestationParams } from "../../../types";
import CreationService from "../services/CreationService";
import RevocationService from "../services/RevocationService";
import UpdateService from "../services/UpdateService";


export default class IntermediateController {
    private readonly request: IRequest;


    constructor(request: IRequest) {
        this.request = request;
    }


    public async create(url: string, params: CreateIntermediateAttestationParams): Promise<AttestationResponse> {
        const creationService = new CreationService(this.request);
        return await creationService.create(url, params, EntityType.INTERMEDIATE);
    }


    public async update(url: string, params: UpdateIntermediateAttestationParams): Promise<AttestationResponse> {
        const updateService = new UpdateService(this.request);
        return await updateService.update(url, params, EntityType.INTERMEDIATE);
    }


    public async revoke(url: string, params: RevokeIntermediateAttestationParams): Promise<AttestationResponse> {
        const revocationService = new RevocationService(this.request);
        return await revocationService.revoke(url, params, EntityType.INTERMEDIATE);
    }
}