# Contributing to Dark DeFi 🦞

> *"Cypherpunks write code."* — Eric Hughes, 1993

Thanks for your interest. This is alpha software dealing with cryptography and value transfer — please be deliberate.

## Project layout

```
Dark-Defi/
├── dark-protocol-program/   # Anchor/Rust — on-chain shielded note pool
│   ├── programs/dark-protocol-program/src/lib.rs
│   ├── deploy-devnet.sh     # devnet deploy (needs ≥ 3 SOL devnet)
│   └── deploy-mainnet.sh    # mainnet deploy (needs ≥ 3 SOL mainnet)
├── packages/
│   ├── sdk/                 # @openclawdsol/dark-protocol-sdk (npm published)
│   ├── terminal/            # x402 dark terminal CLI
│   ├── tee-agents/          # TEE-isolated AI agents + SAS attestation
│   └── sas-lib/             # Solana Attestation Service client
└── darkswap/                # DarkSwap Next.js app (Vercel-ready)
```

## Ground rules

- **No secrets in commits.** `.secrets/`, `.env`, key JSONs, and mnemonic phrases never enter the tree. The repo's `.gitignore` blocks the obvious patterns; double-check `git diff --staged` before pushing.
- **Don't commit `dist/` or `node_modules/`.** Builds are reproducible from source.
- **Squash on merge.** Keep `main`'s history readable.

## Getting started

```bash
git clone https://github.com/8bitsats/Dark-Defi.git
cd Dark-Defi
npm install

# Build the SDK
cd packages/sdk && npm run build && cd ../..

# Build the Anchor program (requires Solana + Anchor CLI)
cd dark-protocol-program && anchor build && cd ..

# Run the DarkSwap dev UI
cd darkswap && npm install && npm run dev  # → http://localhost:3333
```

Set up your local secrets:

```bash
cp .env.example .secrets/.env
ln -sf ../../.secrets/.env packages/terminal/.env
```

## Making changes

1. Fork the repo and create a feature branch: `git checkout -b feat/short-description`.
2. Run `npm run build` and any package-level tests before committing.
3. Open a PR against `main`. Describe **what** changed and **why** — link issues if relevant.

## Commit style

```
<type>(<scope>): <subject>

<body explaining motivation>
```

Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `build`, `ci`.
Scopes: `protocol`, `sdk`, `terminal`, `docs`, `repo`.

Example: `feat(sdk): add Birdeye fallback to PriceOracle`

## Reporting security issues

Do **not** open a public issue for vulnerabilities. Email the maintainers directly so we can coordinate a fix and disclosure.

## Code of conduct

Be civil. Critique code, not people. No racist, sexist, or otherwise bigoted behavior — that's an instant ban.
