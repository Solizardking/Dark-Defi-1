/**
 * Dark Protocol SDK - Comprehensive Usage Examples
 *
 * This file demonstrates all major features of the Dark Protocol SDK including:
 * - Client initialization
 * - Wallet creation and management
 * - Zcash Sapling address generation
 * - Privacy operations (shield/unshield)
 * - Private transfers
 * - Jupiter swap integration
 * - AI agent registration and usage
 * - Note encryption and decryption
 */
import { PublicKey } from '@solana/web3.js';
import { DarkProtocolClient, DarkWallet, SaplingHDWallet } from './index';
/**
 * Example 1: Initialize Dark Protocol Client
 */
export declare function example1_InitializeClient(): Promise<DarkProtocolClient>;
/**
 * Example 2: Create and Manage Wallets
 */
export declare function example2_CreateWallet(client: DarkProtocolClient): Promise<DarkWallet>;
/**
 * Example 3: Zcash Sapling Address System
 */
export declare function example3_SaplingAddresses(): Promise<SaplingHDWallet>;
/**
 * Example 4: Shield and Unshield Tokens
 */
export declare function example4_ShieldUnshield(client: DarkProtocolClient, wallet: DarkWallet): Promise<void>;
/**
 * Example 5: Private Transfers
 */
export declare function example5_PrivateTransfer(wallet: DarkWallet): Promise<void>;
/**
 * Example 6: Private Swaps with Jupiter
 */
export declare function example6_PrivateSwaps(client: DarkProtocolClient, userPublicKey: PublicKey): Promise<void>;
/**
 * Example 7: AI Agent Integration
 */
export declare function example7_AIAgents(client: DarkProtocolClient, owner: PublicKey): Promise<void>;
/**
 * Example 8: Note Encryption and Decryption
 */
export declare function example8_NoteEncryption(saplingWallet: SaplingHDWallet): Promise<void>;
/**
 * Example 9: Privacy Utilities
 */
export declare function example9_PrivacyUtils(): Promise<void>;
/**
 * Example 10: Complete Privacy Workflow
 */
export declare function example10_CompleteWorkflow(): Promise<void>;
/**
 * Run all examples
 */
export declare function runAllExamples(): Promise<void>;
//# sourceMappingURL=examples.d.ts.map