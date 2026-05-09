#!/usr/bin/env node
"use strict";
/**
 * Dark X402 Terminal - Main Entry Point
 * A privacy-first DeFi terminal with AI agents, dark swaps, and shielded wallets
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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const x402_terminal_1 = require("./x402-terminal");
const dotenv = __importStar(require("dotenv"));
const chalk_1 = __importDefault(require("chalk"));
// Load environment variables
// Try loading from terminal directory first, then current working directory
const path_1 = require("path");
// Load .env from terminal directory if running from project root, otherwise use default
const terminalEnvPath = (0, path_1.resolve)(process.cwd(), 'terminal', '.env');
dotenv.config({ path: terminalEnvPath });
dotenv.config(); // Fallback to default location (current directory)
// Check for required API keys
function checkEnvironment() {
    const required = ['HELIUS_API_KEY'];
    const missing = [];
    required.forEach((key) => {
        if (!process.env[key]) {
            missing.push(key);
        }
    });
    if (missing.length > 0) {
        console.error(chalk_1.default.red('\n⚠️  Missing required environment variables:\n'));
        missing.forEach((key) => {
            console.error(chalk_1.default.red(`  - ${key}`));
        });
        console.error();
        console.error(chalk_1.default.dim('Create a .env file with:'));
        console.error();
        console.error(chalk_1.default.dim('HELIUS_API_KEY=your_helius_api_key'));
        console.error(chalk_1.default.dim('JUPITER_API_KEY=your_jupiter_api_key (optional)'));
        console.error(chalk_1.default.dim('REDPILL_API_KEY=your_redpill_api_key (optional)'));
        console.error(chalk_1.default.dim('GOOGLE_AI_API_KEY=your_google_ai_api_key (optional)'));
        console.error(chalk_1.default.dim('NETWORK=devnet|mainnet|testnet (optional, default: devnet)'));
        console.error();
        process.exit(1);
    }
    // Optional warnings
    const optional = [
        'JUPITER_API_KEY',
        'REDPILL_API_KEY',
        'GOOGLE_AI_API_KEY',
    ];
    const missingOptional = [];
    optional.forEach((key) => {
        if (!process.env[key]) {
            missingOptional.push(key);
        }
    });
    if (missingOptional.length > 0) {
        console.log(chalk_1.default.yellow('\n⚠️  Optional features disabled (missing API keys):\n'));
        missingOptional.forEach((key) => {
            const feature = {
                JUPITER_API_KEY: 'Private swaps',
                REDPILL_API_KEY: 'AI agent verification',
                GOOGLE_AI_API_KEY: 'Google Gen AI agents',
            }[key];
            console.log(chalk_1.default.dim(`  - ${feature} (${key})`));
        });
        console.log();
    }
}
// Main function
async function main() {
    try {
        // Check environment
        checkEnvironment();
        // Create and start terminal
        const terminal = new x402_terminal_1.X402Terminal();
        await terminal.start();
    }
    catch (error) {
        console.error(chalk_1.default.red(`\n❌ Fatal error: ${error.message}\n`));
        if (error.stack) {
            console.error(chalk_1.default.dim(error.stack));
        }
        process.exit(1);
    }
}
// Handle process signals
process.on('SIGINT', () => {
    console.log(chalk_1.default.yellow('\n\n👋 Goodbye!\n'));
    process.exit(0);
});
process.on('SIGTERM', () => {
    console.log(chalk_1.default.yellow('\n\n👋 Goodbye!\n'));
    process.exit(0);
});
// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error(chalk_1.default.red('\n❌ Unhandled Promise Rejection:'));
    console.error(reason);
    process.exit(1);
});
// Run the terminal
main();
//# sourceMappingURL=index.js.map