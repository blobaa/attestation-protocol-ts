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

import { Error, ErrorCode } from "../src/types";

export const PROTOCOL_VERSION = "001";

export const DATA_FIELD_SEPARATOR = "|";
export const PROTOCOL_IDENTIFIER = "ap://";
export const DUMMY_ACCOUNT_RS = "0000-0000-0000-00000";
export const ACCOUNT_PREFIX = "ARDOR-";
export const NUMBER_OF_DATA_FIELDS = 5;

export const MAX_PAYLOAD_LENGTH = 120;

export const SIGNED_DATA_SEPARATOR = "|";
export const ATTESTATION_PATH_SEPARATOR = ",";

export const MAX_DEPRECATION_HOPS = 20;
export const REDIRECT_ACCOUNT_CHARACTER_LENGTH = 20;

export const IGNIS_ONE_COIN = 100000000;

export const noError: Error = {
    code: ErrorCode.NO_ERROR,
    description: "No error occurred. Everything went well."
};

export const unknown: Error = {
    code: ErrorCode.UNKNOWN,
    description: "An unknown error occurred."
};
