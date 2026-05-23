# dark-defi

**Official Dark DeFi SDK** — Privacy-first Solana DeFi suite with shielded wallets, TEE AI agents, Zcash Sapling integration, and x402 private payments.

[![npm version](https://img.shields.io/npm/v/dark-defi.svg)](https://www.npmjs.com/package/dark-defi)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

## Installation

```bash
npm install dark-defi
```

Or install individual packages:

```bash
npm install @openclawdsolana/dark-sdk          # Privacy SDK
npm install @openclawdsolana/dark-protocol     # On-chain types & ABIs
npm install @openclawdsolana/dark-tee-agents   # TEE-attested AI agents
npm install sas-lib                            # Solana Attestation Service
npm install dark-x402-terminal                 # DeFi terminal CLI
```

## Packages

| Package | Description |
|---------|-------------|
| [`@openclawdsolana/dark-sdk`](https://npmjs.com/package/@openclawdsolana/dark-sdk) | Full privacy SDK — shielded wallets, Jupiter swaps, AI agents |
| [`@openclawdsolana/dark-protocol`](https://npmjs.com/package/@openclawdsolana/dark-protocol) | On-chain types, interfaces, program ABIs |
| [`@openclawdsolana/dark-tee-agents`](https://npmjs.com/package/@openclawdsolana/dark-tee-agents) | TEE-attested confidential AI agents with x402 payments |
| [`sas-lib`](https://npmjs.com/package/sas-lib) | Solana Attestation Service TypeScript client |
| [`dark-x402-terminal`](https://npmjs.com/package/dark-x402-terminal) | Privacy-first DeFi terminal CLI |

## Quick Start

```typescript
import { DarkProtocolClient, DarkWallet } from '@openclawdsolana/dark-sdk';
import { createSASClient } from 'sas-lib';

// Initialize the Dark Protocol client
const client = new DarkProtocolClient({ network: 'mainnet-beta' });

// Create a shielded wallet
const wallet = await DarkWallet.create(client);

// View your shielded address
console.log('Shielded address:', wallet.shieldedAddress);
```

## Features

- 🔒 **Shielded Wallets** — Zcash Sapling-style privacy on Solana
- 🤖 **TEE AI Agents** — Confidential inference with on-chain attestation
- 💸 **x402 Private Payments** — HTTP-native micro-payments for AI services
- 🔄 **Private Swaps** — Jupiter Ultra integration with privacy preservation
- 🛡️ **SAS Integration** — Solana Attestation Service for verifiable credentials
- 💻 **DeFi Terminal** — Full-featured CLI for privacy-first DeFi operations

## License

Apache-2.0 © Dark Protocol Team
