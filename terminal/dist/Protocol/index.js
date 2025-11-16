"use strict";
/**
 * Dark Protocol SDK
 * Privacy-first Solana wallet with Zcash Sapling integration, AI agents, Jupiter swaps, and Helius
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VERSION = void 0;
__exportStar(require("./client"), exports);
__exportStar(require("./wallet"), exports);
__exportStar(require("./privacy"), exports);
__exportStar(require("./swap"), exports);
__exportStar(require("./ai-agent"), exports);
__exportStar(require("./types"), exports);
__exportStar(require("./utils"), exports);
// Zcash Sapling Integration
__exportStar(require("./sapling"), exports);
__exportStar(require("./note-encryption"), exports);
// Network Configuration
__exportStar(require("./config"), exports);
// Re-export Helius SDK components
// export {
//   createHelius
// } from 'helius-sdk';
// Version
exports.VERSION = '0.2.0'; // Updated for Zcash Sapling integration
//# sourceMappingURL=index.js.map