#!/usr/bin/env node
/**
 * dark-tee — animated CLI for the Dark confidential-agent stack.
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
import { runDemo } from "./demo.js";

const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[38;5;47m",
  cyan: "\x1b[38;5;51m",
  magenta: "\x1b[38;5;201m",
  yellow: "\x1b[38;5;227m",
  gray: "\x1b[38;5;245m",
  red: "\x1b[38;5;203m",
};
const paint = (color: string, s: string) => `${color}${s}${C.reset}`;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const isTTY = process.stdout.isTTY ?? false;

// purple -> cyan gradient across a line
const GRADIENT = [201, 200, 199, 171, 135, 99, 63, 39, 45, 51];
function gradient(line: string): string {
  let out = "";
  for (let i = 0; i < line.length; i++) {
    const color = GRADIENT[Math.floor((i / Math.max(1, line.length)) * GRADIENT.length) % GRADIENT.length];
    out += `\x1b[38;5;${color}m${line[i]}`;
  }
  return out + C.reset;
}

const LOGO = [
  "  ██████╗  █████╗ ██████╗ ██╗  ██╗   ████████╗███████╗███████╗",
  "  ██╔══██╗██╔══██╗██╔══██╗██║ ██╔╝   ╚══██╔══╝██╔════╝██╔════╝",
  "  ██║  ██║███████║██████╔╝█████╔╝       ██║   █████╗  █████╗  ",
  "  ██║  ██║██╔══██║██╔══██╗██╔═██╗       ██║   ██╔══╝  ██╔══╝  ",
  "  ██████╔╝██║  ██║██║  ██║██║  ██╗      ██║   ███████╗███████╗",
  "  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝      ╚═╝   ╚══════╝╚══════╝",
];

async function boot() {
  if (isTTY) console.clear();
  for (const line of LOGO) {
    console.log(gradient(line));
    if (isTTY) await sleep(45);
  }
  console.log(paint(C.gray, "        confidential AI agents · TEE-attested · x402 private payments"));
  console.log(paint(C.dim, "        anchored by the Solana Attestation Service · 🦞 OpenClawd\n"));
}

async function spinner(label: string, ms = 550) {
  if (!isTTY) {
    console.log(paint(C.green, `  ✓ ${label}`));
    return;
  }
  const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  const start = Date.now();
  let i = 0;
  while (Date.now() - start < ms) {
    process.stdout.write(`\r  ${paint(C.magenta, frames[i++ % frames.length])} ${paint(C.gray, label)}`);
    await sleep(60);
  }
  process.stdout.write(`\r  ${paint(C.green, "✓")} ${label}${" ".repeat(8)}\n`);
}

const row = (k: string, v: string) => console.log(`    ${paint(C.gray, k.padEnd(16))} ${v}`);

function makeAgent(agentId: string, model: string) {
  const ownerKp = generateSigningKeypair();
  const owner = address(toBase58(ownerKp.publicKey));
  const agent = ConfidentialAgent.spawn({
    agentId,
    owner,
    model,
    policy: "swap:read,portfolio:analyze",
    network: "solana-devnet",
  });
  return { agent, owner };
}

async function cmdSpawn(agentId: string, model: string) {
  await spinner("Spawning enclave + generating TEE quote");
  const { agent, owner } = makeAgent(agentId, model);
  const v = verifyTeeQuote(agent.quote, { allowedProviders: ["local-dev"] });

  await spinner("Deriving Solana Attestation Service PDAs");
  const sas = DarkAttestationService.fromNetwork("devnet");
  const credential = await sas.credentialPda(owner);
  const schema = await sas.schemaPda(credential, DARK_SCHEMAS.agentIdentity);
  const attestation = await sas.attestationPda(credential, schema, agent.attestationNonce);

  console.log();
  row("agent", paint(C.cyan, agent.config.agentId));
  row("model", agent.config.model);
  row("owner", owner);
  row("measurement", agent.quote.measurement);
  row("tee enc key", agent.quote.encryptionPublicKey);
  row("quote valid", v.valid ? paint(C.green, "true") : paint(C.red, v.reasons.join("; ")));
  console.log();
  row("credential", credential);
  row("schema", schema);
  row("attestation", attestation);
  console.log(
    "\n" +
      paint(C.dim, "  write it on-chain: ") +
      paint(C.gray, "sas.createCredential → createSchema → attest(agent.identityData())")
  );
}

async function cmdInfer(prompt: string, agentId: string, model: string) {
  await spinner("Spawning + verifying enclave");
  const { agent, owner } = makeAgent(agentId, model);

  const requirements = agent.paymentRequirements({
    payTo: owner,
    asset: PAYMENT_ASSETS.USDC,
    atomicPrice: 10_000n,
  });
  const modelFn: ModelFn = (req) =>
    `[${agent.config.model}] ${req.prompt} → recommendation: keep 70% shielded, rotate the rest into eUSDC. (sealed)`;
  const provider = agent.localProvider(modelFn, requirements);
  const payer = new LocalSignerPayer(generateSigningKeypair(), true);
  const client = new ConfidentialInferenceClient({
    enclave: agent.quote,
    payer,
    verify: { allowedProviders: ["local-dev"] },
  });

  await spinner("Sealing prompt + paying via x402 (dark-shielded)");
  const { result, payment } = await client.infer({ prompt }, provider, requirements.accepts[0]);

  console.log();
  row("agent", paint(C.cyan, agent.config.agentId));
  row("payment", payment.scheme + (payment.payload.confidential ? paint(C.magenta, "  [shielded]") : ""));
  row("request hash", result.requestHash.slice(0, 32) + "…");
  console.log("\n" + paint(C.cyan, "  completion:"));
  console.log(paint(C.green, "  " + result.text) + "\n");
}

function help() {
  console.log(paint(C.bold, "  Usage: dark-tee <command> [args]\n"));
  const cmds: [string, string][] = [
    ["boot", "animated banner + overview"],
    ["demo", "full offline walkthrough (attest → pay → infer → receipt)"],
    ['spawn [id] [model]', "spawn a confidential agent, print identity + SAS PDAs"],
    ['infer "<prompt>" [id] [model]', "run one sealed, x402-paid inference locally"],
    ["help", "show this help"],
  ];
  for (const [cmd, desc] of cmds) {
    console.log(`  ${paint(C.cyan, cmd.padEnd(32))} ${paint(C.gray, desc)}`);
  }
  console.log();
}

async function main() {
  const [cmd, ...args] = process.argv.slice(2);
  switch (cmd) {
    case undefined:
    case "boot":
      await boot();
      help();
      break;
    case "demo":
      await boot();
      await runDemo();
      break;
    case "spawn":
      await boot();
      await cmdSpawn(args[0] ?? "dark-agent-01", args[1] ?? "phala/deepseek-r1-70b-tee");
      break;
    case "infer":
      await boot();
      await cmdInfer(
        args[0] ?? "Summarize my private portfolio risk.",
        args[1] ?? "dark-agent-01",
        args[2] ?? "phala/deepseek-r1-70b-tee"
      );
      break;
    case "help":
    case "-h":
    case "--help":
      help();
      break;
    default:
      console.error(paint(C.red, `  unknown command: ${cmd}`));
      help();
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(paint(C.red, "  dark-tee error:"), err);
  process.exit(1);
});
