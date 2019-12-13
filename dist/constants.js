"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var types_1 = require("../src/types");
exports.PROTOCOL_VERSION = '001';
exports.DATA_FIELD_SEPARATOR = '|';
exports.PROTOCOL_IDENTIFIER = 'ap://';
exports.DUMMY_ACCOUNT_RS = '0000-0000-0000-00000';
exports.ACCOUNT_PREFIX = 'ARDOR-';
exports.NUMBER_OF_DATA_FIELDS = 5;
exports.MAX_PAYLOAD_LENGTH = 120;
exports.CLAIM_DATA_SEPARATOR = '|';
exports.ATTESTATION_PATH_SEPARATOR = ',';
exports.MAX_DEPRECATION_HOPS = 20;
exports.noError = {
    code: types_1.ErrorCode.NO_ERROR,
    description: "No error occurred. Everything went well."
};
exports.unknown = {
    code: types_1.ErrorCode.UNKNOWN,
    description: "An unknown error occurred."
};
