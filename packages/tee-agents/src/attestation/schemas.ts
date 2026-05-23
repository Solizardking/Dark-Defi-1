/**
 * SAS schema definitions for the Dark confidential-agent stack.
 *
 * Layout codes follow the SAS compact layout (see the service's data-type
 * table). We deliberately use only codes 0-25 — the range the official
 * `serializeAttestationData` helper supports — encoding pubkeys and hashes as
 * base58/hex strings (code 12) so attestation data round-trips reliably.
 */

export interface SchemaDefinition<T> {
  name: string;
  version: number;
  description: string;
  /** Field names in declaration order. */
  fieldNames: string[];
  /** SAS compact layout codes, parallel to {@link fieldNames}. */
  layout: number[];
  /** Phantom marker for the TS shape this schema serializes. */
  readonly __data?: T;
}

const LAYOUT = {
  U64: 3,
  BOOL: 10,
  STRING: 12,
} as const;

/** On-chain identity record for a confidential agent. */
export interface AgentIdentityData {
  agent_id: string;
  owner: string;
  tee_signing_key: string;
  tee_encryption_key: string;
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
    LAYOUT.STRING,
    LAYOUT.STRING,
    LAYOUT.STRING,
    LAYOUT.STRING,
    LAYOUT.STRING,
    LAYOUT.STRING,
    LAYOUT.STRING,
    LAYOUT.U64,
    LAYOUT.BOOL,
  ],
};

/** On-chain receipt for a single paid, confidential inference call. */
export interface InferenceReceiptData {
  agent_id: string;
  request_hash: string;
  response_hash: string;
  amount_paid: bigint;
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
    LAYOUT.STRING,
    LAYOUT.STRING,
    LAYOUT.STRING,
    LAYOUT.U64,
    LAYOUT.STRING,
    LAYOUT.STRING,
    LAYOUT.U64,
    LAYOUT.BOOL,
  ],
};

export const DARK_SCHEMAS = {
  agentIdentity: AGENT_IDENTITY_SCHEMA,
  inferenceReceipt: INFERENCE_RECEIPT_SCHEMA,
} as const;
