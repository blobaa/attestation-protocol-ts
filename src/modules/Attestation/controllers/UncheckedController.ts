import { IRequest } from "@somedotone/ardor-ts";
import { AttestationResponse, CreateAttestationUncheckedParams, objectAny, EntityType } from "../../../types";
import CreationService from "../services/CreationService";


export default class RootController {
    private readonly request: IRequest;


    constructor(request: IRequest) {
        this.request = request;
    }

    public async create (url: string, params: CreateAttestationUncheckedParams): Promise<AttestationResponse> {
        const creationService = new CreationService(this.request);
        return await creationService.createUnchecked(url, params);
    }

    // public async update (url: string, params: UpdateRootAttestationParams): Promise<AttestationResponse> {
    //     // const response = await this.updateAttestation(url, params, EntityType.ROOT);
    //     // return { transactionId: response.fullHash };
    // }

    // public async revoke (url: string, params: UpdateRootAttestationParams): Promise<AttestationResponse> {
    //     // const response = await this.updateAttestation(url, params, EntityType.ROOT);
    //     // return { transactionId: response.fullHash };
    // }
}