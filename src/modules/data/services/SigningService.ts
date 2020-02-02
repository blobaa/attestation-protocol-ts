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
import { SignDataParams, SignedData } from "../../../types";
import TokenData from "../../lib/TokenData";


export default class SigningService {
    public sign(params: SignDataParams, forTestnet: boolean): SignedData {
        const tokenDataString = TokenData.createTokenDataString(params.attestationPath, params.attestationContext, params.payload);
        const creatorAccount = account.convertPassphraseToAccountRs(params.passphrase);

        const signedData: SignedData = {
            attestationContext: params.attestationContext,
            attestationPath: (params.attestationPath && params.attestationPath) || [ creatorAccount ],
            creatorAccount,
            payload: params.payload,
            signature: account.generateToken(tokenDataString, params.passphrase, forTestnet)
        };

        return signedData;
    }
}