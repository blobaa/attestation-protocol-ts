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