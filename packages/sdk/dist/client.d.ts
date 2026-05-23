import { Connection, PublicKey, type Keypair, Transaction as SolanaTransaction } from '@solana/web3.js';
import { Program } from '@coral-xyz/anchor';
export type Network = 'devnet' | 'mainnet' | 'localnet';
export interface DarkProtocolConfig {
    /** Helius API key — used for RPC and DAS queries */
    heliusApiKey?: string;
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
    readonly program: Program;
    readonly config: DarkProtocolConfig;
    readonly programId: PublicKey;
    private constructor();
    /**
     * Create a new Dark Protocol client instance.
     *
     * @example
     * ```ts
     * const client = await DarkProtocolClient.create({
     *   network: 'mainnet',
     *   heliusApiKey: process.env.HELIUS_API_KEY,
     * });
     * ```
     */
    static create(config: DarkProtocolConfig): Promise<DarkProtocolClient>;
    /**
     * Return the PDA for the global ProtocolState account.
     */
    protocolStatePDA(): [PublicKey, number];
    /**
     * Return the PDA for the SOL pool vault.
     */
    poolVaultPDA(): [PublicKey, number];
    /**
     * Return the PDA for a shielded note given its commitment.
     */
    notePDA(commitment: Uint8Array): [PublicKey, number];
    /**
     * Return the PDA for a nullifier record.
     */
    nullifierPDA(nullifier: Uint8Array): [PublicKey, number];
    /**
     * Fetch on-chain protocol state (note count, Merkle root, authority).
     */
    getProtocolState(): Promise<{
        authority: PublicKey;
        noteCount: bigint;
        bump: number;
        vaultBump: number;
    } | null>;
    /**
     * Fetch a shielded note account by its commitment.
     */
    getNote(commitment: Uint8Array): Promise<{
        commitment: Buffer;
        amount: bigint;
        spent: boolean;
        noteIndex: bigint;
        slot: bigint;
        depositor: PublicKey;
    } | null>;
    /**
     * Check whether a nullifier has been spent on-chain.
     */
    isNullifierSpent(nullifier: Uint8Array): Promise<boolean>;
    /**
     * Create a transaction to initialise the protocol state.
     * Call once after first deployment.
     */
    buildInitializeTx(payer: PublicKey, authority: PublicKey): Promise<SolanaTransaction>;
    /**
     * Legacy compat — kept for backward compatibility.
     */
    createTransaction(params: {
        instructions: any[];
        signers: Keypair[];
        feePayer?: PublicKey;
    }): Promise<SolanaTransaction>;
    /**
     * Fetch the AI agent info (legacy stub — kept for API compatibility).
     */
    getAIAgent(_agentPubkey: PublicKey): Promise<null>;
}
//# sourceMappingURL=client.d.ts.map