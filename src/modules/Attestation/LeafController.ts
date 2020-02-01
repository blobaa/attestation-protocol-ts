import { IRequest } from "@somedotone/ardor-ts";
import { AttestationResponse, CreateLeafAttestationParams, EntityType } from "../../types";
import CreationService from "./CreationService";


export default class LeafController {
    private readonly request: IRequest;


    constructor(request: IRequest) {
        this.request = request;
    }

    public async create (url: string, params: CreateLeafAttestationParams): Promise<AttestationResponse> {
        const creationService = new CreationService(this.request);
        const response = await creationService.create(url, params, EntityType.LEAF);
        return { transactionId: response.fullHash };
    }

    // public async update (url: string, params: UpdateLeafAttestationParams): Promise<AttestationResponse> {
    //     // const response = await this.updateAttestation(url, params, EntityType.ROOT);
    //     // return { transactionId: response.fullHash };
    // }

    // public async revoke (url: string, params: UpdateLeafAttestationParams): Promise<AttestationResponse> {
    //     // const response = await this.updateAttestation(url, params, EntityType.ROOT);
    //     // return { transactionId: response.fullHash };
    // }
}