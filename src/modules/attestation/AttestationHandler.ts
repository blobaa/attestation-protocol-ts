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

import { IRequest, Request } from "@blobaa/ardor-ts";
import { AttestationResponse, CreateAttestationUncheckedParams, CreateIntermediateAttestationParams, CreateLeafAttestationParams, CreateRootAttestationParams, IAttestation, RevokeAttestationUncheckedParams, RevokeIntermediateAttestationParams, RevokeLeafAttestationParams, RevokeRootAttestationParams, UpdateIntermediateAttestationParams, UpdateLeafAttestationParams, UpdateRootAttestationParams } from "../../types";
import IntermediateController from "./controllers/IntermediateController";
import LeafController from "./controllers/LeafController";
import RootController from "./controllers/RootController";
import UncheckedController from "./controllers/UncheckedController";
import CreationService from "./services/CreationService";
import RevocationService from "./services/RevocationService";
import UpdateService from "./services/UpdateService";


export default class AttestationHandler implements IAttestation {
    private readonly request: IRequest;


    constructor(request = new Request()) {
        this.request = request;
    }


    public async createRootAttestation(url: string, params: CreateRootAttestationParams): Promise<AttestationResponse> {
        const controller = new RootController(new CreationService(this.request));
        return await controller.run(url, params);
    }

    public async updateRootAttestation(url: string, params: UpdateRootAttestationParams): Promise<AttestationResponse> {
        const controller = new RootController(new UpdateService(this.request));
        return await controller.run(url, params);
    }

    public async revokeRootAttestation(url: string, params: RevokeRootAttestationParams): Promise<AttestationResponse> {
        const controller = new RootController(new RevocationService(this.request));
        return await controller.run(url, params);
    }


    public async createIntermediateAttestation(url: string, params: CreateIntermediateAttestationParams): Promise<AttestationResponse> {
        const controller = new IntermediateController(new CreationService(this.request));
        return await controller.run(url, params);
    }

    public async updateIntermediateAttestation(url: string, params: UpdateIntermediateAttestationParams): Promise<AttestationResponse> {
        const controller = new IntermediateController(new UpdateService(this.request));
        return await controller.run(url, params);
    }

    public async revokeIntermediateAttestation(url: string, params: RevokeIntermediateAttestationParams): Promise<AttestationResponse> {
        const controller = new IntermediateController(new RevocationService(this.request));
        return await controller.run(url, params);
    }


    public async createLeafAttestation(url: string, params: CreateLeafAttestationParams): Promise<AttestationResponse> {
        const controller = new LeafController(new CreationService(this.request));
        return await controller.run(url, params);
    }

    public async updateLeafAttestation(url: string, params: UpdateLeafAttestationParams): Promise<AttestationResponse> {
        const controller = new LeafController(new UpdateService(this.request));
        return await controller.run(url, params);
    }

    public async revokeLeafAttestation(url: string, params: RevokeLeafAttestationParams): Promise<AttestationResponse> {
        const controller = new LeafController(new RevocationService(this.request));
        return await controller.run(url, params);
    }


    public async createAttestationUnchecked(url: string, params: CreateAttestationUncheckedParams): Promise<AttestationResponse> {
        const controller = new UncheckedController(new CreationService(this.request));
        return await controller.run(url, params);
    }

    public async revokeAttestationUnchecked(url: string, params: RevokeAttestationUncheckedParams): Promise<AttestationResponse> {
        const controller = new UncheckedController(new RevocationService(this.request));
        return await controller.run(url, params);
    }
}
