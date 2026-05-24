/**
 * @dark-protocol/tee-agents
 *
 * TEE-attested confidential AI agents on Solana. Spawn enclave-backed agents,
 * anchor their identity in the Solana Attestation Service, pay for sealed
 * inference with the x402 `dark-shielded` scheme, and write paid-inference
 * receipts back on-chain.
 */

export * from "./config.js";
export * from "./crypto.js";
export * from "./attestation/tee.js";
export * from "./attestation/schemas.js";
export * from "./attestation/service.js";
export * from "./payments/x402.js";
export * from "./inference/client.js";
export * from "./agents/confidential-agent.js";
export * from "./agents/clawd.js";
