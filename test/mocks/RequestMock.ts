import { DecodeTokenParams, DecodeTokenResponse, GetAccountPropertiesParams, GetAccountPropertiesResponse, Request, SetAccountPropertyParams, SetAccountPropertyResponse, time, DeleteAccountPropertyParams, DeleteAccountPropertyResponse } from '@somedotone/ardor-ts';


export default class RequestMock extends Request {
    private readonly defaultResponse = { requestProcessingTime: 0, fullHash: "dummy" };
    
    private setAccPropCallback: (params: SetAccountPropertyParams) => void;
    private getAccPropCallback: (params: GetAccountPropertiesParams) => { context: string, dataFieldsString: string };
    private deleteAccPropCallback: (params: DeleteAccountPropertyParams) => void;
    private decodeTokenCallback: (params: DecodeTokenParams) => { account: string, valid: boolean };



    constructor(getAccPropCallback?: (params: GetAccountPropertiesParams) => { context: string, dataFieldsString: string }, setAccPropCallback?: (params: SetAccountPropertyParams) => void, decodeTokenCallback?: (params: DecodeTokenParams) => { account: string, valid: boolean }, deleteAccPropCallback?: (params: DeleteAccountPropertyParams) => void) {
        super();
        this.getAccPropCallback = getAccPropCallback || this.defaultGetAccPropCallback;
        this.setAccPropCallback = setAccPropCallback || this.defaultSetAccPropCallback;
        this.deleteAccPropCallback = deleteAccPropCallback || this.defaultDeleteAccPropCallback;
        this.decodeTokenCallback = decodeTokenCallback || this.defaultDecodeTokenCallback;
    }

    private defaultGetAccPropCallback = (params: GetAccountPropertiesParams): { context: string, dataFieldsString: string } => { return {context: "", dataFieldsString: "" }}
    private defaultSetAccPropCallback = (params: SetAccountPropertyParams): void => {}
    private defaultDeleteAccPropCallback = (params: DeleteAccountPropertyParams): void => {}
    private defaultDecodeTokenCallback = (params: DecodeTokenParams): { account: string, valid: boolean } => { return { account: "none", valid: true}}


    public getAccountProperties = (url: string, params: GetAccountPropertiesParams): Promise<GetAccountPropertiesResponse> => {
        const callbackReturn = this.getAccPropCallback(params);
        return Promise.resolve(this.assembleAccountPropertyResponse(callbackReturn.context, callbackReturn.dataFieldsString));
    }

    private assembleAccountPropertyResponse = (property: string, value: string): GetAccountPropertiesResponse => {
        let resp = {
            recipientRS: "",
            recipient: "",
            requestProcessingTime: 0,
            properties: [] as any
        };
        if(value !== 'none') {
            resp.properties.push({
                setterRS: "",
                property: property,
                setter: "",
                value: value
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
            valid: valid
        };
    }
    
}