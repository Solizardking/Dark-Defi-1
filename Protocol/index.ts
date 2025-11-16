/**
 * Dark Protocol SDK
 * Privacy-first Solana wallet with Zcash Sapling integration, AI agents, Jupiter swaps, and Helius
 */

export * from './client';
export * from './wallet';
export * from './privacy';
export * from './swap';
export * from './ai-agent';
export * from './types';
export * from './utils';

// Zcash Sapling Integration
export * from './sapling';
export * from './note-encryption';

// Network Configuration
export * from './config';

// Re-export Helius SDK components
export {
  createHelius,
  type CreateSmartTxInput,
  type SendSmartTransactionInput
} from 'helius-sdk/rpc';

export {
  createSmartTransaction,
  sendSmartTransaction,
  broadcastTransaction
} from 'helius-sdk/transactions';

// Version
export const VERSION = '0.2.0'; // Updated for Zcash Sapling integration
