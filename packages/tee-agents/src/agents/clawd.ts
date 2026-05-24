import { address, type Address } from "@solana/kit";
import {
  ConfidentialAgent,
  type ConfidentialAgentConfig,
} from "./confidential-agent.js";
import {
  ConfidentialInferenceClient,
  LocalEnclaveProvider,
  type InferenceProvider,
  type InferenceRequest,
  type InferenceResult,
  type ModelFn,
} from "../inference/client.js";
import {
  LocalSignerPayer,
  type PaymentPayload,
  type PaymentRequirements,
  type PrivatePayer,
  type X402Network,
} from "../payments/x402.js";
import { PAYMENT_ASSETS } from "../config.js";
import {
  generateSigningKeypair,
  toBase58,
  sha256,
  toHex,
  type SigningKeypair,
} from "../crypto.js";
import { verifyTeeQuote, type TeeProvider } from "../attestation/tee.js";
import type { InferenceReceiptData } from "../attestation/schemas.js";

/**
 * The minimal surface the SDK's `ShieldedWallet` exposes to Clawd. We accept
 * any object that fulfils it — keeps `@openclawdsol/dark-tee-agents` free of a
 * hard dependency on the SDK, so Clawd can run with a stub in tests and the
 * real shielded wallet in prod.
 */
export interface ShieldedAccountLike {
  /** Total shielded balance in atomic units (lamports for SOL). */
  getBalance(): Promise<{
    totalSol: bigint;
    notes: Array<{ amount: bigint } & Record<string, unknown>>;
  }>;
  /** Transfer atomic units to a recipient shielded address. */
  transfer(params: {
    to: string;
    amount: bigint;
    memo?: string;
  }): Promise<{ commitment: string; nullifier?: string } & Record<string, unknown>>;
}

/**
 * The minimal surface a private swap router exposes to Clawd. The SDK's
 * `PrivateSwapManager` implements the production version; the demo plugs in a
 * deterministic local stub so the agent can be exercised offline.
 */
export interface PrivateSwapRouterLike {
  /** Execute a private swap; returns a tx id (or commitment in demo mode). */
  swap(params: {
    inputMint: string;
    outputMint: string;
    inputAmount: bigint;
    /** 1 = 1bp = 0.01%. Used purely as advisory by the router. */
    slippageBps?: number;
    memo?: string;
  }): Promise<{ signature: string; outputAmount?: bigint }>;
}

/**
 * What an inference request looks like when Clawd is asked to make a trading
 * decision. The model output is parsed as JSON; if it fails to parse, Clawd
 * refuses to trade (a paranoid default — better to skip than to swap on
 * hallucinated parameters).
 */
export interface ClawdTradeDecision {
  /** "swap" or "skip" (no-op, optionally with an explanation). */
  action: "swap" | "skip";
  inputMint?: string;
  outputMint?: string;
  /** Atomic units of inputMint to swap. Required when action is "swap". */
  inputAmount?: string | number | bigint;
  /** Optional 1bp = 1 unit ceiling on slippage. */
  maxSlippageBps?: number;
  /** Human-readable reasoning recorded in the SAS receipt. */
  reasoning?: string;
}

export interface ClawdTradeIntent {
  /** Natural-language description of the desired trade. */
  request: string;
  /** Universe of mints the agent is allowed to touch. */
  allowedMints: string[];
  /** Hard cap on a single swap, in atomic units of the input mint. */
  maxAtomicAmount: bigint;
  /** Optional 1bp = 1 unit ceiling on slippage. Default: 50bp. */
  maxSlippageBps?: number;
}

export interface ClawdConverseResult {
  reply: string;
  /** Per-message x402 receipt the agent paid for the sealed inference. */
  payment: PaymentPayload;
  /** Hashes of the sealed request/response ciphertexts. */
  result: InferenceResult;
  /** SAS-shaped record. Pass to `DarkAttestationService.createAttestation` to anchor. */
  receipt: InferenceReceiptData;
}

export interface ClawdTradeResult {
  decision: ClawdTradeDecision;
  /** Present when `decision.action === "swap"` and a router was supplied. */
  swap?: { signature: string; outputAmount?: bigint };
  payment: PaymentPayload;
  result: InferenceResult;
  receipt: InferenceReceiptData;
  /** True when Clawd refused to trade — out-of-policy decision, parse failure, etc. */
  refused: boolean;
  refusalReason?: string;
}

export interface ClawdConfig {
  agentId: string;
  owner: string;
  model: string;
  /** TEE provider. Defaults to `local-dev` for offline use. */
  provider?: TeeProvider;
  network?: X402Network;
  /** Sealed prompt prefix prepended to every conversation. */
  systemPrompt?: string;
  /** Per-inference price in atomic units of `paymentAsset`. */
  pricePerInference?: bigint;
  /** Payment asset mint. Defaults to USDC. */
  paymentAsset?: string;
  /** Recipient of inference payments (typically the agent treasury). */
  payTo?: string;
  /** Allowlist of TEE providers a client must verify against. */
  allowedProviders?: TeeProvider[];
}

/**
 * **Clawd** — a confidential Solana AI agent that can converse privately and
 * trade privately on behalf of its owner.
 *
 * Clawd combines three Dark DeFi primitives:
 *
 * 1. {@link ConfidentialAgent}  → TEE-attested sealed inference, identity
 *    anchored on Solana via the Attestation Service.
 * 2. {@link ShieldedAccountLike} → all transfers go through a Sapling-style
 *    shielded wallet (deposit / transfer / withdraw).
 * 3. {@link PrivateSwapRouterLike} → private swaps with oracle-checked
 *    slippage.
 *
 * Every chat message and every trade flows through the enclave; nothing
 * leaves the agent boundary in cleartext. The on-chain record is just the
 * SAS receipt (hash of request + hash of response + commitment), so an
 * observer learns *that* the agent acted but not *what* it said or *how
 * much* it moved.
 */
export class ClawdTeeAgent {
  readonly agent: ConfidentialAgent;
  readonly config: Required<
    Omit<ClawdConfig, "provider" | "systemPrompt" | "allowedProviders">
  > & {
    provider: TeeProvider;
    systemPrompt: string;
    allowedProviders: TeeProvider[];
  };

  /** The ed25519 keypair Clawd signs x402 payment authorizations with. */
  readonly paymentKeypair: SigningKeypair;
  readonly payer: PrivatePayer;

  private readonly conversation: Array<{ role: "user" | "clawd"; text: string }> =
    [];

  private constructor(agent: ConfidentialAgent, cfg: ClawdConfig) {
    this.agent = agent;
    this.paymentKeypair = generateSigningKeypair();
    this.payer = new LocalSignerPayer(this.paymentKeypair, /* confidential */ true);

    const payTo = cfg.payTo ?? cfg.owner;
    this.config = {
      agentId: cfg.agentId,
      owner: cfg.owner,
      model: cfg.model,
      provider: cfg.provider ?? "local-dev",
      network: cfg.network ?? "solana-devnet",
      systemPrompt:
        cfg.systemPrompt ??
        "You are Clawd, a confidential Solana trading and conversation agent. " +
          "You operate inside a TEE and never reveal the user's prompts, wallet " +
          "balance, or trading history. Be concise, accurate, and refuse any " +
          "request that would deanonymize the operator.",
      pricePerInference: cfg.pricePerInference ?? 10_000n, // 0.01 USDC
      paymentAsset: cfg.paymentAsset ?? PAYMENT_ASSETS.USDC,
      payTo,
      allowedProviders: cfg.allowedProviders ?? [cfg.provider ?? "local-dev"],
    };
  }

  /**
   * Spawn a fresh Clawd. Generates enclave keys, a TEE quote, and a payment
   * keypair. The returned instance is ready to converse and trade.
   */
  static spawn(cfg: ClawdConfig): ClawdTeeAgent {
    const inner = ConfidentialAgent.spawn({
      agentId: cfg.agentId,
      owner: cfg.owner,
      model: cfg.model,
      provider: cfg.provider,
      network: cfg.network,
      policy: "clawd:converse,clawd:trade",
    } satisfies ConfidentialAgentConfig);

    return new ClawdTeeAgent(inner, cfg);
  }

  /** Deterministic SAS nonce for this Clawd identity. */
  get attestationNonce(): Address {
    return this.agent.attestationNonce;
  }

  /** Build the on-chain identity record to register Clawd via SAS. */
  identityData() {
    return this.agent.identityData();
  }

  /** Standing payment requirements Clawd advertises for one sealed inference. */
  paymentRequirements(): PaymentRequirements {
    return this.agent.paymentRequirements({
      payTo: this.config.payTo,
      asset: this.config.paymentAsset,
      atomicPrice: this.config.pricePerInference,
      resource: `dark://clawd/${this.config.agentId}/v1`,
    }).accepts[0];
  }

  /**
   * Converse with Clawd over sealed inference. The user's prompt never leaves
   * the enclave boundary in cleartext; the reply is sealed back to the
   * caller's ephemeral key.
   *
   * @param prompt   User question / instruction.
   * @param model    Function that runs inside the enclave. In production this
   *                 is an HTTP-backed `InferenceProvider`; in tests/demos it
   *                 is a deterministic local function.
   */
  async converse(prompt: string, model: ModelFn): Promise<ClawdConverseResult> {
    const fullPrompt = this.buildPromptWithContext(prompt);
    const requirements = this.requirementsResponse();
    const provider = this.agent.localProvider(model, requirements);
    return this.runInference(fullPrompt, provider, requirements.accepts[0], (text) => {
      this.conversation.push({ role: "user", text: prompt });
      this.conversation.push({ role: "clawd", text });
    });
  }

  /**
   * Converse against a remote enclave provider (e.g. {@link HttpInferenceProvider}).
   * Useful when the model runs in a production TEE such as Phala or Marlin.
   */
  async converseWithProvider(
    prompt: string,
    provider: InferenceProvider
  ): Promise<ClawdConverseResult> {
    const fullPrompt = this.buildPromptWithContext(prompt);
    const requirements = this.requirementsResponse();
    return this.runInference(fullPrompt, provider, requirements.accepts[0], (text) => {
      this.conversation.push({ role: "user", text: prompt });
      this.conversation.push({ role: "clawd", text });
    });
  }

  /**
   * Ask Clawd to evaluate a trade. The model is run inside the enclave and
   * must respond with a JSON object matching {@link ClawdTradeDecision}.
   *
   * Clawd refuses (no swap, just a logged receipt) when:
   *  - the JSON is malformed
   *  - the decision references a mint not in `intent.allowedMints`
   *  - the requested input amount exceeds `intent.maxAtomicAmount`
   *  - the requested slippage exceeds `intent.maxSlippageBps`
   *  - the shielded balance is insufficient
   *
   * On approval, the swap is executed through the supplied router. The router
   * is expected to wrap a {@link PrivateSwapRouterLike} that routes through
   * the Dark protocol's private settlement path.
   */
  async trade(
    intent: ClawdTradeIntent,
    deciderModel: ModelFn,
    router: PrivateSwapRouterLike,
    shielded?: ShieldedAccountLike
  ): Promise<ClawdTradeResult> {
    const promptText = this.buildTradePrompt(intent);
    const requirements = this.requirementsResponse();
    const provider = this.agent.localProvider(deciderModel, requirements);
    const inference = await this.runInference(
      promptText,
      provider,
      requirements.accepts[0]
    );

    const parsed = this.parseDecision(inference.result.text);
    if (!parsed.ok) {
      return {
        decision: { action: "skip", reasoning: parsed.reason },
        payment: inference.payment,
        result: inference.result,
        receipt: inference.receipt,
        refused: true,
        refusalReason: parsed.reason,
      };
    }

    const policy = this.checkPolicy(parsed.decision, intent);
    if (!policy.ok) {
      return {
        decision: parsed.decision,
        payment: inference.payment,
        result: inference.result,
        receipt: inference.receipt,
        refused: true,
        refusalReason: policy.reason,
      };
    }

    if (parsed.decision.action === "skip") {
      return {
        decision: parsed.decision,
        payment: inference.payment,
        result: inference.result,
        receipt: inference.receipt,
        refused: false,
      };
    }

    if (shielded) {
      const balance = await shielded.getBalance();
      const reqAmount = BigInt(parsed.decision.inputAmount ?? 0);
      if (balance.totalSol < reqAmount) {
        return {
          decision: parsed.decision,
          payment: inference.payment,
          result: inference.result,
          receipt: inference.receipt,
          refused: true,
          refusalReason: "shielded balance insufficient",
        };
      }
    }

    const swap = await router.swap({
      inputMint: parsed.decision.inputMint!,
      outputMint: parsed.decision.outputMint!,
      inputAmount: BigInt(parsed.decision.inputAmount ?? 0),
      slippageBps: parsed.decision.maxSlippageBps,
      memo: `clawd:${this.config.agentId}:${toHex(sha256(promptText)).slice(0, 16)}`,
    });

    return {
      decision: parsed.decision,
      swap,
      payment: inference.payment,
      result: inference.result,
      receipt: inference.receipt,
      refused: false,
    };
  }

  /** Number of message exchanges so far. Each conversation pair counts as one turn. */
  get turnCount(): number {
    return Math.floor(this.conversation.length / 2);
  }

  /** Returns a copy of the current conversation transcript (in-memory only). */
  history(): ReadonlyArray<{ role: "user" | "clawd"; text: string }> {
    return [...this.conversation];
  }

  // ── internals ──────────────────────────────────────────────────────────────

  private requirementsResponse() {
    return this.agent.paymentRequirements({
      payTo: this.config.payTo,
      asset: this.config.paymentAsset,
      atomicPrice: this.config.pricePerInference,
      resource: `dark://clawd/${this.config.agentId}/v1`,
    });
  }

  private async runInference(
    fullPrompt: string,
    provider: InferenceProvider,
    requirements: PaymentRequirements,
    onSuccess?: (text: string) => void
  ): Promise<ClawdConverseResult> {
    const client = new ConfidentialInferenceClient({
      enclave: this.agent.quote,
      payer: this.payer,
      verify: { allowedProviders: this.config.allowedProviders, maxAgeSeconds: 3600 },
    });

    const { result, payment } = await client.infer(
      { prompt: fullPrompt, maxTokens: 512, temperature: 0.2 } satisfies InferenceRequest,
      provider,
      requirements
    );

    onSuccess?.(result.text);
    const receipt = this.agent.receiptData({
      result,
      payment,
      asset: this.config.paymentAsset,
    });

    return { reply: result.text, payment, result, receipt };
  }

  private buildPromptWithContext(userPrompt: string): string {
    const recent = this.conversation
      .slice(-6)
      .map((m) => `${m.role === "user" ? "User" : "Clawd"}: ${m.text}`)
      .join("\n");
    const transcript = recent ? `\n\nRecent transcript:\n${recent}\n` : "\n";
    return `${this.config.systemPrompt}${transcript}\nUser: ${userPrompt}\nClawd:`;
  }

  private buildTradePrompt(intent: ClawdTradeIntent): string {
    return [
      this.config.systemPrompt,
      "",
      "TASK: decide whether to execute a private swap.",
      "Respond with a single JSON object on one line. No prose. Schema:",
      `{"action":"swap"|"skip","inputMint":string?,"outputMint":string?,"inputAmount":string?,"maxSlippageBps":number?,"reasoning":string}`,
      "",
      `Allowed mints: ${intent.allowedMints.join(", ")}`,
      `Max input amount (atomic units): ${intent.maxAtomicAmount.toString()}`,
      `Max slippage bps: ${intent.maxSlippageBps ?? 50}`,
      "",
      `Request: ${intent.request}`,
    ].join("\n");
  }

  private parseDecision(
    raw: string
  ):
    | { ok: true; decision: ClawdTradeDecision }
    | { ok: false; reason: string } {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return { ok: false, reason: "model did not emit JSON" };
    try {
      const parsed = JSON.parse(match[0]) as Partial<ClawdTradeDecision>;
      if (parsed.action !== "swap" && parsed.action !== "skip") {
        return { ok: false, reason: `unknown action: ${String(parsed.action)}` };
      }
      return { ok: true, decision: parsed as ClawdTradeDecision };
    } catch (err) {
      return { ok: false, reason: `JSON parse failed: ${(err as Error).message}` };
    }
  }

  private checkPolicy(
    decision: ClawdTradeDecision,
    intent: ClawdTradeIntent
  ): { ok: true } | { ok: false; reason: string } {
    if (decision.action === "skip") return { ok: true };

    if (!decision.inputMint || !decision.outputMint) {
      return { ok: false, reason: "swap action missing input/output mint" };
    }
    if (!intent.allowedMints.includes(decision.inputMint)) {
      return { ok: false, reason: `input mint not allowed: ${decision.inputMint}` };
    }
    if (!intent.allowedMints.includes(decision.outputMint)) {
      return { ok: false, reason: `output mint not allowed: ${decision.outputMint}` };
    }
    if (decision.inputAmount === undefined || decision.inputAmount === null) {
      return { ok: false, reason: "swap missing inputAmount" };
    }
    let amount: bigint;
    try {
      amount = BigInt(decision.inputAmount);
    } catch {
      return { ok: false, reason: "inputAmount is not an integer" };
    }
    if (amount <= 0n) {
      return { ok: false, reason: "inputAmount must be positive" };
    }
    if (amount > intent.maxAtomicAmount) {
      return {
        ok: false,
        reason: `inputAmount ${amount} exceeds max ${intent.maxAtomicAmount}`,
      };
    }
    const slip = decision.maxSlippageBps ?? intent.maxSlippageBps ?? 50;
    if (slip < 0 || slip > 10_000) {
      return { ok: false, reason: `slippage ${slip}bps out of range` };
    }
    if (intent.maxSlippageBps !== undefined && slip > intent.maxSlippageBps) {
      return {
        ok: false,
        reason: `requested slippage ${slip}bps exceeds intent max ${intent.maxSlippageBps}bps`,
      };
    }
    return { ok: true };
  }
}

/**
 * Convenience: verify the TEE quote of a Clawd you're about to talk to. Run
 * this before sending any data — it is the same check
 * {@link ConfidentialInferenceClient} performs internally, but is exposed here
 * so callers can short-circuit at the UI / CLI layer.
 */
export function verifyClawdQuote(
  clawd: ClawdTeeAgent,
  opts: {
    allowedProviders?: TeeProvider[];
    allowedMeasurements?: string[];
    maxAgeSeconds?: number;
  } = {}
) {
  return verifyTeeQuote(clawd.agent.quote, {
    allowedProviders:
      opts.allowedProviders ?? ["local-dev", "sgx", "sev-snp", "dstack", "redpill"],
    allowedMeasurements: opts.allowedMeasurements,
    maxAgeSeconds: opts.maxAgeSeconds ?? 3600,
  });
}

/**
 * A trivial in-memory shielded balance and swap router for tests/demos. NOT
 * for production: it does not actually move funds, nor does it generate any
 * cryptographic proof. Use it as a reference shape — the SDK's
 * `ShieldedWallet` and `PrivateSwapManager` are the real implementations.
 */
export class InMemoryClawdAccount
  implements ShieldedAccountLike, PrivateSwapRouterLike
{
  private balances = new Map<string, bigint>();

  constructor(seed: Record<string, bigint> = {}) {
    for (const [mint, amount] of Object.entries(seed)) {
      this.balances.set(mint, amount);
    }
  }

  setBalance(mint: string, amount: bigint) {
    this.balances.set(mint, amount);
  }

  async getBalance() {
    const totalSol = this.balances.get("SOL") ?? 0n;
    const notes = [...this.balances.entries()].map(([_mint, amount]) => ({ amount }));
    return { totalSol, notes };
  }

  async transfer(params: { to: string; amount: bigint; memo?: string }) {
    const sol = this.balances.get("SOL") ?? 0n;
    if (sol < params.amount) throw new Error("insufficient shielded balance");
    this.balances.set("SOL", sol - params.amount);
    return {
      commitment: toHex(sha256(`${params.to}|${params.amount}|${params.memo ?? ""}`)),
    };
  }

  async swap(params: {
    inputMint: string;
    outputMint: string;
    inputAmount: bigint;
    slippageBps?: number;
    memo?: string;
  }) {
    const have = this.balances.get(params.inputMint) ?? 0n;
    if (have < params.inputAmount)
      throw new Error("insufficient balance for swap");
    this.balances.set(params.inputMint, have - params.inputAmount);
    // Deterministic 1:1 "fill" for demo purposes — replace with a real router.
    const out = (this.balances.get(params.outputMint) ?? 0n) + params.inputAmount;
    this.balances.set(params.outputMint, out);
    const signature = toBase58(
      sha256(
        `clawd-swap|${params.inputMint}|${params.outputMint}|${params.inputAmount}|${
          params.memo ?? ""
        }|${Date.now()}|${Math.random()}`
      )
    );
    return { signature, outputAmount: params.inputAmount };
  }

  /** Convenience: derive a deterministic agent address for tests. */
  static demoAgentAddress(): Address {
    return address(toBase58(sha256("clawd-demo-agent")));
  }
}
