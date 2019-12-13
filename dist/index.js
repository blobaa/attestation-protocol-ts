"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var AttestationHandler_1 = __importDefault(require("./modules/AttestationHandler"));
var ClaimHandler_1 = __importDefault(require("./modules/ClaimHandler"));
var EntityParser_1 = __importDefault(require("./modules/EntityParser"));
__export(require("./types"));
exports.attestation = new AttestationHandler_1.default();
exports.claim = new ClaimHandler_1.default();
exports.entity = new EntityParser_1.default();
var Attestation = /** @class */ (function (_super) {
    __extends(Attestation, _super);
    function Attestation() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return Attestation;
}(AttestationHandler_1.default));
exports.Attestation = Attestation;
;
var Claim = /** @class */ (function (_super) {
    __extends(Claim, _super);
    function Claim() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return Claim;
}(ClaimHandler_1.default));
exports.Claim = Claim;
;
var Entity = /** @class */ (function (_super) {
    __extends(Entity, _super);
    function Entity() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return Entity;
}(EntityParser_1.default));
exports.Entity = Entity;
;
