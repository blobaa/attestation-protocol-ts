"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var types_1 = require("../../types");
var default_1 = /** @class */ (function () {
    function default_1() {
    }
    default_1.getError = function (error) {
        if (error.syscall)
            return { code: types_1.ErrorCode.CONNECTION_ERROR, description: "Connection error. Could not connect to node." };
        if (error.errorCode)
            return { code: types_1.ErrorCode.NODE_ERROR, description: error.errorDescription };
        return error;
    };
    return default_1;
}());
exports.default = default_1;
