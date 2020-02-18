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

import { DecodeTokenParams, DecodeTokenResponse, GetAccountPropertiesParams, GetAccountPropertiesResponse, Request, SetAccountPropertyParams, SetAccountPropertyResponse, time, DeleteAccountPropertyParams, DeleteAccountPropertyResponse } from "@blobaa/ardor-ts";


export default class RequestMock extends Request {
    private readonly defaultResponse = { requestProcessingTime: 0, fullHash: "dummy" };

    private setAccPropCallback: (params: SetAccountPropertyParams) => void;
    private getAccPropCallback: (params: GetAccountPropertiesParams) => { context: string; dataFieldsString: string };
    private deleteAccPropCallback: (params: DeleteAccountPropertyParams) => void;
    private decodeTokenCallback: (params: DecodeTokenParams) => { account: string; valid: boolean };


    constructor(getAccPropCallback?: (params: GetAccountPropertiesParams) => { context: string; dataFieldsString: string },
                setAccPropCallback?: (params: SetAccountPropertyParams) => void,
                decodeTokenCallback?: (params: DecodeTokenParams) => { account: string; valid: boolean },
                deleteAccPropCallback?: (params: DeleteAccountPropertyParams) => void) {
        super();
        this.getAccPropCallback = getAccPropCallback || this.defaultGetAccPropCallback;
        this.setAccPropCallback = setAccPropCallback || this.defaultSetAccPropCallback;
        this.deleteAccPropCallback = deleteAccPropCallback || this.defaultDeleteAccPropCallback;
        this.decodeTokenCallback = decodeTokenCallback || this.defaultDecodeTokenCallback;
    }

    private defaultGetAccPropCallback = (params: GetAccountPropertiesParams): { context: string; dataFieldsString: string } => { return { context: "", dataFieldsString: "" }}
    private defaultSetAccPropCallback = (params: SetAccountPropertyParams): void => {}
    private defaultDeleteAccPropCallback = (params: DeleteAccountPropertyParams): void => {}
    private defaultDecodeTokenCallback = (params: DecodeTokenParams): { account: string; valid: boolean } => { return { account: "none", valid: true }}


    public getAccountProperties = (url: string, params: GetAccountPropertiesParams): Promise<GetAccountPropertiesResponse> => {
        const callbackReturn = this.getAccPropCallback(params);
        return Promise.resolve(this.assembleAccountPropertyResponse(callbackReturn.context, callbackReturn.dataFieldsString));
    }

    private assembleAccountPropertyResponse = (property: string, value: string): GetAccountPropertiesResponse => {
        const resp = {
            recipientRS: "",
            recipient: "",
            requestProcessingTime: 0,
            /*eslint-disable @typescript-eslint/no-explicit-any*/
            properties: [] as any
            /*eslint-enable @typescript-eslint/no-explicit-any*/
        };
        if (value !== "none") {
            resp.properties.push({
                setterRS: "",
                property,
                setter: "",
                value
            });
        }
        return resp as GetAccountPropertiesResponse;
    }


    public setAccountProperty = (url: string, params: SetAccountPropertyParams): Promise<SetAccountPropertyResponse> => {
        this.setAccPropCallback(params);
        return Promise.resolve(this.defaultResponse);
    }


    public deleteAccountProperty = (url: string, params: DeleteAccountPropertyParams): Promise<DeleteAccountPropertyResponse> => {
        this.deleteAccPropCallback(params);
        return Promise.resolve(this.defaultResponse);
    }


    public decodeToken = (url: string, params: DecodeTokenParams): Promise<DecodeTokenResponse> => {
        const callbackReturn = this.decodeTokenCallback(params);
        return Promise.resolve(this.assembleDecodeTokenResponse(callbackReturn.account, callbackReturn.valid));
    }

    private assembleDecodeTokenResponse = (_account: string, valid: boolean): DecodeTokenResponse => {
        return {
            account: "00000",
            accountRS: _account,
            requestProcessingTime: 42,
            timestamp: time.convertUnixToArdorTimestamp((new Date()).getTime(), true),
            valid
        };
    }
}
