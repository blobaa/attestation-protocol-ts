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

import { EntityType, AttestationResponse, SignDataParams, SignedData, VerifySignedDataParams, VerifySignedDataResponse, GetEntityParams, GetEntityResponse } from "../types";


/*eslint-disable-next-line @typescript-eslint/no-explicit-any*/
export type objectAny = {[name: string]: any};


export interface IAttestationService {
    run(url: string, params: objectAny, entityType: EntityType, runChecks: boolean): Promise<AttestationResponse>;
}

export interface ISigningService {
    run(params: SignDataParams, forTestnet: boolean): SignedData;
}

export interface IVerificationService {
    run(url: string, params: VerifySignedDataParams, forTestnet: boolean): Promise<VerifySignedDataResponse>;
}

export interface IGetEntityService {
    run(url: string, params: GetEntityParams): Promise<GetEntityResponse>;
}