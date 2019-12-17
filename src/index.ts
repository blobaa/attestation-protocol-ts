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

import { IAttestation, IClaim, IEntity } from './types'
import AttestationHandler from './modules/AttestationHandler'
import ClaimHandler from './modules/ClaimHandler'
import EntityParser from './modules/EntityParser'

export * from './types'


export const attestation: IAttestation = new AttestationHandler();
export const claim: IClaim = new ClaimHandler();
export const entity: IEntity = new EntityParser();

export class Attestation extends AttestationHandler {};
export class Claim extends ClaimHandler {};
export class Entity extends EntityParser {};