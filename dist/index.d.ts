import { IAttestation, IClaim, IEntity } from './types';
import AttestationHandler from './modules/AttestationHandler';
import ClaimHandler from './modules/ClaimHandler';
import EntityParser from './modules/EntityParser';
export * from './types';
export declare const attestation: IAttestation;
export declare const claim: IClaim;
export declare const entity: IEntity;
export declare class Attestation extends AttestationHandler {
}
export declare class Claim extends ClaimHandler {
}
export declare class Entity extends EntityParser {
}
