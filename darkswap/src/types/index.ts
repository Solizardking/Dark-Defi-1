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
  status: "idle" | "loading" | "quoting" | "validating" | "ready" | "swapping" | "success" | "error";
  error: string | null;
  txSignature: string | null;
}

export interface QuoteApiResponse {
  quote: SwapQuote;
  oracle: OracleValidation;
  safety: SafetyCheck;
}
