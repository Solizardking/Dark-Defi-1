# Contributing to Dark DeFi 🦞

> *"Cypherpunks write code."* — Eric Hughes, 1993

Thanks for your interest. This is alpha software dealing with cryptography and value transfer — please be deliberate.

## Project layout

```text
Dark-Defi/
├── dark-protocol-program/   # Anchor/Rust — on-chain shielded note pool
│   ├── programs/dark-protocol-program/src/lib.rs
│   ├── deploy-devnet.sh     # devnet deploy (needs ≥ 3 SOL devnet)
│   └── deploy-mainnet.sh    # mainnet deploy (needs ≥ 3 SOL mainnet)
├── packages/
│   ├── sdk/                 # @openclawdsol/dark-protocol-sdk (npm published)
│   ├── protocol/            # @openclawdsol/dark-protocol (npm published)
│   ├── tee-agents/          # @openclawdsol/dark-tee-agents — incl. ClawdTeeAgent
│   ├── dark-defi/           # `dark-defi` umbrella meta-package
│   ├── terminal/            # dark-x402-terminal — interactive CLI
│   └── sas-lib/             # Solana Attestation Service client (local workspace)
└── darkswap/                # DarkSwap Next.js app (Vercel-ready)
```

## Ground rules

- **No secrets in commits.** `.secrets/`, `.env`, `.npmrc`, key JSONs, and mnemonic phrases never enter the tree. The repo's `.gitignore` blocks the obvious patterns; CI runs `gitleaks` on every push (`.gitleaks.toml`). Double-check `git diff --staged` before pushing.
- **Don't commit `dist/` or `node_modules/`.** Builds are reproducible from source.
- **Squash on merge.** Keep `main`'s history readable.

## Getting started

```bash
git clone https://github.com/x402agent/dark-defi.git
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

```text
<type>(<scope>): <subject>

<body explaining motivation>
```

Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `build`, `ci`.
Scopes: `protocol`, `sdk`, `terminal`, `docs`, `repo`.

Example: `feat(sdk): add Birdeye fallback to PriceOracle`

## Reporting security issues

Do **not** open a public issue for vulnerabilities. Use [GitHub's private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability) (the **Security** tab → "Report a vulnerability") so we can coordinate a fix and disclosure. See [SECURITY.md](SECURITY.md) for the full policy.

## Code of conduct

Be civil. Critique code, not people. No racist, sexist, or otherwise bigoted behavior — that's an instant ban.
