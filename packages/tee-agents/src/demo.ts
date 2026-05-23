/**
 * End-to-end offline demo of the Dark TEE confidential-agent stack.
 *
 *   spawn enclave -> verify quote -> derive SAS PDAs -> x402 pay -> sealed
 *   inference -> on-chain receipt payload
 *
 * Runs with no network/keys: `npm run build && npm run demo -w @dark-protocol/tee-agents`.
 */
import { address } from "@solana/kit";
import {
  ConfidentialAgent,
  ConfidentialInferenceClient,
  DarkAttestationService,
  LocalSignerPayer,
  verifyTeeQuote,
  generateSigningKeypair,
  toBase58,
  PAYMENT_ASSETS,
  DARK_SCHEMAS,
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
const info = (k: string, v: string) => `    ${paint(c.gray, k.padEnd(18))} ${v}`;

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function spinner(label: string, ms = 500) {
  const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  const start = Date.now();
  let i = 0;
  while (Date.now() - start < ms) {
    process.stdout.write(`\r  ${paint(c.magenta, frames[i++ % frames.length])} ${paint(c.gray, label)}`);
    await sleep(60);
  }
  process.stdout.write(`\r${ok(label)}\n`);
}

const banner = `
${c.magenta}╔══════════════════════════════════════════════════════════════╗
║   ${c.cyan}🌑  DARK TEE AGENTS  ·  confidential AI on Solana${c.magenta}          ║
║   ${c.gray}attest → seal → pay (x402) → infer → receipt${c.magenta}                ║
╚══════════════════════════════════════════════════════════════╝${c.reset}
`;

export async function runDemo() {
  console.log(banner);

  // 1. Owner wallet (derived locally for the demo).
  const ownerKp = generateSigningKeypair();
  const owner = address(toBase58(ownerKp.publicKey));

  // 2. Spawn a confidential agent (generates enclave keys + TEE quote).
  await spinner("Spawning enclave + generating TEE quote");
  const agent = ConfidentialAgent.spawn({
    agentId: "dark-analyst-01",
    owner,
    model: "phala/deepseek-r1-70b-tee",
    policy: "swap:read,portfolio:analyze;maxAmount=1SOL",
    network: "solana-devnet",
  });
  console.log(info("agent", agent.config.agentId));
  console.log(info("model", agent.config.model));
  console.log(info("provider", agent.quote.provider));
  console.log(info("measurement", agent.quote.measurement.slice(0, 32) + "…"));
  console.log(info("tee enc key", agent.quote.encryptionPublicKey));

  // 3. Verify the quote (what a client does before sending any data).
  await spinner("Verifying TEE quote (measurement + signature)");
  const v = verifyTeeQuote(agent.quote, { allowedProviders: ["local-dev"], maxAgeSeconds: 3600 });
  console.log(info("quote valid", v.valid ? paint(c.green, "true") : paint(c.red, v.reasons.join("; "))));

  // 4. Derive the on-chain SAS addresses (pure crypto, offline).
  await spinner("Deriving Solana Attestation Service PDAs");
  const sas = DarkAttestationService.fromNetwork("devnet");
  const credential = await sas.credentialPda(owner);
  const schema = await sas.schemaPda(credential, DARK_SCHEMAS.agentIdentity);
  const attestation = await sas.attestationPda(credential, schema, agent.attestationNonce);
  console.log(info("credential", credential));
  console.log(info("schema", schema));
  console.log(info("attestation", attestation));
  console.log(paint(c.dim, "    (call sas.createCredential/createSchema/attest with a funded signer to write these)"));

  // 5. The on-chain identity record this agent would attest.
  console.log("\n" + paint(c.yellow, "  Agent identity attestation payload:"));
  console.log(paint(c.gray, "  " + JSON.stringify(agent.identityData(), bigintReplacer, 2).replace(/\n/g, "\n  ")));

  // 6. Confidential, paid inference.
  await spinner("Running sealed inference paid via x402 (dark-shielded)");
  const requirements = agent.paymentRequirements({
    payTo: owner,
    asset: PAYMENT_ASSETS.USDC,
    atomicPrice: 10_000n, // 0.01 USDC
  });

  const model: ModelFn = (req) =>
    `Analysis of "${req.prompt}": shielded SOL position is balanced; rotate 12% into eUSDC to reduce variance. (confidential)`;
  const provider = agent.localProvider(model, requirements);

  const payerKp = generateSigningKeypair();
  const payer = new LocalSignerPayer(payerKp, /* confidential */ true);

  const client = new ConfidentialInferenceClient({
    enclave: agent.quote,
    payer,
    verify: { allowedProviders: ["local-dev"] },
  });

  const { result, payment } = await client.infer(
    { prompt: "How should I rebalance my private portfolio?", maxTokens: 256 },
    provider,
    requirements.accepts[0]
  );

  console.log(info("payment scheme", payment.scheme + (payment.payload.confidential ? paint(c.magenta, "  [shielded]") : "")));
  console.log(info("amount", payment.payload.confidential ? paint(c.gray, "commitment " + payment.payload.value.slice(0, 16) + "…") : payment.payload.value));
  console.log(info("request hash", result.requestHash.slice(0, 24) + "…"));
  console.log(info("response hash", result.responseHash.slice(0, 24) + "…"));
  console.log("\n" + paint(c.cyan, "  Decrypted completion:"));
  console.log(paint(c.green, "  " + result.text));

  // 7. The on-chain receipt for this paid inference.
  const receipt = agent.receiptData({ result, payment, asset: PAYMENT_ASSETS.USDC });
  console.log("\n" + paint(c.yellow, "  Inference receipt attestation payload:"));
  console.log(paint(c.gray, "  " + JSON.stringify(receipt, bigintReplacer, 2).replace(/\n/g, "\n  ")));

  console.log("\n" + paint(c.magenta, "  🦞 attested · sealed · paid · private — the shell molts, the proof remains.") + "\n");
}

function bigintReplacer(_key: string, value: unknown) {
  return typeof value === "bigint" ? value.toString() : value;
}

const invokedDirectly =
  process.argv[1] !== undefined && import.meta.url === `file://${process.argv[1]}`;
if (invokedDirectly) {
  runDemo().catch((err) => {
    console.error(`${c.red}demo failed:${c.reset}`, err);
    process.exit(1);
  });
}
