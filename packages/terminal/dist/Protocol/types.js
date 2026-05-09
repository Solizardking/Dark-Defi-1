"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrivacyLevel = exports.TransactionType = void 0;
var TransactionType;
(function (TransactionType) {
    TransactionType["Shield"] = "Shield";
    TransactionType["Unshield"] = "Unshield";
    TransactionType["PrivateTransfer"] = "PrivateTransfer";
    TransactionType["PrivateSwap"] = "PrivateSwap";
    TransactionType["PoolDeposit"] = "PoolDeposit";
    TransactionType["PoolWithdraw"] = "PoolWithdraw";
})(TransactionType || (exports.TransactionType = TransactionType = {}));
var PrivacyLevel;
(function (PrivacyLevel) {
    PrivacyLevel["Full"] = "Full";
    PrivacyLevel["Partial"] = "Partial";
    PrivacyLevel["Minimal"] = "Minimal";
})(PrivacyLevel || (exports.PrivacyLevel = PrivacyLevel = {}));
//# sourceMappingURL=types.js.map