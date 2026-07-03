/**
 * Dark Protocol SDK
 * Privacy-first Solana wallet with Zcash Sapling integration, AI agents, Jupiter swaps, and Helius
 */

// Core client
export { DarkProtocolClient } from './client';
export type { DarkProtocolConfig, Network } from './client';

// Wallet
export { DarkWallet } from './wallet';

// Privacy
export { PrivacyUtils } from './privacy';

// Swap
export { PrivateSwapManager } from './swap';
export type {
  JupiterUltraOrder,
  JupiterUltraExecuteResult,
  TokenHolding,
  TokenShieldWarning,
  SwapQuoteWithOracle
} from './swap';

// Price Oracle
export { PriceOracle, KNOWN_TOKENS, formatPrice, formatSlippage, calculatePriceImpact } from './oracle';
export type { TokenPrice, MarketData, OracleConfig } from './oracle';

// AI Agent
export { AIAgentManager } from './ai-agent';

// React Components
export { DarkSwap, DarkSwapDemo } from './components/DarkSwap';
export type { DarkSwapProps } from './components/DarkSwap';

// Types
export * from './types';

// Utils
export * from './utils';

// Zcash Sapling Integration
export * from './sapling';
export * from './note-encryption';

// Configuration
export * from './config';

// Version
export const VERSION = '0.2.0'; // Updated for Zcash Sapling integration
