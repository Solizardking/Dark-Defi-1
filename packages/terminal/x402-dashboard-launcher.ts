#!/usr/bin/env node
/**
 * X402 Dashboard Launcher
 * Standalone launcher for the X402 Token Dashboard
 */

import { X402TokenDashboard } from './x402-token-dashboard.js';
import chalk from 'chalk';

async function main() {
  console.log(chalk.cyan.bold('\n╔════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('║         DARK TERMINAL - X402 TOKEN DASHBOARD LAUNCHER          ║'));
  console.log(chalk.cyan.bold('╚════════════════════════════════════════════════════════════════╝\n'));

  const dashboard = new X402TokenDashboard();

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log(chalk.yellow('\n\n⏹  Shutting down dashboard...'));
    dashboard.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    dashboard.stop();
    process.exit(0);
  });

  try {
    await dashboard.start();
  } catch (error: any) {
    console.error(chalk.red('\n❌ Fatal error:'), error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export default main;
