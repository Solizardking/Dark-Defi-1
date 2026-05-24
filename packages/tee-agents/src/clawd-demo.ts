/**
 * Offline demo of the Clawd TEE Agent — the world's first private Solana AI
 * agent that converses privately and trades privately.
 *
 *   spawn enclave → SAS attest → sealed converse → sealed trade decision →
 *   policy check → private swap → on-chain receipt
 *
 * Run with:  npm run clawd:demo
 */
import { address } from "@solana/kit";
import {
  ClawdTeeAgent,
  InMemoryClawdAccount,
  verifyClawdQuote,
  DarkAttestationService,
  PAYMENT_ASSETS,
  generateSigningKeypair,
  toBase58,
  type ModelFn,
} from "./index.js";

const c = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  green: "\x1b[38;5;47m",
  cyan: "\x1b[38;5;51m",
  magenta: "\x1b[38;5;201m",
  yellow: "\x1b[38;5;227m",
  red: "\x1b[38;5;203m",
  gray: "\x1b[38;5;245m",
};
const paint = (color: string, s: string) => `${color}${s}${c.reset}`;
const ok = (s: string) => paint(c.green, `  ✓ ${s}`);
const info = (k: string, v: string) =>
  `    ${paint(c.gray, k.padEnd(20))} ${v}`;

const banner = `
${c.magenta}╔══════════════════════════════════════════════════════════════════╗
║   ${c.cyan}🦞  CLAWD TEE AGENT  ·  Private Solana AI${c.magenta}                          ║
║   ${c.gray}converse sealed · trade shielded · attest on-chain${c.magenta}                ║
╚══════════════════════════════════════════════════════════════════╝${c.reset}
`;

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function spinner(label: string, ms = 350) {
  const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  const start = Date.now();
  let i = 0;
  while (Date.now() - start < ms) {
    process.stdout.write(
      `\r  ${paint(c.magenta, frames[i++ % frames.length])} ${paint(c.gray, label)}`
    );
    await sleep(60);
  }
  process.stdout.write(`\r${ok(label)}\n`);
}

const SOL_MINT = "So11111111111111111111111111111111111111112";
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

export async function runClawdDemo() {
  console.log(banner);

  // 1. Owner wallet (a real deployment would use a hardware wallet).
  const ownerKp = generateSigningKeypair();
  const owner = address(toBase58(ownerKp.publicKey));

  // 2. Spawn Clawd inside a (mock) enclave.
  await spinner("Spawning Clawd inside TEE enclave");
  const clawd = ClawdTeeAgent.spawn({
    agentId: "clawd-alpha",
    owner,
    model: "dstack/claude-opus-tee",
    network: "solana-devnet",
    pricePerInference: 10_000n, // 0.01 USDC
    paymentAsset: PAYMENT_ASSETS.USDC,
  });
  console.log(info("agent", clawd.config.agentId));
  console.log(info("model", clawd.config.model));
  console.log(info("provider", clawd.agent.quote.provider));
  console.log(
    info("measurement", clawd.agent.quote.measurement.slice(0, 32) + "…")
  );

  // 3. Verify Clawd's quote (what a client does before opening the channel).
  await spinner("Verifying Clawd's TEE quote");
  const v = verifyClawdQuote(clawd, { allowedProviders: ["local-dev"] });
  console.log(
    info(
      "quote valid",
      v.valid ? paint(c.green, "true") : paint(c.red, v.reasons.join("; "))
    )
  );

  // 4. Show the SAS attestation Clawd would publish for its identity.
  await spinner("Deriving Solana Attestation Service PDAs");
  const sas = DarkAttestationService.fromNetwork("devnet");
  const credential = await sas.credentialPda(owner);
  console.log(info("credential", credential));
  console.log(
    paint(
      c.dim,
      "    (call sas.createAttestation with a funded signer to anchor Clawd on-chain)"
    )
  );

  // 5. Private conversation — sealed prompt, sealed reply, paid via x402.
  console.log("\n" + paint(c.cyan, "  ▸ Private conversation"));
  const converseModel: ModelFn = (req) => {
    if (/portfolio|balance/i.test(req.prompt)) {
      return "Your shielded balance and recent activity are confidential. As your TEE-attested agent I can analyze them locally and return insights without ever revealing the underlying state to the host.";
    }
    return "Acknowledged. I will keep this exchange sealed end-to-end and write only the redacted SAS receipt on-chain.";
  };
  const turn1 = await clawd.converse(
    "Hi Clawd, how do you keep my data private?",
    converseModel
  );
  console.log(info("payment scheme", turn1.payment.scheme));
  console.log(info("amount", "commitment " + turn1.payment.payload.value.slice(0, 16) + "…"));
  console.log(info("request hash", turn1.result.requestHash.slice(0, 24) + "…"));
  console.log(info("response hash", turn1.result.responseHash.slice(0, 24) + "…"));
  console.log("\n  " + paint(c.green, "Clawd: ") + turn1.reply);

  // 6. Trade decision — same sealed-inference pipeline, model returns JSON.
  console.log("\n" + paint(c.cyan, "  ▸ Private trade decision"));
  const tradeModel: ModelFn = (req) => {
    const swap = /swap|rotate|usdc/i.test(req.prompt);
    return swap
      ? JSON.stringify({
          action: "swap",
          inputMint: SOL_MINT,
          outputMint: USDC_MINT,
          inputAmount: "500000000", // 0.5 SOL in lamports
          maxSlippageBps: 25,
          reasoning:
            "Reduce SOL exposure by 0.5 into USDC while preserving privacy via shielded route.",
        })
      : JSON.stringify({
          action: "skip",
          reasoning: "Conditions not favourable, hold position.",
        });
  };

  const account = new InMemoryClawdAccount({
    SOL: 2_000_000_000n, // 2 SOL shielded
    [USDC_MINT]: 0n,
    [SOL_MINT]: 2_000_000_000n,
  });

  const trade = await clawd.trade(
    {
      request:
        "I want to rotate 0.5 SOL into USDC privately while keeping slippage tight.",
      allowedMints: [SOL_MINT, USDC_MINT],
      maxAtomicAmount: 1_000_000_000n, // 1 SOL ceiling
      maxSlippageBps: 50,
    },
    tradeModel,
    account,
    account
  );

  console.log(
    info(
      "decision",
      trade.decision.action +
        (trade.refused ? paint(c.red, "  [REFUSED]") : paint(c.green, "  [OK]"))
    )
  );
  if (trade.refused) {
    console.log(info("refusal", trade.refusalReason ?? "(unknown)"));
  } else if (trade.swap) {
    console.log(info("swap signature", trade.swap.signature.slice(0, 24) + "…"));
    console.log(info("out amount", String(trade.swap.outputAmount)));
  }
  console.log(info("reasoning", trade.decision.reasoning ?? "(none)"));

  // 7. Show how the trade flows to an on-chain SAS receipt.
  console.log(
    "\n" + paint(c.yellow, "  ▸ SAS inference receipt (anchor on-chain via sas.createAttestation):")
  );
  console.log(
    paint(
      c.gray,
      "  " +
        JSON.stringify(trade.receipt, bigintReplacer, 2).replace(/\n/g, "\n  ")
    )
  );

  console.log(
    "\n" +
      paint(
        c.magenta,
        "  🦞 Clawd — sealed thoughts, shielded trades. The lobster's shell stays closed."
      ) +
      "\n"
  );
}

function bigintReplacer(_k: string, value: unknown) {
  return typeof value === "bigint" ? value.toString() : value;
}

const invokedDirectly =
  process.argv[1] !== undefined && import.meta.url === `file://${process.argv[1]}`;
if (invokedDirectly) {
  runClawdDemo().catch((err) => {
    console.error(`${c.red}clawd demo failed:${c.reset}`, err);
    process.exit(1);
  });
}
