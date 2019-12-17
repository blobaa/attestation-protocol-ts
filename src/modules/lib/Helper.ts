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

import { objectAny, Error, ErrorCode } from "../../types";


export default class {

    public static getError = (error: objectAny): Error => {
        if(error.syscall) return { code: ErrorCode.CONNECTION_ERROR, description: "Connection error. Could not connect to node." };
        if(error.errorCode) return { code: ErrorCode.NODE_ERROR, description: error.errorDescription };
        return error as Error;
    }
}