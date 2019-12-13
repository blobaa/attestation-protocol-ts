import { IEntity, GetEntityResponse, GetEntityParams, EntityType, State } from '../types'
import { IRequest, Request, account } from 'ardor-ts'
import { ErrorCode } from '..';
import DataFields from './lib/DataFields';
import Helper from './lib/Helper';


export default class EntityParser implements IEntity {
    
    private request: IRequest;



    constructor(request = new Request()) {
        this.request = request;
    }


    public getEntity = async (url: string, params: GetEntityParams): Promise<GetEntityResponse> => {
        try {
            const dataFields = new DataFields();
            dataFields.attestationContext = params.attestationContext;

            const attestor = params.attestor && params.attestor || params.account;
            const response = await this.request.getAccountProperties(url, { setter: attestor, recipient: params.account, property: dataFields.attestationContext });
            const propertyObject = response.properties[0];
            if(!propertyObject) return Promise.reject({ code: ErrorCode.ATTESTATION_CONTEXT_NOT_FOUND, description: "Attestation context not found. The specified attestation context could not be found at account '" + params.account + "'."  });

            const error = dataFields.consumeDataFieldString(propertyObject.value);
            if(error.code !== ErrorCode.NO_ERROR) return Promise.reject(error);


            const entity: GetEntityResponse = {
                account: params.account,
                attestationContext: dataFields.attestationContext,
                entityType: dataFields.entityType,
                state: dataFields.state,
                payload: dataFields.payload,
                protocolVersion: dataFields.version,
                redirectAccount: dataFields.redirectAccount
            }
            
            return Promise.resolve(entity);
        } catch(error) {
            return Promise.reject(Helper.getError(error));
        }
    }
}