#!/usr/bin/env node

/**
 * Dark X402 Terminal - Main Entry Point
 * A privacy-first DeFi terminal with AI agents, dark swaps, and shielded wallets
 */

import { X402Terminal } from './x402-terminal';
import * as dotenv from 'dotenv';
import chalk from 'chalk';

// Load environment variables
// Try loading from terminal directory first, then current working directory
import { resolve } from 'path';

// Load .env from terminal directory if running from project root, otherwise use default
const terminalEnvPath = resolve(process.cwd(), 'terminal', '.env');
dotenv.config({ path: terminalEnvPath });
dotenv.config(); // Fallback to default location (current directory)

// Check for required API keys
function checkEnvironment() {
  const required = ['HELIUS_API_KEY'];
  const missing: string[] = [];

  required.forEach((key) => {
    if (!process.env[key]) {
      missing.push(key);
    }
  });

  if (missing.length > 0) {
    console.error(chalk.red('\n⚠️  Missing required environment variables:\n'));
    missing.forEach((key) => {
      console.error(chalk.red(`  - ${key}`));
    });
    console.error();
    console.error(chalk.dim('Create a .env file with:'));
    console.error();
    console.error(chalk.dim('HELIUS_API_KEY=your_helius_api_key'));
    console.error(chalk.dim('JUPITER_API_KEY=your_jupiter_api_key (optional)'));
    console.error(chalk.dim('REDPILL_API_KEY=your_redpill_api_key (optional)'));
    console.error(chalk.dim('GOOGLE_AI_API_KEY=your_google_ai_api_key (optional)'));
    console.error(chalk.dim('NETWORK=devnet|mainnet|testnet (optional, default: devnet)'));
    console.error();
    process.exit(1);
  }

  // Optional warnings
  const optional = [
    'JUPITER_API_KEY',
    'REDPILL_API_KEY',
    'GOOGLE_AI_API_KEY',
  ];

  const missingOptional: string[] = [];

  optional.forEach((key) => {
    if (!process.env[key]) {
      missingOptional.push(key);
    }
  });

  if (missingOptional.length > 0) {
    console.log(chalk.yellow('\n⚠️  Optional features disabled (missing API keys):\n'));
    missingOptional.forEach((key) => {
      const feature = {
        JUPITER_API_KEY: 'Private swaps',
        REDPILL_API_KEY: 'AI agent verification',
        GOOGLE_AI_API_KEY: 'Google Gen AI agents',
      }[key];
      console.log(chalk.dim(`  - ${feature} (${key})`));
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
    const terminal = new X402Terminal();
    await terminal.start();
  } catch (error: any) {
    console.error(chalk.red(`\n❌ Fatal error: ${error.message}\n`));

    if (error.stack) {
      console.error(chalk.dim(error.stack));
    }

    process.exit(1);
  }
}

// Handle process signals
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n\n👋 Goodbye!\n'));
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log(chalk.yellow('\n\n👋 Goodbye!\n'));
  process.exit(0);
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('\n❌ Unhandled Promise Rejection:'));
  console.error(reason);
  process.exit(1);
});

// Run the terminal
main();
