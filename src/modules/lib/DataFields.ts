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
import { ACCOUNT_PREFIX, DATA_FIELD_SEPARATOR, DUMMY_ACCOUNT_RS, MAX_PAYLOAD_LENGTH, noError, NUMBER_OF_DATA_FIELDS, PROTOCOL_IDENTIFIER, PROTOCOL_VERSION, REDIRECT_ACCOUNT_CHARACTER_LENGTH, PROTOCOL_VERSION_LENGTH } from "../../constants";
import { EntityType, Error, ErrorCode, State } from "../../types";
import Helper from "./Helper";


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
        this.attestationContext = (dataFields && dataFields.attestationContext) || "";
        this.version = (dataFields && dataFields.version) || PROTOCOL_VERSION;
        this.entityType = (dataFields && dataFields.entityType) || EntityType.LEAF;
        this.state = (dataFields && dataFields.state) || State.INACTIVE;
        this.redirectAccount = (dataFields && dataFields.redirectAccount) || DUMMY_ACCOUNT_RS;
        this.payload = (dataFields && dataFields.payload) || "";
    }


    /*eslint-disable @typescript-eslint/explicit-function-return-type*/
    get attestationContext() {
        return this._attestationContext;
    }
    /*eslint-enable @typescript-eslint/explicit-function-return-type*/


    set attestationContext(value: string) {
        this._attestationContext = this.setAttestationContext(value);
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
        const _dataFields = dataFields.slice(0, NUMBER_OF_DATA_FIELDS);

        if (_dataFields.length !== NUMBER_OF_DATA_FIELDS) {
            const _error = Helper.createError(ErrorCode.WRONG_NUMBER_OF_DATA_FIELDS, [ "" + (NUMBER_OF_DATA_FIELDS + 1), DATA_FIELD_SEPARATOR ]);
            return _error;
        }

        let error = this.checkVersion(_dataFields[DataField.VERSION]);
        if (error.code !== ErrorCode.NO_ERROR) return error;

        error = this.checkEntityType(_dataFields[DataField.ENTITY]);
        if (error.code !== ErrorCode.NO_ERROR) return error;

        error = this.checkState(_dataFields[DataField.STATE]);
        if (error.code !== ErrorCode.NO_ERROR) return error;

        error = this.checkRedirectAccount(_dataFields[DataField.REDIRECT_ACCOUNT]);
        if (error.code !== ErrorCode.NO_ERROR) return error;

        error = this.checkPayload(payload);
        if (error.code !== ErrorCode.NO_ERROR) return error;

        return noError;
    }


    public checkVersion = (version: string): Error => {
        if (version.length !== PROTOCOL_VERSION_LENGTH) {
            const error = Helper.createError(ErrorCode.WRONG_VERSION_LENGTH);
            return error;
        }
        if (version !== PROTOCOL_VERSION) {
            const error = Helper.createError(ErrorCode.WRONG_VERSION, [ PROTOCOL_VERSION ]);
            return error;
        }
        return noError;
    }


    public checkEntityType = (entityType: string): Error => {
        if (entityType.length !== 1) {
            const error = Helper.createError(ErrorCode.WRONG_ENTITY_TYPE_LENGTH);
            return error;
        }
        if (entityType !== EntityType.LEAF && entityType !== EntityType.INTERMEDIATE && entityType !== EntityType.ROOT) {
            const error = Helper.createError(ErrorCode.UNKNOWN_ENTITY_TYPE);
            return error;
        }
        return noError;
    }


    public checkState = (state: string): Error => {
        if (state.length !== 1) {
            const error = Helper.createError(ErrorCode.WRONG_STATE_TYPE_LENGTH);
            return error;
        }
        if (state !== State.ACTIVE && state !== State.INACTIVE && state !== State.DEPRECATED) {
            const error = Helper.createError(ErrorCode.UNKNOWN_STATE_TYPE);
            return error;
        }
        return noError;
    }


    public checkRedirectAccount = (redirectAccount: string): Error => {
        const accountPrefix = ACCOUNT_PREFIX;
        if (redirectAccount.length !== REDIRECT_ACCOUNT_CHARACTER_LENGTH) {
            const error = Helper.createError(ErrorCode.WRONG_REDIRECT_ACCOUNT_LENGTH, [ "" + REDIRECT_ACCOUNT_CHARACTER_LENGTH ]);
            return error;
        }
        if (!account.checkAccountRs(accountPrefix + redirectAccount) && redirectAccount !== DUMMY_ACCOUNT_RS) {
            const error = Helper.createError(ErrorCode.INVALID_REDIRECT_ACCOUNT);
            return error;
        }
        return noError;
    }


    public checkPayload = (payload: string): Error => {
        if (payload.length > MAX_PAYLOAD_LENGTH) {
            const error = Helper.createError(ErrorCode.PAYLOAD_TOO_LONG, [ "" + MAX_PAYLOAD_LENGTH ]);
            return error;
        }
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
