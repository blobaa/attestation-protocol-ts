import { Error, ErrorCode } from '../src/types'

export const PROTOCOL_VERSION = '001';

export const DATA_FIELD_SEPARATOR = '|';
export const PROTOCOL_IDENTIFIER = 'ap://';
export const DUMMY_ACCOUNT_RS = '0000-0000-0000-00000';
export const ACCOUNT_PREFIX = 'ARDOR-';
export const NUMBER_OF_DATA_FIELDS = 5;

export const MAX_PAYLOAD_LENGTH = 120;

export const CLAIM_DATA_SEPARATOR = '|';
export const ATTESTATION_PATH_SEPARATOR = ',';

export const MAX_DEPRECATION_HOPS = 20;


export const noError: Error = {
    code: ErrorCode.NO_ERROR,
    description: "No error occurred. Everything went well."
}

export const unknown: Error = {
    code: ErrorCode.UNKNOWN,
    description: "An unknown error occurred."
}