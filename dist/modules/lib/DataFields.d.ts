import { EntityType, Error, State } from '../../types';
export default class DataFields {
    private _attestationContext;
    version: string;
    entityType: EntityType;
    state: State;
    redirectAccount: string;
    payload: string;
    constructor(dataFields?: DataFields);
    set attestationContext(value: string);
    setAttestationContext: (context: string) => string;
    get attestationContext(): string;
    consumeDataFieldString: (dataFieldString: string) => Error;
    checkDataFields: (dataFields: string[]) => Error;
    checkVersion: (version: string) => Error;
    checkEntityType: (entityType: string) => Error;
    checkState: (state: string) => Error;
    checkRedirectAccount: (redirectAccount: string) => Error;
    checkPayload: (payload: string) => Error;
    createDataFieldsString: () => string;
}
