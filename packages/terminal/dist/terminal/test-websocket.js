"use strict";
/**
 * Test WebSocket Connection to Birdeye
 * Quick test to verify real-time price streaming works
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const x402_price_websocket_1 = require("./x402-price-websocket");
const chalk_1 = __importDefault(require("chalk"));
async function testWebSocket() {
    console.log(chalk_1.default.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk_1.default.cyan('          X402 WebSocket Connection Test'));
    console.log(chalk_1.default.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log();
    const ws = (0, x402_price_websocket_1.getX402PriceWebSocket)();
    // Track updates
    let updateCount = 0;
    const startTime = Date.now();
    // Setup event handlers
    ws.on('connected', () => {
        console.log(chalk_1.default.green('✓ Connected to Birdeye WebSocket'));
    });
    ws.on('disconnected', () => {
        console.log(chalk_1.default.yellow('⚠ Disconnected from WebSocket'));
    });
    ws.on('error', (error) => {
        console.error(chalk_1.default.red('✗ Error:'), error.message);
    });
    ws.on('subscribed', (timeframe) => {
        console.log(chalk_1.default.green(`✓ Subscribed to ${timeframe} price updates`));
        console.log();
        console.log(chalk_1.default.dim('Waiting for price updates...'));
        console.log(chalk_1.default.dim('Press Ctrl+C to stop'));
        console.log();
    });
    ws.on('price', (update) => {
        updateCount++;
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        const priceColor = update.changePercent24h >= 0 ? chalk_1.default.green : chalk_1.default.red;
        const changeColor = update.changePercent24h >= 0 ? chalk_1.default.green : chalk_1.default.red;
        console.log([
            chalk_1.default.dim(`[${elapsed}s]`),
            chalk_1.default.cyan('#' + updateCount),
            priceColor(`$${(0, x402_price_websocket_1.formatX402Price)(update.price)}`),
            changeColor((0, x402_price_websocket_1.formatPriceChange)(update.changePercent24h)),
            chalk_1.default.dim(`Vol: $${(update.volume24h / 1000).toFixed(2)}K`)
        ].join(' │ '));
    });
    ws.on('significant-change', (update) => {
        const alertType = update.changePercent24h >= 5 ? 'PUMP' : 'DUMP';
        const color = update.changePercent24h >= 5 ? chalk_1.default.green : chalk_1.default.red;
        console.log();
        console.log(color(`⚠ ${alertType} ALERT: ${(0, x402_price_websocket_1.formatPriceChange)(update.changePercent24h)}`));
        console.log();
    });
    // Connect and subscribe
    console.log(chalk_1.default.dim('Connecting to Birdeye WebSocket...'));
    ws.connect();
    ws.subscribeToPrice('15m');
    // Handle Ctrl+C
    process.on('SIGINT', () => {
        console.log();
        console.log();
        console.log(chalk_1.default.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        console.log(chalk_1.default.cyan('                  Test Summary'));
        console.log(chalk_1.default.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        console.log();
        console.log(chalk_1.default.yellow('Total updates received:'), chalk_1.default.white(updateCount));
        console.log(chalk_1.default.yellow('Duration:'), chalk_1.default.white(`${((Date.now() - startTime) / 1000).toFixed(1)}s`));
        console.log(chalk_1.default.yellow('Update rate:'), chalk_1.default.white(`${(updateCount / ((Date.now() - startTime) / 1000)).toFixed(2)} updates/sec`));
        console.log();
        ws.disconnect();
        process.exit(0);
    });
}
testWebSocket().catch(error => {
    console.error(chalk_1.default.red('Test failed:'), error);
    process.exit(1);
});
//# sourceMappingURL=test-websocket.js.map