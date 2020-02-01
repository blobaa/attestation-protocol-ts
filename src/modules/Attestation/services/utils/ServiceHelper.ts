import { account, ChainId, IRequest, SetAccountPropertyParams, SetAccountPropertyResponse } from "@somedotone/ardor-ts";
import { EntityType, ErrorCode, objectAny, State } from "../../../..";
import DataFields from "../../../lib/DataFields";
import Helper from "../../../lib/Helper";


export default class ServiceHelper {
    private readonly request: IRequest;


    constructor(request: IRequest) {
        this.request = request;
    }


    public async checkOwnEntityAndState(url: string, myAccount: string, attestorAccount: string, attestationContext: string,
                                            dataFields: DataFields, isStateUpdate: boolean, entity: EntityType): Promise<void> {
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

    private isEntityPermitted(attestorEntity: EntityType, myEntity: EntityType): boolean {
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


    public getEntityTypeName(entityType: EntityType): string {
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


    public getRecipient(params: objectAny): string {
        if (params.intermediateAccount) {
            return params.intermediateAccount;
        }
        if (params.leafAccount) {
            return params.leafAccount;
        }
        return account.convertPassphraseToAccountRs(params.passphrase);
    }


    public async createAttestationTransaction(url: string, passphrase: string,
                                                  accountToAttest: string, dataFields: DataFields ): Promise<SetAccountPropertyResponse> {
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
}