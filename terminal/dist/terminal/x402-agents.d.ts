/**
 * X402 Agent Manager
 * Manages multiple specialized AI agents for Dark Protocol operations
 */
import { DarkProtocolClient } from '../Protocol/client';
import { AIAgentManager } from '../Protocol/ai-agent';
import { DarkWallet } from '../Protocol/wallet';
import { PublicKey, Keypair } from '@solana/web3.js';
import type { AIAgentCapability } from '../Protocol/types';
export interface X402Agent {
    id: string;
    name: string;
    type: 'swap' | 'arbitrage' | 'portfolio' | 'security' | 'multi';
    keypair: Keypair;
    pubkey: PublicKey;
    capabilities: AIAgentCapability[];
    status: 'active' | 'paused' | 'stopped';
    totalActions: number;
    successfulActions: number;
    createdAt: number;
    lastActionAt?: number;
}
export interface AgentAnalytics {
    totalAgents: number;
    activeAgents: number;
    totalActions: number;
    successRate: number;
    totalVolume: number;
    agentPerformance: Map<string, any>;
}
export declare class X402AgentManager {
    private client;
    private aiManager;
    private agents;
    constructor(client: DarkProtocolClient, aiManager: AIAgentManager);
    /**
     * Deploy a swarm of X402 agents
     */
    deploySwarm(count: number, owner: DarkWallet): Promise<X402Agent[]>;
    /**
     * Create a new X402 agent
     */
    createAgent(params: {
        name: string;
        type: 'swap' | 'arbitrage' | 'portfolio' | 'security' | 'multi';
        owner: DarkWallet;
    }): Promise<X402Agent>;
    /**
     * Get capabilities for agent type
     */
    private getCapabilitiesForType;
    /**
     * Execute agent action
     */
    executeAction(agentId: string, actionType: 'swap' | 'analyze' | 'pool', context: {
        wallet: DarkWallet;
        params?: any;
    }): Promise<any>;
    /**
     * Execute swap action
     */
    private executeSwapAction;
    /**
     * Execute analysis action
     */
    private executeAnalysisAction;
    /**
     * Execute pool action
     */
    private executePoolAction;
    /**
     * Calculate portfolio risk score
     */
    private calculateRiskScore;
    /**
     * List all agents
     */
    listAgents(): Promise<X402Agent[]>;
    /**
     * Get agent by ID
     */
    getAgent(agentId: string): X402Agent | undefined;
    /**
     * Pause agent
     */
    pauseAgent(agentId: string): void;
    /**
     * Resume agent
     */
    resumeAgent(agentId: string): void;
    /**
     * Stop agent
     */
    stopAgent(agentId: string): void;
    /**
     * Delete agent
     */
    deleteAgent(agentId: string): boolean;
    /**
     * Get analytics for all agents
     */
    getAnalytics(): Promise<AgentAnalytics>;
    /**
     * Get agent performance
     */
    getAgentPerformance(agentId: string): any;
    /**
     * Auto-execute agent swarm strategy
     */
    executeSwarmStrategy(strategy: 'balanced' | 'aggressive' | 'conservative', wallet: DarkWallet): Promise<any[]>;
    /**
     * Execute strategy for single agent
     */
    private executeAgentStrategy;
    /**
     * Select action type for agent
     */
    private selectActionForType;
    /**
     * Generate unique agent ID
     */
    private generateAgentId;
}
//# sourceMappingURL=x402-agents.d.ts.map