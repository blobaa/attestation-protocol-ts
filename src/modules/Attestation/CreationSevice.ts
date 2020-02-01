import { account, ChainId, IRequest, SetAccountPropertyParams, SetAccountPropertyResponse } from "@somedotone/ardor-ts";
import { AttestationResponse, CreateAttestationUncheckedParams, EntityType, ErrorCode, objectAny, State } from "../../types";
import DataFields from "../lib/DataFields";
import Helper from "../lib/Helper";


export default class CreationService {

    private readonly request: IRequest;


    constructor(request: IRequest) {
        this.request = request;
    }


    public async create (url: string, params: objectAny, entityType: EntityType, runChecks = true): Promise<SetAccountPropertyResponse> {
        const dataFields = new DataFields();
        params.payload = params.payload || "";

        const error = dataFields.checkPayload(params.payload);
        if (error.code !== ErrorCode.NO_ERROR) {
            return Promise.reject(error);
        }


        if (runChecks) {
            const myAccount = account.convertPassphraseToAccountRs(params.passphrase);
            const attestorAccount = myAccount;

            if (this.isNotRootAttestation(params)) {
                if (myAccount === this.getRecipient(params)) {
                    const _error = Helper.createError(ErrorCode.SELF_ATTESTATION_NOT_ALLOWED);
                    return Promise.reject(_error);
                }

                const attestationContext = dataFields.setAttestationContext(params.attestationContext);
                await this.checkOwnEntityAndState(url, myAccount, attestorAccount, attestationContext, new DataFields(), false, entityType);

            } else {
                 await this.checkRootAttestation(url, myAccount, attestorAccount, dataFields.setAttestationContext(params.attestationContext));
            }
        }


        dataFields.attestationContext = params.attestationContext;
        dataFields.state = State.ACTIVE;
        dataFields.entityType = entityType;
        dataFields.payload = params.payload;

        return await this.createAttestationTransaction(url, params.passphrase, this.getRecipient(params), dataFields);
    }

    private isNotRootAttestation = (params: objectAny): boolean => {
        return (params.intermediateAccount || params.leafAccount);
    }

    private getRecipient = (params: objectAny): string => {
        if (params.intermediateAccount) {
            return params.intermediateAccount;
        }
        if (params.leafAccount) {
            return params.leafAccount;
        }
        return account.convertPassphraseToAccountRs(params.passphrase);
    }

    private checkOwnEntityAndState = async (url: string, myAccount: string, attestorAccount: string, attestationContext: string,
                                            dataFields: DataFields, isStateUpdate: boolean, entity: EntityType): Promise<void> => {
        try {
            dataFields.attestationContext = attestationContext;

            const response = await this.request.getAccountProperties(url, {
                    setter: attestorAccount,
                    recipient: myAccount,
                    property: dataFields.attestationContext
                });
            const propertyObject = response.properties[0];

            if (!propertyObject) {
                const _error = Helper.createError(ErrorCode.ATTESTATION_CONTEXT_NOT_FOUND, [ myAccount ]);
                return Promise.reject(_error);
            }

            const error = dataFields.consumeDataFieldString(propertyObject.value);
            if (error.code !== ErrorCode.NO_ERROR) {
                return Promise.reject(error);
            }

            if (dataFields.entityType === EntityType.LEAF) {
                const _error = Helper.createError(ErrorCode.ATTESTATION_NOT_ALLOWED);
                return Promise.reject(_error);
            }
            if (dataFields.state !== State.ACTIVE && !isStateUpdate) {
                const _error = Helper.createError(ErrorCode.ENTITY_NOT_ACTIVE);
                return Promise.reject(_error);
            }
            if (!this.isEntityPermitted(dataFields.entityType, entity)) {
                const entityType = this.getEntityTypeName(dataFields.entityType);
                const entityName = this.getEntityTypeName(entity);
                return Promise.reject(Helper.createError(ErrorCode.ATTESTATION_NOT_ALLOWED, [ entityType, entityName ]));
            }

        } catch (error) {
            return Promise.reject(Helper.getError(error));
        }
    }

    private isEntityPermitted = (attestorEntity: EntityType, myEntity: EntityType): boolean => {
        if (myEntity === EntityType.ROOT) {
            return attestorEntity === EntityType.ROOT;
        }
        if (myEntity === EntityType.INTERMEDIATE) {
            return (attestorEntity === EntityType.INTERMEDIATE || attestorEntity === EntityType.ROOT);
        }
        if (myEntity === EntityType.LEAF) {
            return (attestorEntity === EntityType.INTERMEDIATE || attestorEntity === EntityType.ROOT);
        }
        return false;
    }

    private getEntityTypeName = (entityType: EntityType): string => {
        if (entityType === EntityType.ROOT) {
            return "root";
        }
        if (entityType === EntityType.INTERMEDIATE) {
            return "intermediate";
        }
        if (entityType === EntityType.LEAF) {
            return "leaf";
        }
        return "";
    }

    private checkRootAttestation = async (url: string, myAccount: string, attestorAccount: string, attestationContext: string): Promise<void> => {
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

    private createAttestationTransaction = async (url: string, passphrase: string,
                                                  accountToAttest: string, dataFields: DataFields ): Promise<SetAccountPropertyResponse> => {
        const propertyRequestParams: SetAccountPropertyParams = {
            chain: ChainId.IGNIS,
            property: dataFields.attestationContext,
            recipient: accountToAttest,
            secretPhrase: passphrase,
            value: dataFields.createDataFieldsString()
        };

        try {
            return await this.request.setAccountProperty(url, propertyRequestParams);
        } catch (error) {
            return Promise.reject(Helper.getError(error));
        }
    }


    public createUnchecked = async (url: string, params: CreateAttestationUncheckedParams): Promise<AttestationResponse> => {
        const _params = { ...params } as objectAny;

        if (params.entityType === EntityType.INTERMEDIATE) {
            _params.intermediateAccount = params.account;
        }
        if (params.entityType === EntityType.LEAF) {
            _params.leafAccount = params.account;
        }

        delete _params.account;
        delete _params.entityType;


        const response = await this.create(url, _params, params.entityType, false);
        return { transactionId: response.fullHash };
    }
}