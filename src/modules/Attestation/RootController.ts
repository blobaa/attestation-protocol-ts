import { IRequest } from "@somedotone/ardor-ts";
import { CreateRootAttestationParams, AttestationResponse, UpdateRootAttestationParams } from "../..";
import { EntityType } from "../../types";
import CreationService from "./CreationSevice";


export default class RootController {
    private readonly request: IRequest;


    constructor(request: IRequest) {
        this.request = request;
    }

    public async create (url: string, params: CreateRootAttestationParams): Promise<AttestationResponse> {
        const creationService = new CreationService(this.request);
        const response = await creationService.create(url, params, EntityType.ROOT);
        return { transactionId: response.fullHash };
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