#!/usr/bin/env node
"use strict";
/**
 * X402 Dashboard Launcher
 * Standalone launcher for the X402 Token Dashboard
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const x402_token_dashboard_js_1 = require("./x402-token-dashboard.js");
const chalk_1 = __importDefault(require("chalk"));
async function main() {
    console.log(chalk_1.default.cyan.bold('\n╔════════════════════════════════════════════════════════════════╗'));
    console.log(chalk_1.default.cyan.bold('║         DARK TERMINAL - X402 TOKEN DASHBOARD LAUNCHER          ║'));
    console.log(chalk_1.default.cyan.bold('╚════════════════════════════════════════════════════════════════╝\n'));
    const dashboard = new x402_token_dashboard_js_1.X402TokenDashboard();
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log(chalk_1.default.yellow('\n\n⏹  Shutting down dashboard...'));
        dashboard.stop();
        process.exit(0);
    });
    process.on('SIGTERM', () => {
        dashboard.stop();
        process.exit(0);
    });
    try {
        await dashboard.start();
    }
    catch (error) {
        console.error(chalk_1.default.red('\n❌ Fatal error:'), error.message);
        process.exit(1);
    }
}
// Run if executed directly
if (require.main === module) {
    main();
}
exports.default = main;
//# sourceMappingURL=x402-dashboard-launcher.js.map