/**
 * Google Gen AI Agent Integration
 * Uses Google's Gemini API for intelligent DeFi operations
 */
import { DarkWallet } from '../protocol/wallet';
import { PrivateSwapManager } from '../protocol/swap';
export interface GoogleAgent {
    id: string;
    name: string;
    model: string;
    capabilities: string[];
    createdAt: number;
    sessionHistory: any[];
}
export interface AgentResponse {
    text: string;
    actions?: AgentAction[];
    metadata?: any;
}
export interface AgentAction {
    type: 'swap' | 'transfer' | 'analyze' | 'pool';
    description: string;
    params: any;
    confidence: number;
}
export declare class GoogleGenAIAgent {
    private genAI;
    private agents;
    private models;
    constructor(apiKey: string);
    /**
     * Create a new Google Gen AI agent
     */
    createAgent(params: {
        name: string;
        capabilities: string[];
        wallet: DarkWallet;
        model?: string;
    }): Promise<GoogleAgent>;
    /**
     * Initialize agent with system prompt
     */
    private initializeAgent;
    /**
     * Chat with agent
     */
    chat(agentId: string, message: string, context?: {
        wallet?: DarkWallet;
        swapManager?: PrivateSwapManager;
    }): Promise<AgentResponse>;
    /**
     * Parse actions from agent response
     */
    private parseActions;
    /**
     * Analyze portfolio
     */
    analyzePortfolio(agentId: string, wallet: DarkWallet): Promise<any>;
    /**
     * Get swap recommendation
     */
    getSwapRecommendation(agentId: string, params: {
        inputToken: string;
        outputToken: string;
        amount: number;
        wallet: DarkWallet;
        swapManager: PrivateSwapManager;
    }): Promise<AgentResponse>;
    /**
     * Assess risk for operation
     */
    assessRisk(agentId: string, operation: {
        type: string;
        params: any;
    }): Promise<{
        riskLevel: 'low' | 'medium' | 'high' | 'critical';
        score: number;
        factors: string[];
        recommendation: string;
    }>;
    /**
     * Generate trading strategy
     */
    generateStrategy(agentId: string, params: {
        goals: string[];
        riskTolerance: 'low' | 'medium' | 'high';
        timeframe: string;
        capital: number;
    }): Promise<any>;
    /**
     * Get agent info
     */
    getAgent(agentId: string): GoogleAgent | undefined;
    /**
     * List all agents
     */
    listAgents(): GoogleAgent[];
    /**
     * Delete agent
     */
    deleteAgent(agentId: string): boolean;
    /**
     * Generate unique agent ID
     */
    private generateAgentId;
    /**
     * Get conversation history
     */
    getHistory(agentId: string): any[];
    /**
     * Clear conversation history
     */
    clearHistory(agentId: string): void;
}
//# sourceMappingURL=google-ai-agent.d.ts.map