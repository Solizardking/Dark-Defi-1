/**
 * Dark Protocol SDK
 * Privacy-first Solana wallet with Zcash Sapling integration, AI agents, Jupiter swaps, and Helius
 */
export { DarkProtocolClient } from './client';
export type { DarkProtocolConfig, Network } from './client';
export { DarkWallet } from './wallet';
export { PrivacyUtils } from './privacy';
export { PrivateSwapManager } from './swap';
export type { JupiterUltraOrder, JupiterUltraExecuteResult, TokenHolding, TokenShieldWarning, SwapQuoteWithOracle } from './swap';
export { PriceOracle, KNOWN_TOKENS, formatPrice, formatSlippage, calculatePriceImpact } from './oracle';
export type { TokenPrice, MarketData, OracleConfig } from './oracle';
export { AIAgentManager } from './ai-agent';
export { DarkSwap, DarkSwapDemo } from './components/DarkSwap';
export type { DarkSwapProps } from './components/DarkSwap';
export * from './types';
export * from './utils';
export * from './sapling';
export * from './note-encryption';
export * from './config';
export declare const VERSION = "0.2.0";
//# sourceMappingURL=index.d.ts.map