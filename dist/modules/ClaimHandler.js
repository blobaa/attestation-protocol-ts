"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var ardor_ts_1 = require("ardor-ts");
var constants_1 = require("../constants");
var types_1 = require("../types");
var DataFields_1 = __importDefault(require("./lib/DataFields"));
var Helper_1 = __importDefault(require("./lib/Helper"));
var TokenData_1 = __importDefault(require("./lib/TokenData"));
var TrustPathState;
(function (TrustPathState) {
    TrustPathState[TrustPathState["BEGIN"] = 0] = "BEGIN";
    TrustPathState[TrustPathState["ONGOING"] = 1] = "ONGOING";
    TrustPathState[TrustPathState["END"] = 2] = "END";
})(TrustPathState || (TrustPathState = {}));
var ClaimHandler = /** @class */ (function () {
    function ClaimHandler(request) {
        var _this = this;
        if (request === void 0) { request = new ardor_ts_1.Request(); }
        this.createClaim = function (params, forTestnet) {
            if (forTestnet === void 0) { forTestnet = false; }
            var tokenDataString = TokenData_1.default.createTokenDataString(params.attestationPath, params.attestationContext, params.payload);
            var creatorAccount = ardor_ts_1.account.convertPassphraseToAccountRs(params.passphrase);
            var claimObject = {
                payload: params.payload,
                attestationContext: params.attestationContext,
                attestationPath: params.attestationPath && params.attestationPath || [creatorAccount],
                signature: ardor_ts_1.account.generateToken(tokenDataString, params.passphrase, forTestnet),
                creatorAccount: creatorAccount
            };
            return claimObject;
        };
        this.verifyClaim = function (url, params, forTestnet) {
            if (forTestnet === void 0) { forTestnet = false; }
            return __awaiter(_this, void 0, void 0, function () {
                var claimCheckCallback, entityCheckCallback, trustChainResponse;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            claimCheckCallback = params.claimCheckCallback && params.claimCheckCallback || this.defaultClaimCb;
                            entityCheckCallback = params.entityCheckCallback && params.entityCheckCallback || this.defaultEntityCb;
                            return [4 /*yield*/, this.checkClaim(url, params.claim, claimCheckCallback, forTestnet)];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, this.parseTrustChain(url, params.claim, params.trustedRootAccount, entityCheckCallback)];
                        case 2:
                            trustChainResponse = _a.sent();
                            return [2 /*return*/, Promise.resolve({ activeRootAccount: trustChainResponse.activeRoot, verifiedTrustChain: trustChainResponse.parsedChain })];
                    }
                });
            });
        };
        this.defaultClaimCb = function (claim) { return true; };
        this.defaultEntityCb = function (entity) { return true; };
        this.checkClaim = function (url, claim, claimCheckCallback, forTestnet) { return __awaiter(_this, void 0, void 0, function () {
            var params, tokenResponse, claimCheckParams, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        params = {
                            data: TokenData_1.default.createTokenDataString(claim.attestationPath, claim.attestationContext, claim.payload),
                            token: claim.signature
                        };
                        return [4 /*yield*/, this.request.decodeToken(url, params)];
                    case 1:
                        tokenResponse = _a.sent();
                        if (!tokenResponse.valid)
                            return [2 /*return*/, Promise.reject({ code: types_1.ErrorCode.INVALID_SIGNATURE, description: "Invalid signature token. The signature does not belong to the claim" })];
                        if (tokenResponse.accountRS !== claim.creatorAccount)
                            return [2 /*return*/, Promise.reject({ code: types_1.ErrorCode.WRONG_CLAIM_CREATOR_ACCOUNT, description: "Wrong creator account. The specified claim creator account '" + claim.creatorAccount + "' does not match with the calculated account '" + tokenResponse.accountRS + "'." })];
                        claimCheckParams = {
                            claim: claim,
                            creationTime: ardor_ts_1.time.convertArdorToUnixTimestamp(tokenResponse.timestamp, forTestnet)
                        };
                        if (!claimCheckCallback(claimCheckParams))
                            return [2 /*return*/, Promise.reject({ code: types_1.ErrorCode.CLAIM_CALLBACK_ERROR, description: "Claim check callback error. Your claimCheckCallback returned false" })];
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _a.sent();
                        return [2 /*return*/, Promise.reject(Helper_1.default.getError(error_1))];
                    case 3: return [2 /*return*/];
                }
            });
        }); };
        this.parseTrustChain = function (url, claim, trustedRoot, entityCheckCallback) { return __awaiter(_this, void 0, void 0, function () {
            var trustedRootFound, trustPath, verificationPath, i, dataFields, verificationParams, claimant, attestor, deprecationHops, deprecatedEntityType, entity;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        trustedRootFound = false;
                        trustPath = this.setTrustPath(claim);
                        verificationPath = [];
                        i = 0;
                        _a.label = 1;
                    case 1:
                        if (!(i < trustPath.length)) return [3 /*break*/, 6];
                        dataFields = new DataFields_1.default();
                        verificationParams = this.setVerificationParameter(trustPath, i);
                        claimant = verificationParams.claimant;
                        attestor = verificationParams.attestor;
                        deprecationHops = 0;
                        deprecatedEntityType = undefined;
                        _a.label = 2;
                    case 2:
                        verificationPath.push(claimant);
                        return [4 /*yield*/, this.getAndCheckDataFields(url, claimant, attestor, claim.attestationContext, verificationParams.state)];
                    case 3:
                        dataFields = _a.sent();
                        if (dataFields.state === types_1.State.DEPRECATED && deprecatedEntityType === undefined)
                            deprecatedEntityType = dataFields.entityType;
                        if (deprecatedEntityType !== undefined && deprecatedEntityType !== dataFields.entityType)
                            return [2 /*return*/, Promise.reject({ code: types_1.ErrorCode.ENTITY_MISMATCH, description: "Entity mismatch. The entity type of redirect account '" + claimant + "' mismatches from its origin account." })];
                        if (verificationParams.state === TrustPathState.END && claimant === trustedRoot)
                            trustedRootFound = true;
                        entity = {
                            account: claimant,
                            entityType: dataFields.entityType,
                            payload: dataFields.payload,
                            state: dataFields.state,
                            protocolVersion: dataFields.version
                        };
                        if (!entityCheckCallback(entity))
                            return [2 /*return*/, Promise.reject({ code: types_1.ErrorCode.ENTITY_CALLBACK_ERROR, description: "Entity check callback error. Your entityCheckCallback returned false" })];
                        if (deprecationHops >= constants_1.MAX_DEPRECATION_HOPS)
                            return [2 /*return*/, Promise.reject({ code: types_1.ErrorCode.TOO_MANY_DEPRECATION_HOPS, description: "Too many deprecation hops. Processed too many deprecation hops for account '" + verificationParams.claimant + "'." })];
                        claimant = constants_1.ACCOUNT_PREFIX + dataFields.redirectAccount;
                        if (verificationParams.state === TrustPathState.END)
                            attestor = claimant;
                        deprecationHops++;
                        _a.label = 4;
                    case 4:
                        if (dataFields.state === types_1.State.DEPRECATED) return [3 /*break*/, 2];
                        _a.label = 5;
                    case 5:
                        i++;
                        return [3 /*break*/, 1];
                    case 6:
                        if (!trustedRootFound)
                            return [2 /*return*/, Promise.reject({ code: types_1.ErrorCode.TRUSTED_ROOT_NOT_FOUND, description: "Trusted root not found. Your specified trusted root account '" + trustedRoot + "' could not be found." })];
                        return [2 /*return*/, Promise.resolve({ activeRoot: verificationPath[verificationPath.length - 1], parsedChain: verificationPath })];
                }
            });
        }); };
        this.setTrustPath = function (claim) {
            return _this.isClaimCreatorRoot(claim) ? [claim.creatorAccount] : claim.attestationPath && __spreadArrays([claim.creatorAccount], claim.attestationPath) || [];
        };
        this.isClaimCreatorRoot = function (claim) {
            return (!claim.attestationPath || claim.attestationPath.length === 0 || claim.attestationPath[0] === claim.creatorAccount);
        };
        this.setVerificationParameter = function (trustPath, counter) {
            if (counter === trustPath.length - 1)
                return {
                    attestor: trustPath[counter],
                    claimant: trustPath[counter],
                    state: TrustPathState.END
                };
            else if (counter === 0)
                return {
                    attestor: trustPath[counter + 1],
                    claimant: trustPath[counter],
                    state: TrustPathState.BEGIN
                };
            else
                return {
                    attestor: trustPath[counter + 1],
                    claimant: trustPath[counter],
                    state: TrustPathState.ONGOING
                };
        };
        this.getAndCheckDataFields = function (url, claimantAccount, attestorAccount, attestationContext, state) { return __awaiter(_this, void 0, void 0, function () {
            var dataFields, response, propertyObject, error, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        dataFields = new DataFields_1.default();
                        dataFields.attestationContext = attestationContext;
                        return [4 /*yield*/, this.request.getAccountProperties(url, { setter: attestorAccount, recipient: claimantAccount, property: dataFields.attestationContext })];
                    case 1:
                        response = _a.sent();
                        propertyObject = response.properties[0];
                        if (!propertyObject)
                            return [2 /*return*/, Promise.reject({ code: types_1.ErrorCode.ATTESTATION_CONTEXT_NOT_FOUND, description: "Attestation context not found. Attestation context '" + dataFields.attestationContext + "' could not be found at claimant '" + claimantAccount + "' set by attestor ' " + attestorAccount + "'." })];
                        error = dataFields.consumeDataFieldString(propertyObject.value);
                        if (error.code !== types_1.ErrorCode.NO_ERROR)
                            return [2 /*return*/, Promise.reject(error)];
                        if (dataFields.entityType === types_1.EntityType.LEAF && state !== TrustPathState.BEGIN)
                            return [2 /*return*/, Promise.reject({ code: types_1.ErrorCode.LEAF_ATTESTOR_NOT_ALLOWED, description: "Leaf entity cannot attest. Account '" + claimantAccount + "' tries to act as attestor but is a leaf entity" })];
                        if (dataFields.entityType !== types_1.EntityType.ROOT && state === TrustPathState.END)
                            return [2 /*return*/, Promise.reject({ code: types_1.ErrorCode.END_ENTITY_NOT_ROOT, description: "Trust path doesn't end with root entity. Account '" + claimantAccount + "' is not a root entity" })];
                        if (dataFields.entityType === types_1.EntityType.ROOT && state !== TrustPathState.END)
                            return [2 /*return*/, Promise.reject({ code: types_1.ErrorCode.ROOT_ENTITY_IN_MIDDLE_OF_PATH, description: "Root entity in the middle of the trust path. Account '" + claimantAccount + "' was detected in the middle of the trust path but is a root entity" })];
                        if (dataFields.state === types_1.State.INACTIVE)
                            return [2 /*return*/, Promise.reject({ code: types_1.ErrorCode.ENTITY_INACTIVE, description: "Entity inactive. Account '" + claimantAccount + "' is inactive." })];
                        if (dataFields.state === types_1.State.DEPRECATED && state === TrustPathState.BEGIN)
                            return [2 /*return*/, Promise.reject({ code: types_1.ErrorCode.CLAIM_CREATOR_DEPRECATED, description: "Claim creator account deprecated. The claim creator account '" + claimantAccount + "' is deprecated." })];
                        return [2 /*return*/, dataFields];
                    case 2:
                        error_2 = _a.sent();
                        return [2 /*return*/, Promise.reject(Helper_1.default.getError(error_2))];
                    case 3: return [2 /*return*/];
                }
            });
        }); };
        this.request = request;
    }
    return ClaimHandler;
}());
exports.default = ClaimHandler;
