import { PublicKey } from '@solana/web3.js';
/**
 * Utility functions for Dark Protocol
 */
/**
 * Convert bytes to hex string
 */
export declare function bytesToHex(bytes: Uint8Array): string;
/**
 * Convert hex string to bytes
 */
export declare function hexToBytes(hex: string): Uint8Array;
/**
 * Convert bytes to base58
 */
export declare function bytesToBase58(bytes: Uint8Array): string;
/**
 * Convert base58 to bytes
 */
export declare function base58ToBytes(base58: string): Uint8Array;
/**
 * Format amount with decimals
 */
export declare function formatAmount(amount: bigint, decimals: number): string;
/**
 * Parse amount from string
 */
export declare function parseAmount(amount: string, decimals: number): bigint;
/**
 * Sleep for specified milliseconds
 */
export declare function sleep(ms: number): Promise<void>;
/**
 * Retry function with exponential backoff
 */
export declare function retry<T>(fn: () => Promise<T>, maxRetries?: number, delayMs?: number): Promise<T>;
/**
 * Chunk array into smaller arrays
 */
export declare function chunk<T>(array: T[], size: number): T[][];
/**
 * Get explorer URL for transaction
 */
export declare function getExplorerUrl(signature: string, cluster?: 'mainnet' | 'devnet' | 'testnet'): string;
/**
 * Get explorer URL for address
 */
export declare function getAddressExplorerUrl(address: PublicKey | string, cluster?: 'mainnet' | 'devnet' | 'testnet'): string;
/**
 * Validate Solana address
 */
export declare function isValidAddress(address: string): boolean;
/**
 * Generate random bytes
 */
export declare function randomBytes(length: number): Uint8Array;
/**
 * Combine multiple Uint8Arrays
 */
export declare function concatBytes(...arrays: Uint8Array[]): Uint8Array;
/**
 * Compare two Uint8Arrays for equality
 */
export declare function bytesEqual(a: Uint8Array, b: Uint8Array): boolean;
//# sourceMappingURL=utils.d.ts.map