export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  tags?: string[];
}

export interface SwapQuote {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: "ExactIn" | "ExactOut";
  slippageBps: number;
  platformFee?: { amount: string; feeBps: number };
  priceImpactPct: string;
  routePlan: RoutePlan[];
  contextSlot?: number;
  timeTaken?: number;
}

export interface RoutePlan {
  swapInfo: {
    ammKey: string;
    label: string;
    inputMint: string;
    outputMint: string;
    inAmount: string;
    outAmount: string;
    feeAmount: string;
    feeMint: string;
  };
  percent: number;
}

export interface OraclePrice {
  mint: string;
  price: number;
  source: "birdeye" | "jupiter" | "fallback";
  timestamp: number;
  confidence?: number;
}

export interface OracleValidation {
  approved: boolean;
  deviation: number;
  inputOraclePrice: number | null;
  outputOraclePrice: number | null;
  jupiterRate: number;
  oracleRate: number;
  message: string;
}

export interface TokenRisk {
  mint: string;
  symbol: string;
  level: "low" | "medium" | "high" | "critical";
  warnings: string[];
  freezeAuthority: boolean;
  mintAuthority: boolean;
  lowLiquidity: boolean;
  recentlyCreated: boolean;
}

export interface SafetyCheck {
  safe: boolean;
  risks: TokenRisk[];
  overallLevel: "low" | "medium" | "high" | "critical";
}

export type SwapStatus = "idle" | "loading" | "quoting" | "validating" | "ready" | "swapping" | "success" | "error";
export type ProgressStep = "idle" | "quoting" | "signing" | "sending" | "confirming" | "success" | "error";

export interface SwapState {
  inputToken: Token | null;
  outputToken: Token | null;
  inputAmount: string;
  outputAmount: string;
  slippageBps: number;
  quote: SwapQuote | null;
  oracleValidation: OracleValidation | null;
  safetyCheck: SafetyCheck | null;
  privacyEnabled: boolean;
  oracleEnabled: boolean;
  safetyCheckEnabled: boolean;
  status: SwapStatus;
  error: string | null;
  txSignature: string | null;
}

export interface QuoteApiResponse {
  quote: SwapQuote;
  oracle: OracleValidation;
  safety: SafetyCheck;
}

// ── Shielded wallet types (Dark Protocol SDK) ────────────────────────────────

export type ShieldedNetwork = "devnet" | "mainnet";

export interface ShieldedNote {
  id: string;
  commitment: string;
  valueLamports: string;
  memo: string;
  recipient: string;
  nullifier: string;
  position: number;
  spent: boolean;
  slot: number;
  createdAt: number;
}

export interface ShieldedBalance {
  total: bigint;
  totalSol: string;
  notes: ShieldedNote[];
  spentCount: number;
}

export interface ViewingKeyExport {
  version: 1;
  network: ShieldedNetwork;
  fvk: string;
  ivk: string;
  ovk: string;
  defaultAddress: string;
  createdAt: number;
}

export interface DepositResult {
  noteId: string;
  commitment: string;
  amount: bigint;
  shieldedAddress: string;
  demoMode: true;
}

export interface TransferResult {
  noteId: string;
  commitment: string;
  nullifierSpent: string;
  amount: bigint;
  recipient: string;
  memo: string;
  demoMode: true;
}

export interface PaymentProof {
  version: 1;
  noteId: string;
  commitment: string;
  recipientAddress: string;
  amount: string;
  memo: string;
  slot: number;
  signature: string;
  createdAt: number;
}

// ── On-chain protocol types (Dark Protocol Anchor program) ───────────────────

export interface ProtocolState {
  authority: string;
  merkleRoot: number[];
  totalCommitments: bigint;
  paused: boolean;
}

export interface MerkleTreeAccount {
  root: number[];
  leafCount: number;
  depth: number;
}

export interface OnChainNote {
  commitment: number[];
  nullifierHash: number[];
  amount: bigint;
  tokenMint: string;
  encryptedMemo: number[];
  createdAt: bigint;
  spent: boolean;
  bump: number;
}
