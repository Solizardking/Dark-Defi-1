# Dark DeFi — Documentation

This directory contains all technical documentation for the Dark DeFi ecosystem.

## Structure

```
docs/
├── getting-started/     New here? Start with START_HERE.md
├── protocol/            Core protocol design, architecture, and guides
├── deployment/          How to deploy to devnet and mainnet
├── integration/         Third-party integrations (Helius, xAI, Zcash, TEEs, SDK)
├── security/            Security remediations and threat model
├── reference/           Program info, build status, implementation summaries
└── legacy/              Archived docs from earlier iterations
```

## Where to Start

| Goal | File |
|---|---|
| First time here | [getting-started/START_HERE.md](getting-started/START_HERE.md) |
| Quick setup | [getting-started/QUICK_START.md](getting-started/QUICK_START.md) |
| DarkSwap quick start | [getting-started/QUICK_START_DARK_SWAP.md](getting-started/QUICK_START_DARK_SWAP.md) |
| Protocol architecture | [protocol/ARCHITECTURE.md](protocol/ARCHITECTURE.md) |
| Protocol vision | [protocol/DARK_DEFI_VISION.md](protocol/DARK_DEFI_VISION.md) |
| Shielded wallet guide | [protocol/SHIELDED_WALLET_GUIDE.md](protocol/SHIELDED_WALLET_GUIDE.md) |
| Deploy to devnet | [deployment/DEVNET_DEPLOYMENT.md](deployment/DEVNET_DEPLOYMENT.md) |
| SDK integration | [integration/SDK_INTEGRATION.md](integration/SDK_INTEGRATION.md) |
| Helius RPC setup | [integration/HELIUS_INTEGRATION.md](integration/HELIUS_INTEGRATION.md) |
| Security notes | [security/SECURITY_REMEDIATION.md](security/SECURITY_REMEDIATION.md) |
| Program IDs | [reference/PROGRAM_INFO.md](reference/PROGRAM_INFO.md) |

## Security Notice

No API keys, private keys, seed phrases, or real credentials should be stored in this directory.
All environment-specific secrets belong in `.env` files (which are gitignored).

If you find a secret accidentally committed, rotate it immediately and open an issue.
