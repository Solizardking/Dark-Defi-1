/**
 * @module dark
 *
 * Dark DeFi extensions on top of the Solana Attestation Service client.
 *
 * Provides:
 *  - Program addresses for all Dark-controlled on-chain programs
 *  - Canonical schema definitions (agent identity + inference receipt)
 *  - A minimal AgentRegistry helper for on-chain + demo-mode registration
 *  - Convenience re-exports so callers only need one import path
 */

export * from "./programs";
export * from "./schemas";
export * from "./registry";
export * from "./inference";
