<div align="center">

<img src="assets/banner.svg" alt="Dark Swap" width="900"/>

[![Typing SVG](https://readme-typing-svg.demolab.com?font=Share+Tech+Mono&size=15&duration=2500&pause=800&color=00F5FF&center=true&vCenter=true&width=700&lines=Privacy-first+DEX+on+Solana;Multi-oracle+validated+swaps+%E2%80%94+no+front-running;MEV-shielded+private+TX+pipeline;Zcash+Sapling+shielded+notes+on+Solana;Ephemeral+accounts+via+MagicBlock+rollup;Swap+in+the+Dark.)](https://github.com/x402agent/dark-defi)

<br/>

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Solana](https://img.shields.io/badge/Solana-Mainnet-9945FF?style=for-the-badge&logo=solana&logoColor=white)](https://solana.com)
[![Vercel](https://img.shields.io/badge/Vercel-Deploy-black?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/new/clone?repository-url=https://github.com/x402agent/dark-defi&root=darkswap)
[![License](https://img.shields.io/badge/License-MIT-00ff41?style=for-the-badge)](../LICENSE)

[![Deploy on Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/x402agent/dark-defi&root=darkswap)

</div>

---

## What is DarkSwap?

DarkSwap is a **privacy-first Solana swap UI** built with Next.js 16, React 19, and Framer Motion. It wraps the `@openclawdsol/dark-protocol-sdk` with a full browser experience:

- **Matrix-rain particle canvas** and ambient orb background
- **Multi-oracle quote engine** — Jupiter Ultra meta-aggregator + DFlow + Birdeye price validation
- **MEV resistance** — private TX pipeline via Jupiter Ultra execute
- **Token safety scoring** — Jupiter Shield risk check on every swap
- **Zcash shielded wallet panel** — Sapling note lifecycle in the browser (Web Crypto API)
- **Ephemeral account panel** — MagicBlock rollup integration for on-chain graph breaking
- **Real-time swap history** — Convex backend (live queries, no polling)
- **RedPill TEE attestation** — confidential AI assistant with on-chain receipt
- **Phoenix perps markets** — perpetuals orderbook viewer

---

## Live Demo

```
http://localhost:3333   (dev)
```

The app ships with a `SKIP_ENV_VALIDATION` mode for CI builds and a mock quote fallback in `NODE_ENV=development` so you can run it without API keys.

---

## Quick Start

```bash
git clone https://github.com/x402agent/dark-defi.git
cd dark-defi/darkswap
npm install --legacy-peer-deps
cp .env.example .env.local
# fill in NEXT_PUBLIC_RPC_URL + NEXT_PUBLIC_CONVEX_URL at minimum
npm run dev          # → http://localhost:3333
```

---

## Environment Variables

Copy `.env.example` → `.env.local` and fill in values. **Never commit `.env.local`** — it is gitignored.

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_RPC_URL` | Yes | Helius mainnet RPC URL with API key |
| `HELIUS_API_KEY` | Yes | Server-side Helius key (oracle + DAS) |
| `NEXT_PUBLIC_CONVEX_URL` | Yes | Convex deployment URL for swap history |
| `CONVEX_DEPLOYMENT` | Yes | Convex deployment slug (`prod:your-slug`) |
| `JUPITER_API_KEY` | Optional | Higher rate limits on Jupiter |
| `BIRDEYE_API_KEY` | Optional | Birdeye price oracle (falls back to Jupiter) |
| `REDPILL_API_KEY` | Optional | RedPill TEE AI attestation |
| `TOKEN_ADDRESS` | Optional | Featured token mint address |
| `DFLOW_API_KEY` | Optional | DFlow RFQ endpoint |

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  Browser                                                      │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────────┐  │
│  │  DarkSwap.tsx │  │ ShieldedWallet│  │  EphemeralPanel  │  │
│  │  swap widget  │  │ Panel (notes) │  │  MagicBlock UI   │  │
│  └──────┬───────┘  └───────────────┘  └──────────────────┘  │
│         │ fetch                                               │
└─────────┼───────────────────────────────────────────────────┘
          │
┌─────────▼───────────────────────────────────────────────────┐
│  Next.js API Routes (server-side)                            │
│  ┌──────────┐  ┌──────────┐  ┌────────────┐  ┌──────────┐  │
│  │/api/quote│  │/api/swap │  │/api/execute│  │/api/oracle│  │
│  │ multi-   │  │ Jupiter  │  │  Jupiter   │  │ Birdeye  │  │
│  │ router   │  │ Ultra tx │  │  Ultra     │  │ +Jup     │  │
│  └──────────┘  └──────────┘  └────────────┘  └──────────┘  │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────────┐  │
│  │/api/safety│ │/api/tokens│ │/api/redpill/{attest,chat}│  │
│  │ Jupiter  │  │ token     │  │  TEE AI + receipt        │  │
│  │ Shield   │  │ registry  │  │                          │  │
│  └──────────┘  └──────────┘  └──────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │/api/perps/{markets,orderbook}  — Phoenix perps       │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────┬───────────────────┘
                                           │
              ┌────────────────────────────┴────────────┐
              ▼                                          ▼
   ┌──────────────────┐                    ┌───────────────────┐
   │  Convex Backend  │                    │  Solana RPC       │
   │  convex/swaps.ts │                    │  Helius + Jupiter │
   │  real-time swap  │                    │  DFlow · Birdeye  │
   │  history store   │                    │  MagicBlock · SAS │
   └──────────────────┘                    └───────────────────┘
```

---

## UI Components

| Component | Description |
|---|---|
| `DarkSwap.tsx` | Main swap card — token select, quote, slippage, execute |
| `ParticleField.tsx` | Canvas matrix rain + ambient orb background |
| `LiveTicker.tsx` | Real-time scrolling price ticker bar |
| `LobsterLogo.tsx` | 🦞 Animated brand logo + CLAWD buy button |
| `OracleStatus.tsx` | Live oracle validation badge |
| `PrivacyBar.tsx` | MEV shield + privacy status strip |
| `EphemeralPanel.tsx` | MagicBlock ephemeral account panel |
| `ShieldedWalletPanel.tsx` | Zcash Sapling shielded wallet UI |
| `SwapHistoryPanel.tsx` | Convex-powered real-time swap history |
| `SwapProgress.tsx` | Step-by-step swap progress + success burst animation |
| `TokenModal.tsx` | Token search + selection modal |
| `SafetyModal.tsx` | Jupiter Shield safety score modal |

---

## API Routes

### `GET /api/quote`

Multi-router best-price quote with oracle validation and token safety check.

```
?inputMint=<base58>
&outputMint=<base58>
&amount=<raw lamports>
&slippageBps=<1-1000>
&skipOracle=true|false
&skipSafety=true|false
```

Route priority:
1. **Jupiter Ultra meta-aggregator** (`/order` — all routers compete including DFlow)
2. **DFlow direct** (if `DFLOW_API_KEY` set — parallel race with #1 for absolute best)
3. **Jupiter v1 fallback** (classic `/quote`)
4. **Mock** (dev only, `NODE_ENV=development`)

Returns: `{ quote, oracle, safety, source, router }`

---

### `POST /api/swap`

Build a versioned Solana transaction for the quote.

```json
{ "inputMint": "...", "outputMint": "...", "amount": "...", "taker": "...", "slippageBps": 50 }
```

Returns: `{ tx: "<base64 VersionedTransaction>", requestId: "..." }`

---

### `POST /api/execute`

Execute a signed transaction via Jupiter Ultra (MEV-resistant path).

```json
{ "signedTransaction": "<base64>", "requestId": "..." }
```

Returns: `{ status: "Success", signature: "..." }`

---

### `GET /api/oracle`

Standalone price oracle check for a token pair.

```
?inputMint=<base58>&outputMint=<base58>&inAmount=<raw>&outAmount=<raw>
```

Returns: `{ valid: bool, deviation: float, sources: string[] }`

---

### `GET /api/safety`

Jupiter Shield token safety score.

```
?inputMint=<base58>&outputMint=<base58>
```

Returns: `{ inputToken: SafetyResult, outputToken: SafetyResult }`

---

### `POST /api/redpill/chat`

TEE-isolated AI chat with RedPill inference.

```json
{ "message": "...", "history": [...] }
```

Returns: `{ reply: "...", model: "...", tee: bool }`

---

### `POST /api/redpill/attest`

On-chain SAS attestation receipt for an AI inference.

```json
{ "requestHash": "<hex>", "responseHash": "<hex>" }
```

Returns: `{ attestation: "...", signature: "..." }`

---

## Convex Backend

The `convex/swaps.ts` schema stores a real-time swap history readable by all connected clients with no polling.

```typescript
// convex/schema.ts
swaps: defineTable({
  signature: v.string(),
  inputMint:  v.string(), outputMint: v.string(),
  inAmount:   v.string(), outAmount:  v.string(),
  router:     v.string(),
  walletAddress: v.string(),
  ephemeralEnabled: v.boolean(),
  timestamp:  v.number(),
})
```

```bash
# Start Convex dev server (separate terminal)
npx convex dev

# Deploy to production
npx convex deploy
```

---

## Privacy Stack

```
┌─────────────────────────────────────────────────────────┐
│  What DarkSwap protects today                            │
│  ✅ Oracle front-running — Birdeye+Jupiter deviation     │
│  ✅ Token rug risk — Jupiter Shield scoring              │
│  ✅ MEV — Jupiter Ultra private TX pipeline              │
│  ✅ On-chain graph — MagicBlock ephemeral accounts       │
│  ✅ Note contents — Sapling ChaCha20-Poly1305 notes      │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│  Roadmap                                                 │
│  📋 ZK-SNARK proofs (Groth16)                            │
│  📋 On-chain shielded settlement (Anchor program)        │
│  📋 FHE encrypted AMM                                    │
└─────────────────────────────────────────────────────────┘
```

---

## Deploy to Vercel

One click:

[![Deploy on Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/x402agent/dark-defi&root=darkswap)

Manual deploy:

```bash
cd darkswap
vercel deploy          # preview
vercel deploy --prod   # production
```

Required Vercel env vars:
```
NEXT_PUBLIC_RPC_URL
HELIUS_API_KEY
NEXT_PUBLIC_CONVEX_URL
CONVEX_DEPLOYMENT
```

The `vercel.json` in this directory pre-configures the framework, build command, and output dir.

---

## Tech Stack

| Layer | Library |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19 + Tailwind CSS 3 |
| Animations | Framer Motion 11 |
| Wallet | `@solana/wallet-adapter-react` |
| Blockchain | `@solana/web3.js` |
| Real-time backend | Convex 1.39 |
| Toasts | react-hot-toast |
| Icons | lucide-react |
| Privacy SDK | `@openclawdsol/dark-protocol-sdk` |
| Swap routing | Jupiter Ultra API |
| Price oracle | Birdeye + Jupiter |
| TEE AI | RedPill (Phala) |

---

## Security

- `.env.local` is gitignored — never commit real API keys
- All server-side keys are accessed only in `src/app/api/` routes (not exposed to the browser)
- `NEXT_PUBLIC_*` variables intentionally expose only public RPC URLs and non-secret config
- `next.config.ts` sets `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and strict `Referrer-Policy` on all routes
- Input validation via `src/lib/requestValidation.ts` on all API routes
- See [`../SECURITY.md`](../SECURITY.md) for the full security policy

---

## Development

```bash
# Type-check only (no build)
npm run type-check

# Lint
npm run lint

# Full build (CI)
SKIP_ENV_VALIDATION=true npm run build
```

The `SKIP_ENV_VALIDATION=true` flag is used in CI to build without live API keys. The `NEXT_PUBLIC_PROGRAM_ID` env var is injected by the CI workflow.

---

<div align="center">

Built on [Solana](https://solana.com) · Powered by [Jupiter](https://jup.ag) · Real-time by [Convex](https://convex.dev) · Privacy by [Dark Protocol](https://github.com/x402agent/dark-defi)

</div>
