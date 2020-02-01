import { account, IRequest } from "@somedotone/ardor-ts";
import { AttestationResponse, CreateAttestationUncheckedParams, EntityType, ErrorCode, objectAny, State } from "../../../types";
import DataFields from "../../lib/DataFields";
import Helper from "../../lib/Helper";
import ServiceHelper from "./utils/ServiceHelper";


export default class CreationService {
    private readonly request: IRequest;
    private readonly helper: ServiceHelper;


    constructor(request: IRequest) {
        this.request = request;
        this.helper = new ServiceHelper(request);
    }


    public async create(url: string, params: objectAny, entityType: EntityType, runChecks = true): Promise<AttestationResponse> {
        const dataFields = new DataFields();
        params.payload = params.payload || "";

        const error = dataFields.checkPayload(params.payload);
        if (error.code !== ErrorCode.NO_ERROR) {
            return Promise.reject(error);
        }


        if (runChecks) {
            const myAccount = account.convertPassphraseToAccountRs(params.passphrase);
            const attestorAccount = params.myAttestorAccount || myAccount;

            if (this.isNotRootAttestation(params)) {
                if (myAccount === this.helper.getRecipient(params)) {
                    const _error = Helper.createError(ErrorCode.SELF_ATTESTATION_NOT_ALLOWED);
                    return Promise.reject(_error);
                }

                const attestationContext = dataFields.setAttestationContext(params.attestationContext);
                await this.helper.checkOwnEntityAndState(url, myAccount, attestorAccount, attestationContext, new DataFields(), false, entityType);

            } else {
                 await this.checkRootAttestation(url, myAccount, attestorAccount, dataFields.setAttestationContext(params.attestationContext));
            }
        }


        dataFields.attestationContext = params.attestationContext;
        dataFields.state = State.ACTIVE;
        dataFields.entityType = entityType;
        dataFields.payload = params.payload;

        const response = await this.helper.createAttestationTransaction(url, params.passphrase, this.getRecipient(params), dataFields);
        return { transactionId: response.fullHash };
    }

    private isNotRootAttestation(params: objectAny): boolean {
        return (params.intermediateAccount || params.leafAccount);
    }

    private getRecipient(params: objectAny): string {
        if (params.intermediateAccount) {
            return params.intermediateAccount;
        }
        if (params.leafAccount) {
            return params.leafAccount;
        }
        return account.convertPassphraseToAccountRs(params.passphrase);
    }


    private async checkRootAttestation(url: string, myAccount: string, attestorAccount: string, attestationContext: string): Promise<void> {
        try {
            const response = await this.request.getAccountProperties(url, {
                    setter: attestorAccount,
                    recipient: myAccount,
                    property: attestationContext
                });
            const propertyObject = response.properties[0];

            if (propertyObject) {
                const error = Helper.createError(ErrorCode.ATTESTATION_CONTEXT_ALREADY_SET, [myAccount, attestationContext, attestorAccount]);
                return Promise.reject(error);
            }

        } catch (error) {
            return Promise.reject(Helper.getError(error));
        }
    }


    public async createUnchecked(url: string, params: CreateAttestationUncheckedParams): Promise<AttestationResponse> {
        const _params = { ...params } as objectAny;

        if (params.entityType === EntityType.INTERMEDIATE) {
            _params.intermediateAccount = params.account;
        }
        if (params.entityType === EntityType.LEAF) {
            _params.leafAccount = params.account;
        }

        delete _params.account;
        delete _params.entityType;

        return await this.create(url, _params, params.entityType, false);
    }
}