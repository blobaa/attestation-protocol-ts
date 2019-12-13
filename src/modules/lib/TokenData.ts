import { CLAIM_DATA_SEPARATOR, ATTESTATION_PATH_SEPARATOR } from "../../constants";



export default class TokenData {

    public static createTokenDataString = (path: string[] | undefined, context: string, payload: string): string => {
        let tokenData = "";
        tokenData += path && path.join(ATTESTATION_PATH_SEPARATOR) || "";
        tokenData += CLAIM_DATA_SEPARATOR;
        tokenData += context;
        tokenData += CLAIM_DATA_SEPARATOR;
        tokenData += payload;
        return tokenData;
    }
}