import { IEntity, GetEntityResponse, GetEntityParams } from '../types';
import { Request } from 'ardor-ts';
export default class EntityParser implements IEntity {
    private request;
    constructor(request?: Request);
    getEntity: (url: string, params: GetEntityParams) => Promise<GetEntityResponse>;
}
