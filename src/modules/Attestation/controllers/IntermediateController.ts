import { IRequest } from "@somedotone/ardor-ts";
import { AttestationResponse, CreateIntermediateAttestationParams, EntityType, UpdateIntermediateAttestationParams } from "../../../types";
import CreationService from "../services/CreationService";
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


    // public async revoke (url: string, params: UpdateIntermediateAttestationParams): Promise<AttestationResponse> {
    //     // const response = await this.updateAttestation(url, params, EntityType.ROOT);
    //     // return { transactionId: response.fullHash };
    // }
}