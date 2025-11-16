"use strict";
/**
 * Dark X402 Terminal
 * A privacy-first DeFi terminal with AI agents, dark swaps, and shielded wallets
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.X402Terminal = void 0;
const chalk_1 = __importDefault(require("chalk"));
const figlet_1 = __importDefault(require("figlet"));
const inquirer_1 = __importDefault(require("inquirer"));
const ora_1 = __importDefault(require("ora"));
const cli_table3_1 = __importDefault(require("cli-table3"));
const Protocol_1 = require("../Protocol");
const x402_agents_1 = require("./x402-agents");
const google_ai_agent_1 = require("./google-ai-agent");
const dark_swap_ui_1 = require("./dark-swap-ui");
const dark_wallet_manager_1 = require("./dark-wallet-manager");
class X402Terminal {
    constructor() {
        // Terminal state
        this.isRunning = false;
        this.currentMode = 'main';
        // X402 Dark Theme
        this.theme = {
            primary: chalk_1.default.hex('#9945FF'),
            secondary: chalk_1.default.hex('#14F195'),
            accent: chalk_1.default.hex('#FF00FF'),
            danger: chalk_1.default.hex('#FF0040'),
            warning: chalk_1.default.hex('#FFB800'),
            success: chalk_1.default.hex('#00FF88'),
            dim: chalk_1.default.dim,
            bold: chalk_1.default.bold,
            bg: chalk_1.default.bgHex('#0A0A0F'),
        };
    }
    /**
     * Initialize the terminal
     */
    async initialize() {
        const spinner = (0, ora_1.default)({
            text: this.theme.dim('Initializing Dark Protocol...'),
            color: 'magenta',
        }).start();
        try {
            // Initialize Dark Protocol client
            this.client = await Protocol_1.DarkProtocolClient.create({
                heliusApiKey: process.env.HELIUS_API_KEY,
                network: process.env.NETWORK || 'devnet',
                useSecureRpc: true,
                jupiterApiKey: process.env.JUPITER_API_KEY,
                redpillApiKey: process.env.REDPILL_API_KEY,
            });
            // Initialize managers
            this.swapManager = new Protocol_1.PrivateSwapManager(this.client, process.env.JUPITER_API_KEY);
            this.aiManager = new Protocol_1.AIAgentManager(this.client, process.env.REDPILL_API_KEY);
            this.x402Agents = new x402_agents_1.X402AgentManager(this.client, this.aiManager);
            this.googleAI = new google_ai_agent_1.GoogleGenAIAgent(process.env.GOOGLE_AI_API_KEY);
            this.darkSwapUI = new dark_swap_ui_1.DarkSwapUI(this.swapManager, this.theme);
            this.walletManager = new dark_wallet_manager_1.DarkWalletManager(this.client, this.theme);
            spinner.succeed(this.theme.success('Dark Protocol initialized ✓'));
        }
        catch (error) {
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
    printHeader() {
        const banner = figlet_1.default.textSync('DARK X402', {
            font: 'ANSI Shadow',
            horizontalLayout: 'default',
        });
        console.log(this.theme.primary(banner));
        console.log(this.theme.secondary('━'.repeat(80)));
        console.log(this.theme.accent('    Privacy-First DeFi Terminal with AI Agents & Shielded Swaps    '));
        console.log(this.theme.secondary('━'.repeat(80)));
        console.log();
    }
    /**
     * Setup wallet
     */
    async setupWallet() {
        const { action } = await inquirer_1.default.prompt([
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
        this.wallet = await this.walletManager.setupWallet(action);
        console.log();
        console.log(this.theme.success('✓ Wallet ready'));
        console.log(this.theme.dim(`  Address: ${this.wallet.publicKey.toBase58()}`));
        console.log();
    }
    /**
     * Main terminal loop
     */
    async mainLoop() {
        while (this.isRunning) {
            try {
                await this.showMainMenu();
            }
            catch (error) {
                console.log(this.theme.danger(`\n⚠ Error: ${error.message}\n`));
            }
        }
    }
    /**
     * Show main menu
     */
    async showMainMenu() {
        const { choice } = await inquirer_1.default.prompt([
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
    async agentsMenu() {
        console.clear();
        this.printSectionHeader('X402 AI AGENTS');
        const { action } = await inquirer_1.default.prompt([
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
    async swapMenu() {
        console.clear();
        this.printSectionHeader('DARK SWAPS');
        await this.darkSwapUI.show(this.wallet);
    }
    /**
     * Wallet menu
     */
    async walletMenu() {
        console.clear();
        this.printSectionHeader('WALLET MANAGER');
        await this.walletManager.show(this.wallet);
    }
    /**
     * Launch Google Gen AI Agent
     */
    async launchGoogleAgent() {
        const spinner = (0, ora_1.default)('Launching Google Gen AI Agent...').start();
        try {
            const agent = await this.googleAI.createAgent({
                name: 'Google-Gen-X402',
                capabilities: ['analyze', 'swap', 'pool'],
                wallet: this.wallet,
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
        }
        catch (error) {
            spinner.fail(this.theme.danger(`Failed: ${error.message}`));
        }
        await this.pressAnyKey();
    }
    /**
     * Chat with Google AI Agent
     */
    async chatWithGoogleAgent(agent) {
        console.log(this.theme.accent('💬 Chat with Google Gen AI Agent (type "exit" to stop)\n'));
        let chatting = true;
        while (chatting) {
            const { message } = await inquirer_1.default.prompt([
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
            const spinner = (0, ora_1.default)('Agent thinking...').start();
            try {
                const response = await this.googleAI.chat(agent.id, message, {
                    wallet: this.wallet,
                    swapManager: this.swapManager,
                });
                spinner.stop();
                console.log(this.theme.secondary(`\nAgent: ${response.text}\n`));
                // Execute actions if agent recommends any
                if (response.actions && response.actions.length > 0) {
                    await this.handleAgentActions(response.actions);
                }
            }
            catch (error) {
                spinner.fail(this.theme.danger(`Error: ${error.message}`));
            }
        }
    }
    /**
     * Deploy X402 Agent Swarm
     */
    async deployAgentSwarm() {
        const { count } = await inquirer_1.default.prompt([
            {
                type: 'number',
                name: 'count',
                message: 'How many X402 agents to deploy?',
                default: 3,
                validate: (val) => (val > 0 && val <= 10) || 'Enter 1-10 agents',
            },
        ]);
        const spinner = (0, ora_1.default)('Deploying X402 agent swarm...').start();
        try {
            const swarm = await this.x402Agents.deploySwarm(count, this.wallet);
            spinner.succeed(this.theme.success(`Deployed ${count} X402 agents!`));
            // Display swarm table
            const table = new cli_table3_1.default({
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
        }
        catch (error) {
            spinner.fail(this.theme.danger(`Failed: ${error.message}`));
        }
        await this.pressAnyKey();
    }
    /**
     * List active agents
     */
    async listAgents() {
        const spinner = (0, ora_1.default)('Fetching agents...').start();
        try {
            const agents = await this.x402Agents.listAgents();
            spinner.stop();
            if (agents.length === 0) {
                console.log(this.theme.warning('\n⚠ No active agents\n'));
                await this.pressAnyKey();
                return;
            }
            const table = new cli_table3_1.default({
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
                const successRate = agent.totalActions > 0
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
        }
        catch (error) {
            spinner.fail(this.theme.danger(`Failed: ${error.message}`));
        }
        await this.pressAnyKey();
    }
    /**
     * Show agent analytics
     */
    async showAgentAnalytics() {
        const spinner = (0, ora_1.default)('Generating analytics...').start();
        try {
            const analytics = await this.x402Agents.getAnalytics();
            spinner.stop();
            console.log();
            console.log(this.theme.primary('═══ Agent Analytics ═══'));
            console.log();
            console.log(this.theme.secondary(`Total Agents: ${analytics.totalAgents}`));
            console.log(this.theme.secondary(`Active Agents: ${analytics.activeAgents}`));
            console.log(this.theme.secondary(`Total Actions: ${analytics.totalActions}`));
            console.log(this.theme.success(`Success Rate: ${analytics.successRate.toFixed(2)}%`));
            console.log(this.theme.secondary(`Total Volume: ${analytics.totalVolume.toFixed(2)} SOL`));
            console.log();
        }
        catch (error) {
            spinner.fail(this.theme.danger(`Failed: ${error.message}`));
        }
        await this.pressAnyKey();
    }
    /**
     * Execute agent action
     */
    async executeAgentAction() {
        const agents = await this.x402Agents.listAgents();
        if (agents.length === 0) {
            console.log(this.theme.warning('\n⚠ No active agents\n'));
            await this.pressAnyKey();
            return;
        }
        const { agentId } = await inquirer_1.default.prompt([
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
        const { actionType } = await inquirer_1.default.prompt([
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
        const spinner = (0, ora_1.default)('Executing action...').start();
        try {
            const result = await this.x402Agents.executeAction(agentId, actionType, {
                wallet: this.wallet,
            });
            spinner.succeed(this.theme.success('Action executed!'));
            console.log();
            console.log(this.theme.dim(JSON.stringify(result, null, 2)));
            console.log();
        }
        catch (error) {
            spinner.fail(this.theme.danger(`Failed: ${error.message}`));
        }
        await this.pressAnyKey();
    }
    /**
     * Handle agent-recommended actions
     */
    async handleAgentActions(actions) {
        for (const action of actions) {
            const { confirm } = await inquirer_1.default.prompt([
                {
                    type: 'confirm',
                    name: 'confirm',
                    message: `Execute ${action.type}: ${action.description}?`,
                    default: false,
                },
            ]);
            if (confirm) {
                const spinner = (0, ora_1.default)('Executing...').start();
                try {
                    // Execute the action based on type
                    if (action.type === 'swap') {
                        await this.swapManager.executePrivateSwap(action.params);
                    }
                    spinner.succeed(this.theme.success('Action completed!'));
                }
                catch (error) {
                    spinner.fail(this.theme.danger(`Failed: ${error.message}`));
                }
            }
        }
    }
    /**
     * Show dashboard
     */
    async showDashboard() {
        console.clear();
        this.printSectionHeader('DASHBOARD');
        const spinner = (0, ora_1.default)('Loading dashboard...').start();
        try {
            const state = await this.wallet.getState();
            const agents = await this.x402Agents.listAgents();
            const analytics = await this.x402Agents.getAnalytics();
            spinner.stop();
            // Wallet info
            console.log(this.theme.primary('💼 Wallet'));
            console.log(this.theme.dim(`  Shielded Balance: ${state.shieldedBalance} lamports`));
            console.log(this.theme.dim(`  Transparent Balance: ${state.transparentBalance} lamports`));
            console.log(this.theme.dim(`  Notes: ${state.notes.length}`));
            console.log();
            // Agents info
            console.log(this.theme.primary('🤖 Agents'));
            console.log(this.theme.dim(`  Total: ${analytics.totalAgents}`));
            console.log(this.theme.dim(`  Active: ${analytics.activeAgents}`));
            console.log(this.theme.dim(`  Success Rate: ${analytics.successRate.toFixed(2)}%`));
            console.log();
            // Recent activity table
            const table = new cli_table3_1.default({
                head: [
                    this.theme.primary('Time'),
                    this.theme.primary('Type'),
                    this.theme.primary('Agent'),
                    this.theme.primary('Status'),
                ],
                style: { head: [], border: [] },
            });
            // Mock recent activity
            table.push(['2m ago', 'Swap', 'X402-1', this.theme.success('✓')], ['5m ago', 'Analysis', 'Google-Gen', this.theme.success('✓')], ['12m ago', 'Transfer', 'X402-2', this.theme.success('✓')]);
            console.log(this.theme.primary('📊 Recent Activity'));
            console.log(table.toString());
            console.log();
        }
        catch (error) {
            spinner.fail(this.theme.danger(`Failed: ${error.message}`));
        }
        await this.pressAnyKey();
    }
    /**
     * Settings menu
     */
    async settingsMenu() {
        console.clear();
        this.printSectionHeader('SETTINGS');
        const { setting } = await inquirer_1.default.prompt([
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
        if (setting === 'back')
            return;
        console.log(this.theme.warning('\n⚠ Settings coming soon!\n'));
        await this.pressAnyKey();
    }
    /**
     * Print section header
     */
    printSectionHeader(title) {
        console.log(this.theme.secondary('═'.repeat(80)));
        console.log(this.theme.accent(`  ${title}`));
        console.log(this.theme.secondary('═'.repeat(80)));
        console.log();
    }
    /**
     * Wait for user input
     */
    async pressAnyKey() {
        await inquirer_1.default.prompt([
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
    async exit() {
        console.log();
        console.log(this.theme.secondary('━'.repeat(80)));
        console.log(this.theme.accent('  Thank you for using Dark X402 Terminal'));
        console.log(this.theme.secondary('━'.repeat(80)));
        console.log();
        this.isRunning = false;
        process.exit(0);
    }
}
exports.X402Terminal = X402Terminal;
//# sourceMappingURL=x402-terminal.js.map