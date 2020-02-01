import { IRequest } from "@somedotone/ardor-ts";
import { AttestationResponse, CreateRootAttestationParams, EntityType, UpdateRootAttestationParams, RevokeRootAttestationParams } from "../../../types";
import CreationService from "../services/CreationService";
import UpdateService from "../services/UpdateService";


export default class RootController {
    private readonly request: IRequest;


    constructor(request: IRequest) {
        this.request = request;
    }


    public async create(url: string, params: CreateRootAttestationParams): Promise<AttestationResponse> {
        const creationService = new CreationService(this.request);
        return await creationService.create(url, params, EntityType.ROOT);
    }


    public async update(url: string, params: UpdateRootAttestationParams): Promise<AttestationResponse> {
        const updateService = new UpdateService(this.request);
        return await updateService.update(url, params, EntityType.ROOT);
    }


    // public async revoke(url: string, params: RevokeRootAttestationParams): Promise<AttestationResponse> {
    //     const creationService = new CreationService(this.request);
    //     return await creationService.create(url, params, EntityType.ROOT);
    // }
}