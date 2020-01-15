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

import AttestationHandler from "./modules/AttestationHandler";
import DataHandler from "./modules/DataHandler";
import EntityParser from "./modules/EntityParser";
import { IAttestation, IData, IEntity } from "./types";

export * from "./types";


export const attestation: IAttestation = new AttestationHandler();
export const data: IData = new DataHandler();
export const entity: IEntity = new EntityParser();

export class Attestation extends AttestationHandler {}
export class Data extends DataHandler {}
export class Entity extends EntityParser {}

