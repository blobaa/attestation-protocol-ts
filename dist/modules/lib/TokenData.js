"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var constants_1 = require("../../constants");
var TokenData = /** @class */ (function () {
    function TokenData() {
    }
    TokenData.createTokenDataString = function (path, context, payload) {
        var tokenData = "";
        tokenData += path && path.join(constants_1.ATTESTATION_PATH_SEPARATOR) || "";
        tokenData += constants_1.CLAIM_DATA_SEPARATOR;
        tokenData += context;
        tokenData += constants_1.CLAIM_DATA_SEPARATOR;
        tokenData += payload;
        return tokenData;
    };
    return TokenData;
}());
exports.default = TokenData;
