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

import { ATTESTATION_PATH_SEPARATOR, SIGNED_DATA_SEPARATOR } from "../../constants";


export default class TokenData {

    public static createTokenDataString = (path: string[] | undefined, context: string, payload: string): string => {
        let tokenData = "";
        tokenData += (path && path.join(ATTESTATION_PATH_SEPARATOR)) || "";
        tokenData += SIGNED_DATA_SEPARATOR;
        tokenData += context;
        tokenData += SIGNED_DATA_SEPARATOR;
        tokenData += payload;
        return tokenData;
    };;
}
