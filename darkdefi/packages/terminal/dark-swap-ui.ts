/**
 * Dark Swap UI
 * Terminal interface for privacy-preserving token swaps
 */

import Table from 'cli-table3';
import inquirer from 'inquirer';
import ora from 'ora';

import { PublicKey } from '@solana/web3.js';

import { PrivateSwapManager } from '../protocol/swap';
import { DarkWallet } from '../protocol/wallet';

// Common token addresses
const KNOWN_TOKENS = {
  SOL: 'So11111111111111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  JUP: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
};

export class DarkSwapUI {
  private swapManager: PrivateSwapManager;
  private theme: any;
  private swapHistory: any[] = [];

  constructor(swapManager: PrivateSwapManager, theme: any) {
    this.swapManager = swapManager;
    this.theme = theme;
  }

  /**
   * Show swap interface
   */
  async show(wallet: DarkWallet) {
    let swapping = true;

    while (swapping) {
      console.log();
      console.log(this.theme.primary('🔄 Dark Swap - Privacy-Preserving Token Swaps'));
      console.log(this.theme.dim('═'.repeat(80)));
      console.log();

      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: this.theme.bold('Select action:'),
          choices: [
            { name: '🔀 Execute Private Swap', value: 'swap' },
            { name: '💰 Get Quote', value: 'quote' },
            { name: '📊 Swap History', value: 'history' },
            { name: '🔙 Back to Main Menu', value: 'back' },
          ],
        },
      ]);

      switch (action) {
        case 'swap':
          await this.executeSwap(wallet);
          break;
        case 'quote':
          await this.getQuote();
          break;
        case 'history':
          await this.showHistory();
          break;
        case 'back':
          swapping = false;
          break;
      }
    }
  }

  /**
   * Execute a private swap
   */
  private async executeSwap(wallet: DarkWallet) {
    console.log();
    console.log(this.theme.accent('⚡ Execute Private Swap'));
    console.log();

    // Select input token
    const { inputToken } = await inquirer.prompt([
      {
        type: 'list',
        name: 'inputToken',
        message: 'Input token:',
        choices: [
          { name: 'SOL', value: KNOWN_TOKENS.SOL },
          { name: 'USDC', value: KNOWN_TOKENS.USDC },
          { name: 'USDT', value: KNOWN_TOKENS.USDT },
          { name: 'BONK', value: KNOWN_TOKENS.BONK },
          { name: 'JUP', value: KNOWN_TOKENS.JUP },
          { name: 'Custom...', value: 'custom' },
        ],
      },
    ]);

    let inputMint = inputToken;
    if (inputToken === 'custom') {
      const { customInput } = await inquirer.prompt([
        {
          type: 'input',
          name: 'customInput',
          message: 'Enter input token mint address:',
          validate: (val) => {
            try {
              new PublicKey(val);
              return true;
            } catch {
              return 'Invalid Solana address';
            }
          },
        },
      ]);
      inputMint = customInput;
    }

    // Select output token
    const { outputToken } = await inquirer.prompt([
      {
        type: 'list',
        name: 'outputToken',
        message: 'Output token:',
        choices: [
          { name: 'SOL', value: KNOWN_TOKENS.SOL },
          { name: 'USDC', value: KNOWN_TOKENS.USDC },
          { name: 'USDT', value: KNOWN_TOKENS.USDT },
          { name: 'BONK', value: KNOWN_TOKENS.BONK },
          { name: 'JUP', value: KNOWN_TOKENS.JUP },
          { name: 'Custom...', value: 'custom' },
        ],
      },
    ]);

    let outputMint = outputToken;
    if (outputToken === 'custom') {
      const { customOutput } = await inquirer.prompt([
        {
          type: 'input',
          name: 'customOutput',
          message: 'Enter output token mint address:',
          validate: (val) => {
            try {
              new PublicKey(val);
              return true;
            } catch {
              return 'Invalid Solana address';
            }
          },
        },
      ]);
      outputMint = customOutput;
    }

    // Input amount
    const { amount } = await inquirer.prompt([
      {
        type: 'number',
        name: 'amount',
        message: 'Amount to swap:',
        validate: (val) => val > 0 || 'Amount must be greater than 0',
      },
    ]);

    // Slippage tolerance
    const { slippage } = await inquirer.prompt([
      {
        type: 'list',
        name: 'slippage',
        message: 'Slippage tolerance:',
        choices: [
          { name: '0.1%', value: 10 },
          { name: '0.5%', value: 50 },
          { name: '1.0%', value: 100 },
          { name: '2.0%', value: 200 },
          { name: 'Custom...', value: 'custom' },
        ],
      },
    ]);

    let slippageBps = slippage;
    if (slippage === 'custom') {
      const { customSlippage } = await inquirer.prompt([
        {
          type: 'number',
          name: 'customSlippage',
          message: 'Enter slippage in basis points (100 = 1%):',
          validate: (val) => (val >= 0 && val <= 10000) || 'Invalid slippage',
        },
      ]);
      slippageBps = customSlippage;
    }

    // Get quote first
    const spinner = ora('Fetching best route...').start();

    try {
      const inputAmount = BigInt(Math.floor(amount * 1e9)); // Convert to lamports

      const quote = await this.swapManager.getQuote(
        new PublicKey(inputMint),
        new PublicKey(outputMint),
        inputAmount,
        slippageBps
      );

      spinner.stop();

      // Display quote
      console.log();
      console.log(this.theme.primary('📋 Quote Details:'));
      console.log(this.theme.dim('─'.repeat(60)));
      console.log(`Input Amount:     ${amount} (${Number(quote.inputAmount) / 1e9})`);
      console.log(
        `Expected Output:  ${Number(quote.outputAmount) / 1e9} (approx)`
      );
      console.log(`Price Impact:     ${quote.priceImpactPct.toFixed(4)}%`);
      console.log(`Slippage:         ${slippageBps / 100}%`);
      console.log(`Platform Fee:     ${quote.platformFeeBps / 100}%`);
      console.log(this.theme.dim('─'.repeat(60)));
      console.log();

      // Confirm swap
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: this.theme.warning('Execute this private swap?'),
          default: false,
        },
      ]);

      if (!confirm) {
        console.log(this.theme.dim('\n✗ Swap cancelled\n'));
        return;
      }

      // Execute swap
      const execSpinner = ora('Executing private swap...').start();

      try {
        const signature = await this.swapManager.executePrivateSwap({
          inputMint: new PublicKey(inputMint),
          outputMint: new PublicKey(outputMint),
          inputAmount,
          minOutputAmount: quote.outputAmount,
          slippageBps,
          userPublicKey: wallet.publicKey,
        });

        execSpinner.succeed(this.theme.success('✓ Swap executed successfully!'));

        console.log();
        console.log(this.theme.dim(`Transaction: ${signature}`));
        console.log();

        // Add to history
        this.swapHistory.push({
          timestamp: Date.now(),
          inputToken: inputMint.slice(0, 8),
          outputToken: outputMint.slice(0, 8),
          inputAmount: amount,
          outputAmount: Number(quote.outputAmount) / 1e9,
          signature: signature.slice(0, 16),
        });
      } catch (error: any) {
        execSpinner.fail(this.theme.danger(`✗ Swap failed: ${error.message}`));
      }
    } catch (error: any) {
      spinner.fail(this.theme.danger(`✗ Failed to get quote: ${error.message}`));
    }

    await this.pressAnyKey();
  }

  /**
   * Get a quote without executing
   */
  private async getQuote() {
    console.log();
    console.log(this.theme.accent('💰 Get Swap Quote'));
    console.log();

    // Similar to executeSwap but stops after showing quote
    const { inputToken, outputToken, amount, slippage } = await inquirer.prompt([
      {
        type: 'list',
        name: 'inputToken',
        message: 'Input token:',
        choices: Object.keys(KNOWN_TOKENS).map((key) => ({
          name: key,
          value: KNOWN_TOKENS[key as keyof typeof KNOWN_TOKENS],
        })),
      },
      {
        type: 'list',
        name: 'outputToken',
        message: 'Output token:',
        choices: Object.keys(KNOWN_TOKENS).map((key) => ({
          name: key,
          value: KNOWN_TOKENS[key as keyof typeof KNOWN_TOKENS],
        })),
      },
      {
        type: 'number',
        name: 'amount',
        message: 'Amount:',
        default: 1,
      },
      {
        type: 'number',
        name: 'slippage',
        message: 'Slippage (bps):',
        default: 50,
      },
    ]);

    const spinner = ora('Fetching quote...').start();

    try {
      const inputAmount = BigInt(Math.floor(amount * 1e9));

      const quote = await this.swapManager.getQuote(
        new PublicKey(inputToken),
        new PublicKey(outputToken),
        inputAmount,
        slippage
      );

      spinner.stop();

      console.log();
      console.log(this.theme.success('✓ Quote:'));
      console.log(this.theme.dim('─'.repeat(60)));
      console.log(`Input:            ${amount}`);
      console.log(`Output:           ${Number(quote.outputAmount) / 1e9}`);
      console.log(`Price Impact:     ${quote.priceImpactPct.toFixed(4)}%`);
      console.log(`Exchange Rate:    1 → ${(Number(quote.outputAmount) / Number(quote.inputAmount)).toFixed(6)}`);
      console.log(this.theme.dim('─'.repeat(60)));
      console.log();
    } catch (error: any) {
      spinner.fail(this.theme.danger(`✗ Failed: ${error.message}`));
    }

    await this.pressAnyKey();
  }

  /**
   * Show swap history
   */
  private async showHistory() {
    console.log();
    console.log(this.theme.accent('📊 Swap History'));
    console.log();

    if (this.swapHistory.length === 0) {
      console.log(this.theme.dim('No swap history yet\n'));
      await this.pressAnyKey();
      return;
    }

    const table = new Table({
      head: [
        this.theme.primary('Time'),
        this.theme.primary('Input'),
        this.theme.primary('Output'),
        this.theme.primary('Amount In'),
        this.theme.primary('Amount Out'),
        this.theme.primary('Tx'),
      ],
      style: { head: [], border: [] },
    });

    this.swapHistory.forEach((swap) => {
      const time = new Date(swap.timestamp).toLocaleTimeString();
      table.push([
        time,
        swap.inputToken + '...',
        swap.outputToken + '...',
        swap.inputAmount.toFixed(4),
        swap.outputAmount.toFixed(4),
        swap.signature + '...',
      ]);
    });

    console.log(table.toString());
    console.log();

    await this.pressAnyKey();
  }

  /**
   * Press any key to continue
   */
  private async pressAnyKey() {
    await inquirer.prompt([
      {
        type: 'input',
        name: 'key',
        message: this.theme.dim('Press Enter to continue...'),
      },
    ]);
  }
}
