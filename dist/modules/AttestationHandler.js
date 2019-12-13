"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var ardor_ts_1 = require("ardor-ts");
var constants_1 = require("../constants");
var types_1 = require("../types");
var DataFields_1 = __importDefault(require("./lib/DataFields"));
var Helper_1 = __importDefault(require("./lib/Helper"));
var AttestationHandler = /** @class */ (function () {
    function AttestationHandler(request) {
        var _this = this;
        if (request === void 0) { request = new ardor_ts_1.Request(); }
        this.createRootAttestation = function (url, params) { return __awaiter(_this, void 0, void 0, function () {
            var response, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.createAttestation(url, params, types_1.EntityType.ROOT)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, Promise.resolve({ transactionId: response.fullHash })];
                    case 2:
                        error_1 = _a.sent();
                        return [2 /*return*/, Promise.reject(Helper_1.default.getError(error_1))];
                    case 3: return [2 /*return*/];
                }
            });
        }); };
        this.createAttestation = function (url, params, entityType, skipChecks) {
            if (skipChecks === void 0) { skipChecks = false; }
            return __awaiter(_this, void 0, void 0, function () {
                var dataFields, error, myAccount, attestorAccount;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            dataFields = new DataFields_1.default();
                            params.payload = params.payload || "";
                            error = dataFields.checkPayload(params.payload);
                            if (error.code !== types_1.ErrorCode.NO_ERROR)
                                return [2 /*return*/, Promise.reject(error)];
                            if (!!skipChecks) return [3 /*break*/, 4];
                            myAccount = ardor_ts_1.account.convertPassphraseToAccountRs(params.passphrase);
                            attestorAccount = params.myAttestorAccount && params.myAttestorAccount || myAccount;
                            if (!this.isNotRootAttestation(params)) return [3 /*break*/, 2];
                            if (myAccount === this.getRecipient(params))
                                return [2 /*return*/, Promise.reject({ code: types_1.ErrorCode.SELF_ATTESTATION_NOT_ALLOWED, description: "Self attestation is not allowed. Only a root entity is permitted to self attest." })];
                            return [4 /*yield*/, this.checkOwnEntityAndState(url, myAccount, attestorAccount, dataFields.setAttestationContext(params.attestationContext), new DataFields_1.default(), false, entityType)];
                        case 1:
                            error = _a.sent();
                            if (error.code !== types_1.ErrorCode.NO_ERROR)
                                return [2 /*return*/, Promise.reject(error)];
                            return [3 /*break*/, 4];
                        case 2: return [4 /*yield*/, this.checkRootAttestation(url, myAccount, attestorAccount, dataFields.setAttestationContext(params.attestationContext))];
                        case 3:
                            error = _a.sent();
                            if (error.code !== types_1.ErrorCode.NO_ERROR)
                                return [2 /*return*/, Promise.reject(error)];
                            _a.label = 4;
                        case 4:
                            dataFields.attestationContext = params.attestationContext;
                            dataFields.state = types_1.State.ACTIVE;
                            dataFields.entityType = entityType;
                            dataFields.payload = params.payload;
                            return [2 /*return*/, this.createAttestationTransaction(url, params.passphrase, this.getRecipient(params), dataFields)];
                    }
                });
            });
        };
        this.isNotRootAttestation = function (params) {
            return (params.intermediateAccount || params.leafAccount);
        };
        this.checkOwnEntityAndState = function (url, myAccount, attestorAccount, attestationContext, dataFields, isStateUpdate, entity) { return __awaiter(_this, void 0, void 0, function () {
            var response, propertyObject, error, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        dataFields.attestationContext = attestationContext;
                        return [4 /*yield*/, this.request.getAccountProperties(url, { setter: attestorAccount, recipient: myAccount, property: dataFields.attestationContext })];
                    case 1:
                        response = _a.sent();
                        propertyObject = response.properties[0];
                        if (!propertyObject)
                            return [2 /*return*/, { code: types_1.ErrorCode.ATTESTATION_CONTEXT_NOT_FOUND, description: "Attestation context not found. The specified attestation context could not be found at account '" + myAccount + "'." }];
                        error = dataFields.consumeDataFieldString(propertyObject.value);
                        if (error.code !== types_1.ErrorCode.NO_ERROR)
                            return [2 /*return*/, Promise.reject(error)];
                        if (dataFields.entityType === types_1.EntityType.LEAF)
                            return [2 /*return*/, Promise.reject({ code: types_1.ErrorCode.ATTESTATION_NOT_ALLOWED, description: "Attestation not allowed. A leaf entity is not allowed to attest." })];
                        if (dataFields.state !== types_1.State.ACTIVE && !isStateUpdate)
                            return [2 /*return*/, Promise.reject({ code: types_1.ErrorCode.ENTITY_NOT_ACTIVE, description: "Entity is not active. An entity must be in state active to attest." })];
                        if (!this.isEntityPermitted(dataFields.entityType, entity))
                            return [2 /*return*/, Promise.reject({ code: types_1.ErrorCode.ATTESTATION_NOT_ALLOWED, description: "Attestation not allowed. A " + this.getEntityTypeName(dataFields.entityType) + " entity is not allowed to attest a " + this.getEntityTypeName(entity) + "." })];
                        return [3 /*break*/, 3];
                    case 2:
                        error_2 = _a.sent();
                        return [2 /*return*/, Promise.reject(Helper_1.default.getError(error_2))];
                    case 3: return [2 /*return*/, constants_1.noError];
                }
            });
        }); };
        this.checkRootAttestation = function (url, myAccount, attestorAccount, attestationContext) { return __awaiter(_this, void 0, void 0, function () {
            var response, propertyObject, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.request.getAccountProperties(url, { setter: attestorAccount, recipient: myAccount, property: attestationContext })];
                    case 1:
                        response = _a.sent();
                        propertyObject = response.properties[0];
                        if (propertyObject)
                            return [2 /*return*/, { code: types_1.ErrorCode.ATTESTATION_CONTEXT_ALREADY_SET, description: "Attestation context already set. The new account already has a property with name '" + attestationContext + "' set by account '" + attestorAccount + "'." }];
                        return [3 /*break*/, 3];
                    case 2:
                        error_3 = _a.sent();
                        return [2 /*return*/, Promise.reject(Helper_1.default.getError(error_3))];
                    case 3: return [2 /*return*/, constants_1.noError];
                }
            });
        }); };
        this.createAttestationTransaction = function (url, passphrase, claimantAccount, dataFields) { return __awaiter(_this, void 0, void 0, function () {
            var propertyRequestParams;
            return __generator(this, function (_a) {
                propertyRequestParams = {
                    chain: ardor_ts_1.ChainId.IGNIS,
                    secretPhrase: passphrase,
                    recipient: claimantAccount,
                    property: dataFields.attestationContext,
                    value: dataFields.createDataFieldsString()
                };
                return [2 /*return*/, this.request.setAccountProperty(url, propertyRequestParams)];
            });
        }); };
        this.getRecipient = function (params) {
            if (params.intermediateAccount)
                return params.intermediateAccount;
            if (params.leafAccount)
                return params.leafAccount;
            return ardor_ts_1.account.convertPassphraseToAccountRs(params.passphrase);
        };
        this.createIntermediateAttestation = function (url, params) { return __awaiter(_this, void 0, void 0, function () {
            var response, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.createAttestation(url, params, types_1.EntityType.INTERMEDIATE)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, Promise.resolve({ transactionId: response.fullHash })];
                    case 2:
                        error_4 = _a.sent();
                        return [2 /*return*/, Promise.reject(Helper_1.default.getError(error_4))];
                    case 3: return [2 /*return*/];
                }
            });
        }); };
        this.createLeafAttestation = function (url, params) { return __awaiter(_this, void 0, void 0, function () {
            var response, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.createAttestation(url, params, types_1.EntityType.LEAF)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, Promise.resolve({ transactionId: response.fullHash })];
                    case 2:
                        error_5 = _a.sent();
                        return [2 /*return*/, Promise.reject(Helper_1.default.getError(error_5))];
                    case 3: return [2 /*return*/];
                }
            });
        }); };
        this.createAttestationUnchecked = function (url, params) { return __awaiter(_this, void 0, void 0, function () {
            var _params, response, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _params = __assign({}, params);
                        if (params.entityType === types_1.EntityType.INTERMEDIATE)
                            _params.intermediateAccount = params.account;
                        if (params.entityType === types_1.EntityType.LEAF)
                            _params.leafAccount = params.account;
                        delete _params.account;
                        delete _params.entityType;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.createAttestation(url, _params, params.entityType, true)];
                    case 2:
                        response = _a.sent();
                        return [2 /*return*/, Promise.resolve({ transactionId: response.fullHash })];
                    case 3:
                        error_6 = _a.sent();
                        return [2 /*return*/, Promise.reject(Helper_1.default.getError(error_6))];
                    case 4: return [2 /*return*/];
                }
            });
        }); };
        this.updateRootAttestation = function (url, params) { return __awaiter(_this, void 0, void 0, function () {
            var response, error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.updateAttestation(url, params, types_1.EntityType.ROOT)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, Promise.resolve({ transactionId: response.fullHash })];
                    case 2:
                        error_7 = _a.sent();
                        return [2 /*return*/, Promise.reject(Helper_1.default.getError(error_7))];
                    case 3: return [2 /*return*/];
                }
            });
        }); };
        this.updateAttestation = function (url, params, entity) { return __awaiter(_this, void 0, void 0, function () {
            var ownDataFields, isStateUpdate, myAccount, attestorAccount, error, oldDataFields, newDataFields, newClaimantAccount, error_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        ownDataFields = new DataFields_1.default();
                        isStateUpdate = false;
                        if (params.newState)
                            isStateUpdate = true;
                        myAccount = ardor_ts_1.account.convertPassphraseToAccountRs(params.passphrase);
                        attestorAccount = params.myAttestorAccount && params.myAttestorAccount || myAccount;
                        return [4 /*yield*/, this.checkOwnEntityAndState(url, myAccount, attestorAccount, ownDataFields.setAttestationContext(params.attestationContext), ownDataFields, isStateUpdate, entity)];
                    case 1:
                        error = _a.sent();
                        if (error.code !== types_1.ErrorCode.NO_ERROR)
                            return [2 /*return*/, Promise.reject(error)];
                        oldDataFields = new DataFields_1.default();
                        if (!(entity !== types_1.EntityType.ROOT)) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.checkClaimantEntityAndState(url, this.getRecipient(params), myAccount, ownDataFields.attestationContext, oldDataFields, isStateUpdate, entity)];
                    case 2:
                        error = _a.sent();
                        if (error.code !== types_1.ErrorCode.NO_ERROR)
                            return [2 /*return*/, Promise.reject(error)];
                        return [3 /*break*/, 4];
                    case 3:
                        oldDataFields = ownDataFields;
                        _a.label = 4;
                    case 4:
                        newDataFields = new DataFields_1.default(oldDataFields);
                        if (params.newState) {
                            if (params.newState === oldDataFields.state)
                                return [2 /*return*/, Promise.reject({ code: types_1.ErrorCode.STATE_ALREADY_SET, description: "State already set. Your requested state has the same value as the current state." })];
                            if (params.newState === types_1.State.DEPRECATED)
                                return [2 /*return*/, Promise.reject({ code: types_1.ErrorCode.DEPRECATE_STATE_CANNOT_BE_SET, description: "Deprecate state cannot be set directly. Set redirect account instead." })];
                            newDataFields.state = params.newState;
                        }
                        if (params.newPayload) {
                            error = oldDataFields.checkPayload(params.newPayload);
                            if (error.code !== types_1.ErrorCode.NO_ERROR)
                                return [2 /*return*/, Promise.reject(error)];
                            if (params.newPayload === oldDataFields.payload)
                                return [2 /*return*/, Promise.reject({ code: types_1.ErrorCode.PAYLOAD_ALREADY_SET, description: "Payload already set. Your requested payload has the same value as the current payload." })];
                            newDataFields.payload = params.newPayload;
                        }
                        if (!this.isDeprecationRequest(params)) return [3 /*break*/, 6];
                        newClaimantAccount = this.getNewRecipient(params);
                        oldDataFields.state = types_1.State.DEPRECATED;
                        oldDataFields.redirectAccount = newClaimantAccount.substring(constants_1.ACCOUNT_PREFIX.length);
                        newDataFields.state = types_1.State.ACTIVE;
                        return [4 /*yield*/, this.checkNewClaimantAccount(url, newClaimantAccount, oldDataFields.attestationContext, myAccount)];
                    case 5:
                        error_8 = _a.sent();
                        if (error_8.code !== types_1.ErrorCode.NO_ERROR)
                            return [2 /*return*/, Promise.reject(error_8)];
                        return [2 /*return*/, Promise.all([
                                this.createAttestationTransaction(url, params.passphrase, newClaimantAccount, newDataFields),
                                this.createAttestationTransaction(url, params.passphrase, this.getRecipient(params), oldDataFields)
                            ]).then(function (value) { return Promise.resolve(value[0]); })];
                    case 6: return [2 /*return*/, this.createAttestationTransaction(url, params.passphrase, this.getRecipient(params), newDataFields)];
                }
            });
        }); };
        this.isEntityPermitted = function (attestorEntity, claimantEntity) {
            if (claimantEntity === types_1.EntityType.ROOT)
                return attestorEntity === types_1.EntityType.ROOT;
            if (claimantEntity === types_1.EntityType.INTERMEDIATE)
                return (attestorEntity === types_1.EntityType.INTERMEDIATE || attestorEntity === types_1.EntityType.ROOT);
            if (claimantEntity === types_1.EntityType.LEAF)
                return (attestorEntity === types_1.EntityType.INTERMEDIATE || attestorEntity === types_1.EntityType.ROOT);
            return false;
        };
        this.getEntityTypeName = function (entityType) {
            if (entityType == types_1.EntityType.ROOT)
                return 'root';
            if (entityType == types_1.EntityType.INTERMEDIATE)
                return 'intermediate';
            if (entityType == types_1.EntityType.LEAF)
                return 'leaf';
            return '';
        };
        this.checkClaimantEntityAndState = function (url, claimant, attestor, attestationContext, dataFields, isStateUpdate, entity) {
            if (dataFields === void 0) { dataFields = new DataFields_1.default(); }
            return __awaiter(_this, void 0, void 0, function () {
                var response, propertyObject, error, error_9;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            dataFields.attestationContext = attestationContext;
                            return [4 /*yield*/, this.request.getAccountProperties(url, { recipient: claimant, setter: attestor, property: dataFields.attestationContext })];
                        case 1:
                            response = _a.sent();
                            propertyObject = response.properties[0];
                            if (!propertyObject)
                                return [2 /*return*/, { code: types_1.ErrorCode.ATTESTATION_CONTEXT_NOT_FOUND, description: "Attestation context not found. The specified attestation context could not be found at account '" + claimant + "'." }];
                            error = dataFields.consumeDataFieldString(propertyObject.value);
                            if (error.code !== types_1.ErrorCode.NO_ERROR)
                                return [2 /*return*/, Promise.reject(error)];
                            if (dataFields.state !== types_1.State.ACTIVE && !isStateUpdate)
                                return [2 /*return*/, Promise.reject({ code: types_1.ErrorCode.ENTITY_NOT_ACTIVE, description: "Entity is not active. Inactive entities cannot be updated." })];
                            if (dataFields.entityType !== entity)
                                return [2 /*return*/, Promise.reject({ code: types_1.ErrorCode.WRONG_ENTITY_TYPE, description: "Wrong entity type. Entity '" + this.getEntityTypeName(dataFields.entityType) + "' does not match with your request." })];
                            return [3 /*break*/, 3];
                        case 2:
                            error_9 = _a.sent();
                            return [2 /*return*/, Promise.reject(Helper_1.default.getError(error_9))];
                        case 3: return [2 /*return*/, constants_1.noError];
                    }
                });
            });
        };
        this.isDeprecationRequest = function (params) {
            return (params.newRootAccount || params.newIntermediateAccount || params.newLeafAccount);
        };
        this.getNewRecipient = function (params) {
            if (params.newIntermediateAccount)
                return params.newIntermediateAccount;
            if (params.newLeafAccount)
                return params.newLeafAccount;
            if (params.newRootAccount)
                return params.newRootAccount;
            return "";
        };
        this.checkNewClaimantAccount = function (url, newAccount, attestationContext, myAccount) { return __awaiter(_this, void 0, void 0, function () {
            var response, error_10;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.request.getAccountProperties(url, { recipient: newAccount, property: attestationContext, setter: myAccount })];
                    case 1:
                        response = _a.sent();
                        if (response.properties.length !== 0)
                            return [2 /*return*/, Promise.resolve({ code: types_1.ErrorCode.ATTESTATION_CONTEXT_ALREADY_SET, description: "Attestation context already set. The new account '" + newAccount + "' already has a property with the name '" + myAccount + "' set by '" + attestationContext + "'." })];
                        return [2 /*return*/, Promise.resolve(constants_1.noError)];
                    case 2:
                        error_10 = _a.sent();
                        return [2 /*return*/, Promise.reject(Helper_1.default.getError(error_10))];
                    case 3: return [2 /*return*/];
                }
            });
        }); };
        this.updateIntermediateAttestation = function (url, params) { return __awaiter(_this, void 0, void 0, function () {
            var response, error_11;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.updateAttestation(url, params, types_1.EntityType.INTERMEDIATE)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, Promise.resolve({ transactionId: response.fullHash })];
                    case 2:
                        error_11 = _a.sent();
                        return [2 /*return*/, Promise.reject(Helper_1.default.getError(error_11))];
                    case 3: return [2 /*return*/];
                }
            });
        }); };
        this.updateLeafAttestation = function (url, params) { return __awaiter(_this, void 0, void 0, function () {
            var response, error_12;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.updateAttestation(url, params, types_1.EntityType.LEAF)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, Promise.resolve({ transactionId: response.fullHash })];
                    case 2:
                        error_12 = _a.sent();
                        return [2 /*return*/, Promise.reject(Helper_1.default.getError(error_12))];
                    case 3: return [2 /*return*/];
                }
            });
        }); };
        this.revokeRootAttestation = function (url, params) { return __awaiter(_this, void 0, void 0, function () {
            var response, error_13;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.revokeAttestation(url, params, types_1.EntityType.ROOT)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, Promise.resolve({ transactionId: response.fullHash })];
                    case 2:
                        error_13 = _a.sent();
                        return [2 /*return*/, Promise.reject(Helper_1.default.getError(error_13))];
                    case 3: return [2 /*return*/];
                }
            });
        }); };
        this.revokeAttestation = function (url, params, entityType, skipChecks) {
            if (skipChecks === void 0) { skipChecks = false; }
            return __awaiter(_this, void 0, void 0, function () {
                var dataFields, recipient, myAccount, error;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            dataFields = new DataFields_1.default();
                            dataFields.attestationContext = params.attestationContext;
                            recipient = params.account && params.account || "";
                            if (!!skipChecks) return [3 /*break*/, 2];
                            myAccount = ardor_ts_1.account.convertPassphraseToAccountRs(params.passphrase);
                            recipient = this.getRecipient(params);
                            return [4 /*yield*/, this.checkRevokeAttestation(url, recipient, myAccount, dataFields.attestationContext, entityType)];
                        case 1:
                            error = _a.sent();
                            if (error.code !== types_1.ErrorCode.NO_ERROR)
                                return [2 /*return*/, Promise.reject(error)];
                            return [3 /*break*/, 3];
                        case 2:
                            recipient = params.account;
                            _a.label = 3;
                        case 3: return [2 /*return*/, this.createRevokeTransaction(url, params.passphrase, recipient, dataFields.attestationContext)];
                    }
                });
            });
        };
        this.checkRevokeAttestation = function (url, claimantAccount, attestorAccount, attestationContext, entityType) { return __awaiter(_this, void 0, void 0, function () {
            var response, propertyObject, dataFields, error, error_14;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.request.getAccountProperties(url, { setter: attestorAccount, recipient: claimantAccount, property: attestationContext })];
                    case 1:
                        response = _a.sent();
                        propertyObject = response.properties[0];
                        if (!propertyObject)
                            return [2 /*return*/, { code: types_1.ErrorCode.ATTESTATION_CONTEXT_NOT_FOUND, description: "Attestation context not found. The specified attestation context could not be found at account '" + claimantAccount + "'." }];
                        dataFields = new DataFields_1.default();
                        error = dataFields.consumeDataFieldString(propertyObject.value);
                        if (error.code !== types_1.ErrorCode.NO_ERROR)
                            return [2 /*return*/, error];
                        if (dataFields.entityType !== entityType)
                            return [2 /*return*/, { code: types_1.ErrorCode.ENTITY_MISMATCH, description: "Entity mismatch. You're trying to revoke a '" + this.getEntityTypeName(entityType) + "' attestation, but the found attestation is of type '" + this.getEntityTypeName(dataFields.entityType) + "'." }];
                        return [3 /*break*/, 3];
                    case 2:
                        error_14 = _a.sent();
                        return [2 /*return*/, Promise.reject(Helper_1.default.getError(error_14))];
                    case 3: return [2 /*return*/, constants_1.noError];
                }
            });
        }); };
        this.createRevokeTransaction = function (url, passphrase, claimantAccount, attestationContext) {
            var propertyRequestParams = {
                chain: ardor_ts_1.ChainId.IGNIS,
                secretPhrase: passphrase,
                recipient: claimantAccount,
                property: attestationContext
            };
            return _this.request.deleteAccountProperty(url, propertyRequestParams);
        };
        this.revokeIntermediateAttestation = function (url, params) { return __awaiter(_this, void 0, void 0, function () {
            var response, error_15;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.revokeAttestation(url, params, types_1.EntityType.INTERMEDIATE)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, Promise.resolve({ transactionId: response.fullHash })];
                    case 2:
                        error_15 = _a.sent();
                        return [2 /*return*/, Promise.reject(Helper_1.default.getError(error_15))];
                    case 3: return [2 /*return*/];
                }
            });
        }); };
        this.revokeLeafAttestation = function (url, params) { return __awaiter(_this, void 0, void 0, function () {
            var response, error_16;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.revokeAttestation(url, params, types_1.EntityType.LEAF)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, Promise.resolve({ transactionId: response.fullHash })];
                    case 2:
                        error_16 = _a.sent();
                        return [2 /*return*/, Promise.reject(Helper_1.default.getError(error_16))];
                    case 3: return [2 /*return*/];
                }
            });
        }); };
        this.revokeAttestationUnchecked = function (url, params) { return __awaiter(_this, void 0, void 0, function () {
            var response, error_17;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.revokeAttestation(url, params, types_1.EntityType.LEAF, true)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, Promise.resolve({ transactionId: response.fullHash })];
                    case 2:
                        error_17 = _a.sent();
                        return [2 /*return*/, Promise.reject(Helper_1.default.getError(error_17))];
                    case 3: return [2 /*return*/];
                }
            });
        }); };
        this.request = request;
    }
    return AttestationHandler;
}());
exports.default = AttestationHandler;
