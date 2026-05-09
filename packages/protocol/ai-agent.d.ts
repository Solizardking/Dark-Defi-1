import { PublicKey } from '@solana/web3.js';
import { DarkProtocolClient } from './client';
import type { AIAgent, AIAgentCapability, TEEAttestation } from './types';
export declare class AIAgentManager {
    private client;
    private redpillApiKey?;
    constructor(client: DarkProtocolClient, redpillApiKey?: string);
    /**
     * Register new AI agent in TEE environment
     */
    registerAgent(params: {
        agentPubkey: PublicKey;
        teeAttestation: TEEAttestation;
        capabilities: AIAgentCapability[];
        owner: PublicKey;
    }): Promise<string>;
    /**
     * Execute AI agent action
     */
    executeAction(params: {
        agentPubkey: PublicKey;
        actionType: number;
        encryptedParams: Uint8Array;
        proof: Uint8Array;
        executor: PublicKey;
    }): Promise<string>;
    /**
     * Get AI agent information
     */
    getAgent(agentPubkey: PublicKey): Promise<AIAgent | null>;
    /**
     * Verify TEE attestation using Intel SGX or AMD SEV
     */
    private verifyTEEAttestation;
    /**
     * Encode AI agent capabilities
     */
    private encodeCapabilities;
    /**
     * Decode AI agent capabilities
     */
    decodeCapabilities(capabilitiesBytes: Uint8Array): AIAgentCapability[];
    /**
     * Request AI agent analysis
     */
    requestAnalysis(params: {
        agentPubkey: PublicKey;
        dataType: 'portfolio' | 'market' | 'risk';
        encryptedData: Uint8Array;
    }): Promise<any>;
    /**
     * Get agent recommendations for swaps
     */
    getSwapRecommendations(params: {
        agentPubkey: PublicKey;
        portfolioData: any;
    }): Promise<any[]>;
}
//# sourceMappingURL=ai-agent.d.ts.map