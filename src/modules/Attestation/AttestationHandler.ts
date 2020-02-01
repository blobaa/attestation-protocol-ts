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

import { Request } from "@somedotone/ardor-ts";
import { AttestationResponse, CreateAttestationUncheckedParams, CreateIntermediateAttestationParams, CreateLeafAttestationParams, CreateRootAttestationParams, IAttestation, RevokeAttestationUncheckedParams, RevokeIntermediateAttestationParams, RevokeLeafAttestationParams, RevokeRootAttestationParams, UpdateIntermediateAttestationParams, UpdateLeafAttestationParams, UpdateRootAttestationParams } from "../../types";
import IntermediateController from "./controllers/IntermediateController";
import LeafController from "./controllers/LeafController";
import RootController from "./controllers/RootController";
import UncheckedController from "./controllers/UncheckedController";


export default class AttestationHandler implements IAttestation {
    private rootController: RootController;
    private intermediateController: IntermediateController;
    private leafController: LeafController;
    private uncheckedController: UncheckedController;


    constructor(request = new Request()) {
        this.rootController = new RootController(request);
        this.intermediateController = new IntermediateController(request);
        this.leafController = new LeafController(request);
        this.uncheckedController = new UncheckedController(request);
    }


    public async createRootAttestation(url: string, params: CreateRootAttestationParams): Promise<AttestationResponse> {
        return await this.rootController.create(url, params);
    }

    public async updateRootAttestation(url: string, params: UpdateRootAttestationParams): Promise<AttestationResponse> {
        return await this.rootController.update(url, params);
    }

    public async revokeRootAttestation(url: string, params: RevokeRootAttestationParams): Promise<AttestationResponse> {
       return await this.rootController.revoke(url, params);
    }


    public async createIntermediateAttestation(url: string, params: CreateIntermediateAttestationParams): Promise<AttestationResponse> {
        return await this.intermediateController.create(url, params);
    }

    public async updateIntermediateAttestation(url: string, params: UpdateIntermediateAttestationParams): Promise<AttestationResponse> {
        return await this.intermediateController.update(url, params);
    }

    public async revokeIntermediateAttestation(url: string, params: RevokeIntermediateAttestationParams): Promise<AttestationResponse> {
        return await this.intermediateController.revoke(url, params);
    }


    public async createLeafAttestation(url: string, params: CreateLeafAttestationParams): Promise<AttestationResponse> {
        return await this.leafController.create(url, params);
    }

    public async updateLeafAttestation(url: string, params: UpdateLeafAttestationParams): Promise<AttestationResponse> {
        return await this.leafController.update(url, params);
    }

    public async revokeLeafAttestation(url: string, params: RevokeLeafAttestationParams): Promise<AttestationResponse> {
        return await this.leafController.revoke(url, params);
    }


    public async createAttestationUnchecked(url: string, params: CreateAttestationUncheckedParams): Promise<AttestationResponse> {
        return await this.uncheckedController.create(url, params);
    }

    public async revokeAttestationUnchecked(url: string, params: RevokeAttestationUncheckedParams): Promise<AttestationResponse> {
        return await this.uncheckedController.revoke(url, params);
    }
}
