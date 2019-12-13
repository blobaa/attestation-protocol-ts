"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ardor_ts_1 = require("ardor-ts");
var constants_1 = require("../../constants");
var types_1 = require("../../types");
var DataField;
(function (DataField) {
    DataField[DataField["VERSION"] = 0] = "VERSION";
    DataField[DataField["ENTITY"] = 1] = "ENTITY";
    DataField[DataField["STATE"] = 2] = "STATE";
    DataField[DataField["REDIRECT_ACCOUNT"] = 3] = "REDIRECT_ACCOUNT";
    DataField[DataField["PAYLOAD"] = 4] = "PAYLOAD";
})(DataField || (DataField = {}));
var DataFields = /** @class */ (function () {
    function DataFields(dataFields) {
        var _this = this;
        this._attestationContext = "";
        this.version = constants_1.PROTOCOL_VERSION;
        this.entityType = types_1.EntityType.LEAF;
        this.state = types_1.State.INACTIVE;
        this.redirectAccount = constants_1.DUMMY_ACCOUNT_RS;
        this.payload = "";
        this.setAttestationContext = function (context) {
            return context.startsWith(constants_1.PROTOCOL_IDENTIFIER) ? context : constants_1.PROTOCOL_IDENTIFIER + context;
        };
        this.consumeDataFieldString = function (dataFieldString) {
            var dataFields = dataFieldString.split(constants_1.DATA_FIELD_SEPARATOR);
            var error = _this.checkDataFields(dataFields);
            if (error.code !== types_1.ErrorCode.NO_ERROR)
                return error;
            _this.version = dataFields[DataField.VERSION];
            _this.entityType = dataFields[DataField.ENTITY];
            _this.state = dataFields[DataField.STATE];
            _this.redirectAccount = dataFields[DataField.REDIRECT_ACCOUNT];
            _this.payload = dataFields.slice(constants_1.NUMBER_OF_DATA_FIELDS - 1).join(constants_1.DATA_FIELD_SEPARATOR);
            return constants_1.noError;
        };
        this.checkDataFields = function (dataFields) {
            var payload = dataFields.slice(constants_1.NUMBER_OF_DATA_FIELDS - 1).join(constants_1.DATA_FIELD_SEPARATOR);
            var datafields = dataFields.slice(0, constants_1.NUMBER_OF_DATA_FIELDS);
            if (datafields.length !== constants_1.NUMBER_OF_DATA_FIELDS)
                return { code: types_1.ErrorCode.WRONG_NUMBER_OF_DATA_FIELDS, description: "Wrong number of data fields. The data field string must contain exactly " + (constants_1.NUMBER_OF_DATA_FIELDS + 1) + " '" + constants_1.DATA_FIELD_SEPARATOR + "' characters." };
            var error = _this.checkVersion(datafields[DataField.VERSION]);
            if (error.code !== types_1.ErrorCode.NO_ERROR)
                return error;
            error = _this.checkEntityType(datafields[DataField.ENTITY]);
            if (error.code !== types_1.ErrorCode.NO_ERROR)
                return error;
            error = _this.checkState(datafields[DataField.STATE]);
            if (error.code !== types_1.ErrorCode.NO_ERROR)
                return error;
            error = _this.checkRedirectAccount(datafields[DataField.REDIRECT_ACCOUNT]);
            if (error.code !== types_1.ErrorCode.NO_ERROR)
                return error;
            error = _this.checkPayload(payload);
            if (error.code !== types_1.ErrorCode.NO_ERROR)
                return error;
            return constants_1.noError;
        };
        this.checkVersion = function (version) {
            if (version.length !== 3)
                return { code: types_1.ErrorCode.WRONG_VERSION_LENGTH, description: "Wrong version length. Version data field must consist of 3 character." };
            if (version !== constants_1.PROTOCOL_VERSION)
                return { code: types_1.ErrorCode.WRONG_VERSION, description: "Wrong version. Version must be " + constants_1.PROTOCOL_VERSION + "." };
            return constants_1.noError;
        };
        this.checkEntityType = function (entityType) {
            if (entityType.length !== 1)
                return { code: types_1.ErrorCode.WRONG_ENTITY_TYPE_LENGTH, description: "Wrong entity type length. Entity type data field must consist of 1 character." };
            if (entityType !== types_1.EntityType.LEAF && entityType !== types_1.EntityType.INTERMEDIATE && entityType !== types_1.EntityType.ROOT)
                return { code: types_1.ErrorCode.UNKNOWN_ENTITY_TYPE, description: "Unknown entity type." };
            return constants_1.noError;
        };
        this.checkState = function (state) {
            if (state.length !== 1)
                return { code: types_1.ErrorCode.WRONG_STATE_TYPE_LENGTH, description: "Wrong state type length. State type data field must consist of 1 character." };
            if (state !== types_1.State.ACTIVE && state !== types_1.State.INACTIVE && state !== types_1.State.DEPRECATED)
                return { code: types_1.ErrorCode.UNKNOWN_STATE_TYPE, description: "Unknown state type." };
            return constants_1.noError;
        };
        this.checkRedirectAccount = function (redirectAccount) {
            var accountPrefix = constants_1.ACCOUNT_PREFIX;
            if (redirectAccount.length !== 20)
                return { code: types_1.ErrorCode.WRONG_REDIRECT_ACCOUNT_LENGTH, description: "Wrong redirect account length. Redirect account type data field must consist of 20 character." };
            if (!ardor_ts_1.account.checkAccountRs(accountPrefix + redirectAccount) && redirectAccount !== constants_1.DUMMY_ACCOUNT_RS)
                return { code: types_1.ErrorCode.INVALID_REDIRECT_ACCOUNT, description: "Invalid redirect account. The redirect account is not a valid Ardor account." };
            return constants_1.noError;
        };
        this.checkPayload = function (payload) {
            if (payload.length > constants_1.MAX_PAYLOAD_LENGTH)
                return { code: types_1.ErrorCode.PAYLOAD_TOO_LONG, description: "Payload is too long. Has to be less than " + constants_1.MAX_PAYLOAD_LENGTH + " character." };
            return constants_1.noError;
        };
        this.createDataFieldsString = function () {
            var dataFieldString = "";
            dataFieldString += _this.version + constants_1.DATA_FIELD_SEPARATOR;
            dataFieldString += _this.entityType + constants_1.DATA_FIELD_SEPARATOR;
            dataFieldString += _this.state + constants_1.DATA_FIELD_SEPARATOR;
            dataFieldString += _this.redirectAccount + constants_1.DATA_FIELD_SEPARATOR;
            dataFieldString += _this.payload;
            return dataFieldString;
        };
        this.attestationContext = dataFields && dataFields.attestationContext || "";
        this.version = dataFields && dataFields.version || constants_1.PROTOCOL_VERSION;
        this.entityType = dataFields && dataFields.entityType || types_1.EntityType.LEAF;
        this.state = dataFields && dataFields.state || types_1.State.INACTIVE;
        this.redirectAccount = dataFields && dataFields.redirectAccount || constants_1.DUMMY_ACCOUNT_RS;
        this.payload = dataFields && dataFields.payload || "";
    }
    ;
    Object.defineProperty(DataFields.prototype, "attestationContext", {
        get: function () {
            return this._attestationContext;
        },
        set: function (value) {
            this._attestationContext = this.setAttestationContext(value);
        },
        enumerable: true,
        configurable: true
    });
    return DataFields;
}());
exports.default = DataFields;
