/**
 * SAS schema definitions for the Dark confidential-agent stack.
 *
 * Layout codes follow the SAS compact layout (see utils.ts).
 * We deliberately use only codes 0-25 — the range supported by
 * `serializeAttestationData` — encoding pubkeys and hashes as base58/hex
 * strings (code 12) so attestation data round-trips reliably.
 */

/** Compact type codes used in SAS schema layouts. */
export const LAYOUT = {
  U8: 0,
  U16: 1,
  U32: 2,
  U64: 3,
  U128: 4,
  I64: 8,
  BOOL: 10,
  STRING: 12,
} as const;

export interface SchemaDefinition<T = unknown> {
  name: string;
  version: number;
  description: string;
  /** Field names in declaration order. */
  fieldNames: string[];
  /** SAS compact layout codes, parallel to `fieldNames`. */
  layout: number[];
  /** Phantom marker for the TypeScript shape this schema serialises. */
  readonly __data?: T;
}

// ─── Agent Identity ───────────────────────────────────────────────────────────

/** On-chain identity record for a confidential agent. */
export interface AgentIdentityData {
  agent_id: string;
  owner: string;
  tee_signing_key: string;
  tee_encryption_key: string;
  /** SGX/TDX measurement (MRENCLAVE hex). */
  measurement: string;
  model: string;
  provider: string;
  created_at: bigint;
  is_attested: boolean;
}

export const AGENT_IDENTITY_SCHEMA: SchemaDefinition<AgentIdentityData> = {
  name: "DarkAgentIdentity",
  version: 1,
  description: "TEE-attested confidential agent identity bound to an owner wallet",
  fieldNames: [
    "agent_id",
    "owner",
    "tee_signing_key",
    "tee_encryption_key",
    "measurement",
    "model",
    "provider",
    "created_at",
    "is_attested",
  ],
  layout: [
    LAYOUT.STRING, // agent_id
    LAYOUT.STRING, // owner
    LAYOUT.STRING, // tee_signing_key
    LAYOUT.STRING, // tee_encryption_key
    LAYOUT.STRING, // measurement
    LAYOUT.STRING, // model
    LAYOUT.STRING, // provider
    LAYOUT.U64,    // created_at
    LAYOUT.BOOL,   // is_attested
  ],
};

// ─── Inference Receipt ────────────────────────────────────────────────────────

/** On-chain receipt for a single paid, confidential inference call. */
export interface InferenceReceiptData {
  agent_id: string;
  /** SHA-256 of the encrypted prompt (hex). */
  request_hash: string;
  /** SHA-256 of the encrypted response (hex). */
  response_hash: string;
  amount_paid: bigint;
  /** Mint address of the asset used for payment (e.g. USDC). */
  pay_asset: string;
  network: string;
  timestamp: bigint;
  confidential: boolean;
}

export const INFERENCE_RECEIPT_SCHEMA: SchemaDefinition<InferenceReceiptData> = {
  name: "DarkInferenceReceipt",
  version: 1,
  description: "Proof that a confidential inference was paid for via x402",
  fieldNames: [
    "agent_id",
    "request_hash",
    "response_hash",
    "amount_paid",
    "pay_asset",
    "network",
    "timestamp",
    "confidential",
  ],
  layout: [
    LAYOUT.STRING, // agent_id
    LAYOUT.STRING, // request_hash
    LAYOUT.STRING, // response_hash
    LAYOUT.U64,    // amount_paid
    LAYOUT.STRING, // pay_asset
    LAYOUT.STRING, // network
    LAYOUT.U64,    // timestamp
    LAYOUT.BOOL,   // confidential
  ],
};

// ─── Agent Router Schema ──────────────────────────────────────────────────────

/** Registration record for a routable agent endpoint (used by AgentRouter). */
export interface AgentRouterData {
  agent_id: string;
  /** JSON-encoded capabilities list, e.g. '["trading","analysis"]'. */
  capabilities: string;
  /** HTTP/WebSocket endpoint URL. */
  endpoint: string;
  /** Base58 pubkey of the agent's on-chain wallet. */
  wallet_pubkey: string;
  registered_at: bigint;
  is_active: boolean;
}

export const AGENT_ROUTER_SCHEMA: SchemaDefinition<AgentRouterData> = {
  name: "DarkAgentRouter",
  version: 1,
  description: "Routable confidential-agent endpoint registered with Dark Protocol",
  fieldNames: [
    "agent_id",
    "capabilities",
    "endpoint",
    "wallet_pubkey",
    "registered_at",
    "is_active",
  ],
  layout: [
    LAYOUT.STRING, // agent_id
    LAYOUT.STRING, // capabilities (JSON)
    LAYOUT.STRING, // endpoint
    LAYOUT.STRING, // wallet_pubkey
    LAYOUT.U64,    // registered_at
    LAYOUT.BOOL,   // is_active
  ],
};

// ─── Registry ────────────────────────────────────────────────────────────────

export const DARK_SCHEMAS = {
  agentIdentity: AGENT_IDENTITY_SCHEMA,
  inferenceReceipt: INFERENCE_RECEIPT_SCHEMA,
  agentRouter: AGENT_ROUTER_SCHEMA,
} as const;
