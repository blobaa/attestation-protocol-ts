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

import { Error, ErrorCode, objectAny } from "../../types";
import { unknown } from "../../constants";


export default class Helper {

    public static getError(error: objectAny): Error {
        if (error.syscall) {
            return {
                code: ErrorCode.CONNECTION_ERROR,
                description: "Connection error. Could not connect to node."
            };
        }
        if (error.errorCode) {
            return {
                code: ErrorCode.NODE_ERROR,
                description: error.errorDescription
            };
        }
        return error as Error;
    }


    public static createError(errorCode: ErrorCode, params?: string[]): Error {
        const error: Error = {
            code: errorCode,
            description: ""
        };

        const _params = params || [];


        switch (errorCode) {

            case ErrorCode.ATTESTATION_CONTEXT_ALREADY_SET: {
                error.description = "Attestation context already set. Account '" + _params[0] + "' already has a property with name '" + _params[1] + "' set by '" + _params[2] + "'.";
                return error;
            }
            case ErrorCode.ATTESTATION_CONTEXT_NOT_FOUND: {
                error.description = "Attestation context not found. The specified attestation context could not be found at account '" + _params[0] + "'.";
                return error;
            }
            case ErrorCode.ATTESTATION_NOT_ALLOWED: {
                let desc = "";
                if (_params.length === 0) {
                    desc = "Attestation not allowed. A leaf entity is not allowed to attest.";
                } else {
                    desc = "Attestation not allowed. A " + _params[0] + " entity is not allowed to attest a " + _params[1] + ".";
                }
                error.description = desc;
                return error;
            }
            case ErrorCode.CREATOR_ACCOUNT_DEPRECATED: {
                error.description = "Creator account deprecated. The data object creator account '" + _params[0] + "' is deprecated.";
                return error;
            }
            case ErrorCode.DEPRECATE_STATE_CANNOT_BE_SET: {
                error.description = "Deprecate state cannot be set directly. Set redirect account instead.";
                return error;
            }
            case ErrorCode.END_ENTITY_NOT_ROOT: {
                error.description = "Trust path doesn't end with root entity. Account '" + _params[0] + "' is not a root entity.";
                return error;
            }
            case ErrorCode.ENTITY_CALLBACK_ERROR: {
                error.description = "Entity check callback error. Your callback returned false.";
                return error;
            }
            case ErrorCode.ENTITY_INACTIVE: {
                error.description = "Entity inactive. Account '" + _params[0] + "' is inactive.";
                return error;
            }
            case ErrorCode.ENTITY_MISMATCH: {
                error.description = "Entity mismatch. You're trying to revoke a '" + _params[0] + "' attestation, but the found attestation is of type '" + _params[1] + "'.";
                return error;
            }
            case ErrorCode.ENTITY_NOT_ACTIVE: {
                error.description = "Entity is not active. An entity must be in state active to attest.";
                return error;
            }
            case ErrorCode.INVALID_REDIRECT_ACCOUNT: {
                error.description = "Invalid redirect account. The redirect account is not a valid Ardor account.";
                return error;
            }
            case ErrorCode.INVALID_SIGNATURE: {
                error.description = "Invalid signature token. The signature does not belong to the data object.";
                return error;
            }
            case ErrorCode.LEAF_ATTESTOR_NOT_ALLOWED: {
                error.description = "Leaf entity cannot attest. Account '" + _params[0] + "' tries to act as attestor but is a leaf entity.";
                return error;
            }
            case ErrorCode.PAYLOAD_ALREADY_SET: {
                error.description = "Payload already set. Your requested payload has the same value as the current payload.";
                return error;
            }
            case ErrorCode.PAYLOAD_TOO_LONG: {
                error.description = "Payload is too long. Has to be less than " + _params[0] + " character.";
                return error;
            }
            case ErrorCode.ROOT_ENTITY_IN_MIDDLE_OF_PATH: {
                error.description = "Root entity in the middle of the trust path. Account '" + _params[0] + "' was detected in the middle of the trust path but is a root entity.";
                return error;
            }
            case ErrorCode.SELF_ATTESTATION_NOT_ALLOWED: {
                error.description = "Self attestation is not allowed. Only a root entity is permitted to self attest.";
                return error;
            }
            case ErrorCode.SIGNED_DATA_CALLBACK_ERROR: {
                error.description = "Data object check callback error. Your callback returned false.";
                return error;
            }
            case ErrorCode.STATE_ALREADY_SET: {
                error.description = "State already set. Your requested state has the same value as the current state.";
                return error;
            }
            case ErrorCode.TOO_MANY_DEPRECATION_HOPS: {
                error.description = "Too many deprecation hops. Processed too many deprecation hops for account '" + _params[0] + "'.";
                return error;
            }
            case ErrorCode.TRUSTED_ROOT_NOT_FOUND: {
                error.description = "Trusted root not found. Your specified trusted root account '" + _params[0] + "' could not be found.";
                return error;
            }
            case ErrorCode.UNKNOWN_ENTITY_TYPE: {
                error.description = "Unknown entity type.";
                return error;
            }
            case ErrorCode.UNKNOWN_STATE_TYPE: {
                error.description = "Unknown state type.";
                return error;
            }
            case ErrorCode.WRONG_CREATOR_ACCOUNT: {
                error.description = "Wrong creator account. The specified creator account '" + _params[0] + "' does not match with the calculated account '" + _params[1] + "'.";
                return error;
            }
            case ErrorCode.WRONG_ENTITY_TYPE: {
                error.description = "Wrong entity type. Entity '" + _params[0] + "' does not match with your request.";
                return error;
            }
            case ErrorCode.WRONG_ENTITY_TYPE_LENGTH: {
                error.description = "Wrong entity type length. Entity type data field must consist of 1 character.";
                return error;
            }
            case ErrorCode.WRONG_NUMBER_OF_DATA_FIELDS: {
                error.description = "Wrong number of data fields. The data field string must contain exactly " + _params[0] + " '" + _params[1] + "' characters.";
                return error;
            }
            case ErrorCode.WRONG_REDIRECT_ACCOUNT_LENGTH: {
                error.description = "Wrong redirect account length. Redirect account type data field must consist of " + _params[0] + "character.";
                return error;
            }
            case ErrorCode.WRONG_STATE_TYPE_LENGTH: {
                error.description = "Wrong state type length. State type data field must consist of 1 character.";
                return error;
            }
            case ErrorCode.WRONG_VERSION: {
                error.description = "Wrong version. Version must be " + _params[0] + ".";
                return error;
            }
            case ErrorCode.WRONG_VERSION_LENGTH: {
                error.description = "Wrong version length. Version data field must consist of 3 character.";
                return error;
            }
            default:
                return unknown;
        }
    }
}
