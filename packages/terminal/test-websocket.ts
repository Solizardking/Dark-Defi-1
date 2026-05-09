/**
 * Test WebSocket Connection to Birdeye
 * Quick test to verify real-time price streaming works
 */

import {
  getX402PriceWebSocket,
  formatX402Price,
  formatPriceChange,
  type PriceUpdate
} from './x402-price-websocket';
import chalk from 'chalk';

async function testWebSocket() {
  console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(chalk.cyan('          X402 WebSocket Connection Test'));
  console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log();

  const ws = getX402PriceWebSocket();

  // Track updates
  let updateCount = 0;
  const startTime = Date.now();

  // Setup event handlers
  ws.on('connected', () => {
    console.log(chalk.green('✓ Connected to Birdeye WebSocket'));
  });

  ws.on('disconnected', () => {
    console.log(chalk.yellow('⚠ Disconnected from WebSocket'));
  });

  ws.on('error', (error) => {
    console.error(chalk.red('✗ Error:'), error.message);
  });

  ws.on('subscribed', (timeframe) => {
    console.log(chalk.green(`✓ Subscribed to ${timeframe} price updates`));
    console.log();
    console.log(chalk.dim('Waiting for price updates...'));
    console.log(chalk.dim('Press Ctrl+C to stop'));
    console.log();
  });

  ws.on('price', (update: PriceUpdate) => {
    updateCount++;
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    const priceColor = update.changePercent24h >= 0 ? chalk.green : chalk.red;
    const changeColor = update.changePercent24h >= 0 ? chalk.green : chalk.red;

    console.log([
      chalk.dim(`[${elapsed}s]`),
      chalk.cyan('#' + updateCount),
      priceColor(`$${formatX402Price(update.price)}`),
      changeColor(formatPriceChange(update.changePercent24h)),
      chalk.dim(`Vol: $${(update.volume24h / 1000).toFixed(2)}K`)
    ].join(' │ '));
  });

  ws.on('significant-change', (update: PriceUpdate) => {
    const alertType = update.changePercent24h >= 5 ? 'PUMP' : 'DUMP';
    const color = update.changePercent24h >= 5 ? chalk.green : chalk.red;
    console.log();
    console.log(color(`⚠ ${alertType} ALERT: ${formatPriceChange(update.changePercent24h)}`));
    console.log();
  });

  // Connect and subscribe
  console.log(chalk.dim('Connecting to Birdeye WebSocket...'));
  ws.connect();
  ws.subscribeToPrice('15m');

  // Handle Ctrl+C
  process.on('SIGINT', () => {
    console.log();
    console.log();
    console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.cyan('                  Test Summary'));
    console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log();
    console.log(chalk.yellow('Total updates received:'), chalk.white(updateCount));
    console.log(chalk.yellow('Duration:'), chalk.white(`${((Date.now() - startTime) / 1000).toFixed(1)}s`));
    console.log(chalk.yellow('Update rate:'), chalk.white(`${(updateCount / ((Date.now() - startTime) / 1000)).toFixed(2)} updates/sec`));
    console.log();

    ws.disconnect();
    process.exit(0);
  });
}

testWebSocket().catch(error => {
  console.error(chalk.red('Test failed:'), error);
  process.exit(1);
});
