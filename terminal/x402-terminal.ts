/**
 * Dark X402 Terminal
 * A privacy-first DeFi terminal with AI agents, dark swaps, and shielded wallets
 */

import chalk from 'chalk';
import figlet from 'figlet';
import inquirer from 'inquirer';
import ora from 'ora';
import Table from 'cli-table3';
import { DarkProtocolClient, DarkWallet, PrivateSwapManager, AIAgentManager } from '../Protocol';
import { PublicKey, Keypair } from '@solana/web3.js';
import { X402AgentManager } from './x402-agents';
import { GoogleGenAIAgent } from './google-ai-agent';
import { DarkSwapUI } from './dark-swap-ui';
import { DarkWalletManager } from './dark-wallet-manager';

export class X402Terminal {
  private client!: DarkProtocolClient;
  private wallet?: DarkWallet;
  private swapManager!: PrivateSwapManager;
  private aiManager!: AIAgentManager;
  private x402Agents!: X402AgentManager;
  private googleAI!: GoogleGenAIAgent;
  private darkSwapUI!: DarkSwapUI;
  private walletManager!: DarkWalletManager;

  // Terminal state
  private isRunning: boolean = false;
  private currentMode: 'main' | 'agents' | 'swap' | 'wallet' = 'main';

  // X402 Dark Theme
  private theme = {
    primary: chalk.hex('#9945FF'),
    secondary: chalk.hex('#14F195'),
    accent: chalk.hex('#FF00FF'),
    danger: chalk.hex('#FF0040'),
    warning: chalk.hex('#FFB800'),
    success: chalk.hex('#00FF88'),
    dim: chalk.dim,
    bold: chalk.bold,
    bg: chalk.bgHex('#0A0A0F'),
  };

  constructor() {}

  /**
   * Initialize the terminal
   */
  async initialize() {
    const spinner = ora({
      text: this.theme.dim('Initializing Dark X402 Terminal...'),
      color: 'magenta',
    }).start();

    try {
      // Initialize Google AI (doesn't need Dark Protocol client)
      if (process.env.GOOGLE_AI_API_KEY) {
        this.googleAI = new GoogleGenAIAgent(process.env.GOOGLE_AI_API_KEY);
      }

      // Try to initialize Dark Protocol client
      if (!process.env.HELIUS_API_KEY) {
        spinner.warn(this.theme.warning('HELIUS_API_KEY not found - on-chain features disabled'));
        console.log(this.theme.dim('  Set HELIUS_API_KEY in .env to enable wallet features'));
        console.log();
        
        // Create wallet manager without client (will show error when used)
        this.walletManager = new DarkWalletManager(null as any, this.theme);
      } else {
        try {
          this.client = await DarkProtocolClient.create({
            heliusApiKey: process.env.HELIUS_API_KEY,
            network: (process.env.NETWORK as any) || 'devnet',
            useSecureRpc: true,
            jupiterApiKey: process.env.JUPITER_API_KEY,
            redpillApiKey: process.env.REDPILL_API_KEY,
          });

          // Initialize managers that need the client
          this.swapManager = new PrivateSwapManager(this.client, process.env.JUPITER_API_KEY);
          this.aiManager = new AIAgentManager(this.client, process.env.REDPILL_API_KEY);
          this.x402Agents = new X402AgentManager(this.client, this.aiManager);
          this.darkSwapUI = new DarkSwapUI(this.swapManager, this.theme);
          this.walletManager = new DarkWalletManager(this.client, this.theme);
        } catch (clientError: any) {
          spinner.warn(this.theme.warning('Dark Protocol client initialization failed'));
          console.log(this.theme.dim(`  Error: ${clientError.message || 'Unknown error'}`));
          console.log(this.theme.dim('  On-chain features will be disabled'));
          console.log();

          // Create wallet manager without client (will show error when used)
          this.walletManager = new DarkWalletManager(null as any, this.theme);
        }
      }

      spinner.succeed(this.theme.success('Terminal initialized ✓'));
    } catch (error) {
      spinner.fail(this.theme.danger('Initialization failed'));
      throw error;
    }
  }

  /**
   * Start the terminal
   */
  async start() {
    console.clear();
    this.printHeader();

    await this.initialize();

    // Wallet setup
    await this.setupWallet();

    this.isRunning = true;
    await this.mainLoop();
  }

  /**
   * Print terminal header
   */
  private printHeader() {
    const banner = figlet.textSync('DARK X402', {
      font: 'ANSI Shadow',
      horizontalLayout: 'default',
    });

    console.log(this.theme.primary(banner));
    console.log(this.theme.secondary('━'.repeat(80)));
    console.log(
      this.theme.accent('    Privacy-First DeFi Terminal with AI Agents & Shielded Swaps    ')
    );
    console.log(this.theme.secondary('━'.repeat(80)));
    console.log();
  }

  /**
   * Setup wallet
   */
  private async setupWallet() {
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: this.theme.bold('Wallet Setup:'),
        choices: [
          { name: '🆕 Create new wallet', value: 'new' },
          { name: '🔑 Import from mnemonic', value: 'import' },
          { name: '📂 Import from private key', value: 'key' },
        ],
      },
    ]);

    try {
      this.wallet = await this.walletManager.setupWallet(action);

      console.log();
      console.log(this.theme.success('✓ Wallet ready'));
      console.log(this.theme.dim(`  Address: ${this.wallet.publicKey.toBase58()}`));
      console.log();
    } catch (error: any) {
      // If wallet setup fails (e.g., client not available), show error and exit gracefully
      console.log();
      console.log(this.theme.warning('⚠ Wallet setup skipped'));
      console.log(this.theme.dim('  Continuing without wallet...'));
      console.log();
    }
  }

  /**
   * Main terminal loop
   */
  private async mainLoop() {
    while (this.isRunning) {
      try {
        await this.showMainMenu();
      } catch (error: any) {
        console.log(this.theme.danger(`\n⚠ Error: ${error.message}\n`));
      }
    }
  }

  /**
   * Show main menu
   */
  private async showMainMenu() {
    const { choice } = await inquirer.prompt([
      {
        type: 'list',
        name: 'choice',
        message: this.theme.bold('Main Menu:'),
        choices: [
          { name: '🤖 X402 AI Agents', value: 'agents' },
          { name: '🔄 Dark Swaps', value: 'swap' },
          { name: '💼 Wallet Manager', value: 'wallet' },
          { name: '📊 Dashboard', value: 'dashboard' },
          { name: '⚙️  Settings', value: 'settings' },
          { name: '🚪 Exit', value: 'exit' },
        ],
        pageSize: 10,
      },
    ]);

    switch (choice) {
      case 'agents':
        await this.agentsMenu();
        break;
      case 'swap':
        await this.swapMenu();
        break;
      case 'wallet':
        await this.walletMenu();
        break;
      case 'dashboard':
        await this.showDashboard();
        break;
      case 'settings':
        await this.settingsMenu();
        break;
      case 'exit':
        await this.exit();
        break;
    }
  }

  /**
   * Agents menu
   */
  private async agentsMenu() {
    console.clear();
    this.printSectionHeader('X402 AI AGENTS');

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: this.theme.bold('Agent Operations:'),
        choices: [
          { name: '🤖 Launch Google Gen AI Agent', value: 'google' },
          { name: '🔥 Deploy X402 Agent Swarm', value: 'swarm' },
          { name: '📋 List Active Agents', value: 'list' },
          { name: '📊 Agent Analytics', value: 'analytics' },
          { name: '⚡ Execute Agent Action', value: 'execute' },
          { name: '🔙 Back to Main Menu', value: 'back' },
        ],
      },
    ]);

    switch (action) {
      case 'google':
        await this.launchGoogleAgent();
        break;
      case 'swarm':
        await this.deployAgentSwarm();
        break;
      case 'list':
        await this.listAgents();
        break;
      case 'analytics':
        await this.showAgentAnalytics();
        break;
      case 'execute':
        await this.executeAgentAction();
        break;
      case 'back':
        return;
    }

    await this.agentsMenu();
  }

  /**
   * Swap menu
   */
  private async swapMenu() {
    console.clear();
    this.printSectionHeader('DARK SWAPS');

    await this.darkSwapUI.show(this.wallet!);
  }

  /**
   * Wallet menu
   */
  private async walletMenu() {
    console.clear();
    this.printSectionHeader('WALLET MANAGER');

    await this.walletManager.show(this.wallet!);
  }

  /**
   * Launch Google Gen AI Agent
   */
  private async launchGoogleAgent() {
    const spinner = ora('Launching Google Gen AI Agent...').start();

    try {
      const agent = await this.googleAI.createAgent({
        name: 'Google-Gen-X402',
        capabilities: ['analyze', 'swap', 'pool'],
        wallet: this.wallet!,
      });

      spinner.succeed(this.theme.success('Google Gen AI Agent launched!'));

      console.log();
      console.log(this.theme.primary('Agent Details:'));
      console.log(this.theme.dim(`  ID: ${agent.id}`));
      console.log(this.theme.dim(`  Name: ${agent.name}`));
      console.log(this.theme.dim(`  Model: ${agent.model}`));
      console.log(this.theme.dim(`  Capabilities: ${agent.capabilities.join(', ')}`));
      console.log();

      // Interactive chat with agent
      await this.chatWithGoogleAgent(agent);
    } catch (error: any) {
      spinner.fail(this.theme.danger(`Failed: ${error.message}`));
    }

    await this.pressAnyKey();
  }

  /**
   * Chat with Google AI Agent
   */
  private async chatWithGoogleAgent(agent: any) {
    console.log(this.theme.accent('💬 Chat with Google Gen AI Agent (type "exit" to stop)\n'));

    let chatting = true;

    while (chatting) {
      const { message } = await inquirer.prompt([
        {
          type: 'input',
          name: 'message',
          message: this.theme.primary('You:'),
        },
      ]);

      if (message.toLowerCase() === 'exit') {
        chatting = false;
        continue;
      }

      const spinner = ora('Agent thinking...').start();

      try {
        const response = await this.googleAI.chat(agent.id, message, {
          wallet: this.wallet!,
          swapManager: this.swapManager,
        });

        spinner.stop();
        console.log(this.theme.secondary(`\nAgent: ${response.text}\n`));

        // Execute actions if agent recommends any
        if (response.actions && response.actions.length > 0) {
          await this.handleAgentActions(response.actions);
        }
      } catch (error: any) {
        spinner.fail(this.theme.danger(`Error: ${error.message}`));
      }
    }
  }

  /**
   * Deploy X402 Agent Swarm
   */
  private async deployAgentSwarm() {
    const { count } = await inquirer.prompt([
      {
        type: 'number',
        name: 'count',
        message: 'How many X402 agents to deploy?',
        default: 3,
        validate: (val) => (val > 0 && val <= 10) || 'Enter 1-10 agents',
      },
    ]);

    const spinner = ora('Deploying X402 agent swarm...').start();

    try {
      const swarm = await this.x402Agents.deploySwarm(count, this.wallet!);

      spinner.succeed(this.theme.success(`Deployed ${count} X402 agents!`));

      // Display swarm table
      const table = new Table({
        head: [
          this.theme.primary('Agent ID'),
          this.theme.primary('Type'),
          this.theme.primary('Status'),
          this.theme.primary('Capabilities'),
        ],
        style: { head: [], border: [] },
      });

      swarm.forEach((agent) => {
        table.push([
          agent.id.slice(0, 8),
          agent.type,
          this.theme.success('Active'),
          agent.capabilities.join(', '),
        ]);
      });

      console.log();
      console.log(table.toString());
      console.log();
    } catch (error: any) {
      spinner.fail(this.theme.danger(`Failed: ${error.message}`));
    }

    await this.pressAnyKey();
  }

  /**
   * List active agents
   */
  private async listAgents() {
    const spinner = ora('Fetching agents...').start();

    try {
      const agents = await this.x402Agents.listAgents();

      spinner.stop();

      if (agents.length === 0) {
        console.log(this.theme.warning('\n⚠ No active agents\n'));
        await this.pressAnyKey();
        return;
      }

      const table = new Table({
        head: [
          this.theme.primary('ID'),
          this.theme.primary('Name'),
          this.theme.primary('Type'),
          this.theme.primary('Actions'),
          this.theme.primary('Success Rate'),
        ],
        style: { head: [], border: [] },
      });

      agents.forEach((agent) => {
        const successRate =
          agent.totalActions > 0
            ? ((agent.successfulActions / agent.totalActions) * 100).toFixed(1)
            : '0.0';

        table.push([
          agent.id.slice(0, 8),
          agent.name,
          agent.type,
          agent.totalActions.toString(),
          this.theme.success(`${successRate}%`),
        ]);
      });

      console.log();
      console.log(table.toString());
      console.log();
    } catch (error: any) {
      spinner.fail(this.theme.danger(`Failed: ${error.message}`));
    }

    await this.pressAnyKey();
  }

  /**
   * Show agent analytics
   */
  private async showAgentAnalytics() {
    const spinner = ora('Generating analytics...').start();

    try {
      const analytics = await this.x402Agents.getAnalytics();

      spinner.stop();

      console.log();
      console.log(this.theme.primary('═══ Agent Analytics ═══'));
      console.log();
      console.log(this.theme.secondary(`Total Agents: ${analytics.totalAgents}`));
      console.log(this.theme.secondary(`Active Agents: ${analytics.activeAgents}`));
      console.log(this.theme.secondary(`Total Actions: ${analytics.totalActions}`));
      console.log(
        this.theme.success(`Success Rate: ${analytics.successRate.toFixed(2)}%`)
      );
      console.log(
        this.theme.secondary(`Total Volume: ${analytics.totalVolume.toFixed(2)} SOL`)
      );
      console.log();
    } catch (error: any) {
      spinner.fail(this.theme.danger(`Failed: ${error.message}`));
    }

    await this.pressAnyKey();
  }

  /**
   * Execute agent action
   */
  private async executeAgentAction() {
    const agents = await this.x402Agents.listAgents();

    if (agents.length === 0) {
      console.log(this.theme.warning('\n⚠ No active agents\n'));
      await this.pressAnyKey();
      return;
    }

    const { agentId } = await inquirer.prompt([
      {
        type: 'list',
        name: 'agentId',
        message: 'Select agent:',
        choices: agents.map((a) => ({
          name: `${a.name} (${a.type})`,
          value: a.id,
        })),
      },
    ]);

    const { actionType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'actionType',
        message: 'Select action:',
        choices: [
          { name: '🔄 Execute Swap', value: 'swap' },
          { name: '📊 Portfolio Analysis', value: 'analyze' },
          { name: '💧 Pool Operation', value: 'pool' },
        ],
      },
    ]);

    const spinner = ora('Executing action...').start();

    try {
      const result = await this.x402Agents.executeAction(agentId, actionType, {
        wallet: this.wallet!,
      });

      spinner.succeed(this.theme.success('Action executed!'));
      console.log();
      console.log(this.theme.dim(JSON.stringify(result, null, 2)));
      console.log();
    } catch (error: any) {
      spinner.fail(this.theme.danger(`Failed: ${error.message}`));
    }

    await this.pressAnyKey();
  }

  /**
   * Handle agent-recommended actions
   */
  private async handleAgentActions(actions: any[]) {
    for (const action of actions) {
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: `Execute ${action.type}: ${action.description}?`,
          default: false,
        },
      ]);

      if (confirm) {
        const spinner = ora('Executing...').start();

        try {
          // Execute the action based on type
          if (action.type === 'swap') {
            await this.swapManager.executePrivateSwap(action.params);
          }

          spinner.succeed(this.theme.success('Action completed!'));
        } catch (error: any) {
          spinner.fail(this.theme.danger(`Failed: ${error.message}`));
        }
      }
    }
  }

  /**
   * Show dashboard
   */
  private async showDashboard() {
    console.clear();
    this.printSectionHeader('DASHBOARD');

    const spinner = ora('Loading dashboard...').start();

    try {
      const state = await this.wallet!.getState();
      const agents = await this.x402Agents.listAgents();
      const analytics = await this.x402Agents.getAnalytics();

      spinner.stop();

      // Wallet info
      console.log(this.theme.primary('💼 Wallet'));
      console.log(this.theme.dim(`  Shielded Balance: ${state.shieldedBalance} lamports`));
      console.log(
        this.theme.dim(`  Transparent Balance: ${state.transparentBalance} lamports`)
      );
      console.log(this.theme.dim(`  Notes: ${state.notes.length}`));
      console.log();

      // Agents info
      console.log(this.theme.primary('🤖 Agents'));
      console.log(this.theme.dim(`  Total: ${analytics.totalAgents}`));
      console.log(this.theme.dim(`  Active: ${analytics.activeAgents}`));
      console.log(this.theme.dim(`  Success Rate: ${analytics.successRate.toFixed(2)}%`));
      console.log();

      // Recent activity table
      const table = new Table({
        head: [
          this.theme.primary('Time'),
          this.theme.primary('Type'),
          this.theme.primary('Agent'),
          this.theme.primary('Status'),
        ],
        style: { head: [], border: [] },
      });

      // Mock recent activity
      table.push(
        ['2m ago', 'Swap', 'X402-1', this.theme.success('✓')],
        ['5m ago', 'Analysis', 'Google-Gen', this.theme.success('✓')],
        ['12m ago', 'Transfer', 'X402-2', this.theme.success('✓')]
      );

      console.log(this.theme.primary('📊 Recent Activity'));
      console.log(table.toString());
      console.log();
    } catch (error: any) {
      spinner.fail(this.theme.danger(`Failed: ${error.message}`));
    }

    await this.pressAnyKey();
  }

  /**
   * Settings menu
   */
  private async settingsMenu() {
    console.clear();
    this.printSectionHeader('SETTINGS');

    const { setting } = await inquirer.prompt([
      {
        type: 'list',
        name: 'setting',
        message: 'Settings:',
        choices: [
          { name: '🌐 Network', value: 'network' },
          { name: '🔐 Privacy Level', value: 'privacy' },
          { name: '⚡ RPC Endpoint', value: 'rpc' },
          { name: '🔙 Back', value: 'back' },
        ],
      },
    ]);

    if (setting === 'back') return;

    console.log(this.theme.warning('\n⚠ Settings coming soon!\n'));
    await this.pressAnyKey();
  }

  /**
   * Print section header
   */
  private printSectionHeader(title: string) {
    console.log(this.theme.secondary('═'.repeat(80)));
    console.log(this.theme.accent(`  ${title}`));
    console.log(this.theme.secondary('═'.repeat(80)));
    console.log();
  }

  /**
   * Wait for user input
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

  /**
   * Exit terminal
   */
  private async exit() {
    console.log();
    console.log(this.theme.secondary('━'.repeat(80)));
    console.log(this.theme.accent('  Thank you for using Dark X402 Terminal'));
    console.log(this.theme.secondary('━'.repeat(80)));
    console.log();

    this.isRunning = false;
    process.exit(0);
  }
}
