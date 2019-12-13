import { objectAny, Error, ErrorCode } from "../../types";

export default class {

    public static getError = (error: objectAny): Error => {
        if(error.syscall) return { code: ErrorCode.CONNECTION_ERROR, description: "Connection error. Could not connect to node." };
        if(error.errorCode) return { code: ErrorCode.NODE_ERROR, description: error.errorDescription };
        return error as Error;
    }
}