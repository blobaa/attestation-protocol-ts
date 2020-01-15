/*
 *  Copyright (C) 2019  Attila Aldemir <a_aldemir@hotmail.de>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published
 *  by the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { account } from "@somedotone/ardor-ts";
import { ACCOUNT_PREFIX, DATA_FIELD_SEPARATOR, DUMMY_ACCOUNT_RS, MAX_PAYLOAD_LENGTH, noError, NUMBER_OF_DATA_FIELDS, PROTOCOL_IDENTIFIER, PROTOCOL_VERSION, REDIRECT_ACCOUNT_CHARACTER_LENGTH } from "../../constants";
import { EntityType, Error, ErrorCode, State } from "../../types";


enum DataField {
    VERSION,
    ENTITY,
    STATE,
    REDIRECT_ACCOUNT,
    PAYLOAD
}


export default class DataFields {

    private _attestationContext = "";

    public version = PROTOCOL_VERSION;
    public entityType = EntityType.LEAF;
    public state = State.INACTIVE;
    public redirectAccount = DUMMY_ACCOUNT_RS;
    public payload = "";



    constructor(dataFields?: DataFields) {
        this.attestationContext = dataFields && dataFields.attestationContext || "";
        this.version = dataFields && dataFields.version || PROTOCOL_VERSION;
        this.entityType = dataFields && dataFields.entityType || EntityType.LEAF;
        this.state = dataFields && dataFields.state || State.INACTIVE;
        this.redirectAccount = dataFields && dataFields.redirectAccount || DUMMY_ACCOUNT_RS;
        this.payload = dataFields && dataFields.payload || "";
    }


    set attestationContext(value: string) {
        this._attestationContext = this.setAttestationContext(value);
    }

    get attestationContext() {
        return this._attestationContext;
    }

    public setAttestationContext = (context: string): string => {
        return context.startsWith(PROTOCOL_IDENTIFIER) ? context : PROTOCOL_IDENTIFIER + context;
    }


    public consumeDataFieldString = (dataFieldString: string): Error => {
        const dataFields = dataFieldString.split(DATA_FIELD_SEPARATOR);

        const error = this.checkDataFields(dataFields);
        if (error.code !== ErrorCode.NO_ERROR) return error;


        this.version = dataFields[DataField.VERSION];
        this.entityType = dataFields[DataField.ENTITY] as EntityType;
        this.state = dataFields[DataField.STATE] as State;
        this.redirectAccount = dataFields[DataField.REDIRECT_ACCOUNT];
        this.payload = dataFields.slice(NUMBER_OF_DATA_FIELDS - 1).join(DATA_FIELD_SEPARATOR);

        return noError;
    }


    public checkDataFields = (dataFields: string[]): Error => {
        const payload = dataFields.slice(NUMBER_OF_DATA_FIELDS - 1).join(DATA_FIELD_SEPARATOR);
        const datafields = dataFields.slice(0, NUMBER_OF_DATA_FIELDS);

        if (datafields.length !== NUMBER_OF_DATA_FIELDS) return {
                code: ErrorCode.WRONG_NUMBER_OF_DATA_FIELDS,
                description: "Wrong number of data fields. The data field string must contain exactly " + (NUMBER_OF_DATA_FIELDS + 1) + " '" + DATA_FIELD_SEPARATOR + "' characters."
            };

        let error = this.checkVersion(datafields[DataField.VERSION]);
        if (error.code !== ErrorCode.NO_ERROR) return error;

        error = this.checkEntityType(datafields[DataField.ENTITY]);
        if (error.code !== ErrorCode.NO_ERROR) return error;

        error = this.checkState(datafields[DataField.STATE]);
        if (error.code !== ErrorCode.NO_ERROR) return error;

        error = this.checkRedirectAccount(datafields[DataField.REDIRECT_ACCOUNT]);
        if (error.code !== ErrorCode.NO_ERROR) return error;

        error = this.checkPayload(payload);
        if (error.code !== ErrorCode.NO_ERROR) return error;

        return noError;
    }


    public checkVersion = (version: string): Error => {
        if (version.length !== 3) return {
                code: ErrorCode.WRONG_VERSION_LENGTH,
                description: "Wrong version length. Version data field must consist of 3 character."
            };
        if (version !== PROTOCOL_VERSION) return {
                code: ErrorCode.WRONG_VERSION,
                description: "Wrong version. Version must be " + PROTOCOL_VERSION + "."
            };
        return noError;
    }


    public checkEntityType = (entityType: string): Error => {
        if (entityType.length !== 1) return {
                code: ErrorCode.WRONG_ENTITY_TYPE_LENGTH,
                description: "Wrong entity type length. Entity type data field must consist of 1 character."
            };
        if (entityType !== EntityType.LEAF && entityType !== EntityType.INTERMEDIATE && entityType !== EntityType.ROOT) return {
                code: ErrorCode.UNKNOWN_ENTITY_TYPE,
                description: "Unknown entity type."
            };
        return noError;
    }


    public checkState = (state: string): Error => {
        if (state.length !== 1) return {
                code: ErrorCode.WRONG_STATE_TYPE_LENGTH,
                description: "Wrong state type length. State type data field must consist of 1 character."
            };
        if (state !== State.ACTIVE && state !== State.INACTIVE && state !== State.DEPRECATED) return {
                code: ErrorCode.UNKNOWN_STATE_TYPE,
                description: "Unknown state type."
            };
        return noError;
    }


    public checkRedirectAccount = (redirectAccount: string): Error => {
        const accountPrefix = ACCOUNT_PREFIX;
        if (redirectAccount.length !== REDIRECT_ACCOUNT_CHARACTER_LENGTH) return {
                code: ErrorCode.WRONG_REDIRECT_ACCOUNT_LENGTH,
                description: "Wrong redirect account length. Redirect account type data field must consist of " + REDIRECT_ACCOUNT_CHARACTER_LENGTH + "character."
            };
        if (!account.checkAccountRs(accountPrefix + redirectAccount) && redirectAccount !== DUMMY_ACCOUNT_RS) return {
                code: ErrorCode.INVALID_REDIRECT_ACCOUNT,
                description: "Invalid redirect account. The redirect account is not a valid Ardor account."
            };
        return noError;
    }


    public checkPayload = (payload: string): Error => {
        if (payload.length > MAX_PAYLOAD_LENGTH) return {
                code: ErrorCode.PAYLOAD_TOO_LONG,
                description: "Payload is too long. Has to be less than " + MAX_PAYLOAD_LENGTH + " character."
            };
        return noError;
    }


    public createDataFieldsString = (): string => {
        let dataFieldString = "";
        dataFieldString += this.version + DATA_FIELD_SEPARATOR;
        dataFieldString += this.entityType + DATA_FIELD_SEPARATOR;
        dataFieldString += this.state + DATA_FIELD_SEPARATOR;
        dataFieldString += this.redirectAccount + DATA_FIELD_SEPARATOR;
        dataFieldString += this.payload;

        return dataFieldString;
    }
}
