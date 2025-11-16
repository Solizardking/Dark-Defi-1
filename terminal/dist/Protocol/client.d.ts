import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { Program } from '@coral-xyz/anchor';
export type Network = 'devnet' | 'mainnet' | 'localnet';
export interface DarkProtocolConfig {
    heliusApiKey: string;
    network?: Network;
    useSecureRpc?: boolean;
    jupiterApiKey?: string;
    redpillApiKey?: string;
    rpcUrl?: string;
    programId?: PublicKey;
    commitment?: 'processed' | 'confirmed' | 'finalized';
}
export declare class DarkProtocolClient {
    readonly connection: Connection;
    readonly program: Program<any>;
    readonly helius: any;
    readonly config: DarkProtocolConfig;
    private constructor();
    /**
     * Create a new Dark Protocol client
     */
    static create(config: DarkProtocolConfig): Promise<DarkProtocolClient>;
    /**
     * Load program IDL
     */
    private static loadIdl;
    /**
     * Get protocol state
     */
    getProtocolState(): Promise<any>;
    /**
     * Get merkle tree state
     */
    getMerkleTree(): Promise<any>;
    /**
     * Create smart transaction with Helius
     */
    createSmartTx(params: {
        instructions: any[];
        signers: Keypair[];
        feePayer?: PublicKey;
    }): Promise<any>;
    /**
     * Get shielded address for a user
     */
    getShieldedAddress(owner: PublicKey): Promise<any>;
    /**
     * Get AI agent info
     */
    getAIAgent(agentPubkey: PublicKey): Promise<any>;
}
//# sourceMappingURL=client.d.ts.map