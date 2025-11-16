/**
 * Dark X402 Terminal
 * A privacy-first DeFi terminal with AI agents, dark swaps, and shielded wallets
 */
export declare class X402Terminal {
    private client;
    private wallet?;
    private swapManager;
    private aiManager;
    private x402Agents;
    private googleAI;
    private darkSwapUI;
    private walletManager;
    private isRunning;
    private currentMode;
    private theme;
    constructor();
    /**
     * Initialize the terminal
     */
    initialize(): Promise<void>;
    /**
     * Start the terminal
     */
    start(): Promise<void>;
    /**
     * Print terminal header
     */
    private printHeader;
    /**
     * Setup wallet
     */
    private setupWallet;
    /**
     * Main terminal loop
     */
    private mainLoop;
    /**
     * Show main menu
     */
    private showMainMenu;
    /**
     * Agents menu
     */
    private agentsMenu;
    /**
     * Swap menu
     */
    private swapMenu;
    /**
     * Wallet menu
     */
    private walletMenu;
    /**
     * Launch Google Gen AI Agent
     */
    private launchGoogleAgent;
    /**
     * Chat with Google AI Agent
     */
    private chatWithGoogleAgent;
    /**
     * Deploy X402 Agent Swarm
     */
    private deployAgentSwarm;
    /**
     * List active agents
     */
    private listAgents;
    /**
     * Show agent analytics
     */
    private showAgentAnalytics;
    /**
     * Execute agent action
     */
    private executeAgentAction;
    /**
     * Handle agent-recommended actions
     */
    private handleAgentActions;
    /**
     * Show dashboard
     */
    private showDashboard;
    /**
     * Settings menu
     */
    private settingsMenu;
    /**
     * Print section header
     */
    private printSectionHeader;
    /**
     * Wait for user input
     */
    private pressAnyKey;
    /**
     * Exit terminal
     */
    private exit;
}
//# sourceMappingURL=x402-terminal.d.ts.map