# 🌑 Dark Protocol SDK

**Privacy-first DeFi SDK for Solana with Zcash Sapling integration**

[![npm version](https://img.shields.io/npm/v/@dark-protocol/sdk)](https://www.npmjs.com/package/@dark-protocol/sdk)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)

A comprehensive TypeScript SDK for interacting with Dark Protocol - bringing Zcash-style privacy to Solana DeFi.

---

## 🚀 Quick Start

### Installation

```bash
npm install @dark-protocol/sdk
# or
yarn add @dark-protocol/sdk
# or
pnpm add @dark-protocol/sdk
```

### Basic Usage

```typescript
import { DarkProtocolClient, DarkWallet } from '@dark-protocol/sdk';

// Initialize client
const client = await DarkProtocolClient.create({
  heliusApiKey: 'your-helius-api-key',
  network: 'devnet',
  useSecureRpc: true
});

// Create wallet
const { wallet, mnemonic } = await DarkWallet.generate(client);
console.log('Public Key:', wallet.publicKey.toBase58());
console.log('Mnemonic:', mnemonic); // ⚠️ SAVE SECURELY!

// Shield tokens (public → private)
const shieldTx = await wallet.shieldTokens(
  BigInt(1_000_000_000), // 1 SOL
  PublicKey.default
);

// Private transfer
const transferTx = await wallet.privateTransfer(
  recipientAddress,
  BigInt(500_000_000), // 0.5 SOL
  'Secret payment'
);
```

---

## 📋 Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Core Modules](#core-modules)
- [Usage Examples](#usage-examples)
- [API Reference](#api-reference)
- [Advanced Features](#advanced-features)
- [Configuration](#configuration)
- [Development](#development)
- [Contributing](#contributing)

---

## ✨ Features

### Privacy Primitives
- ✅ **Zcash Sapling Integration** - Complete Sapling key derivation and address system
- ✅ **Shielded Transactions** - Hide transaction amounts and recipients
- ✅ **Note Encryption** - ChaCha20-Poly1305 AEAD encryption for private notes
- ✅ **Hierarchical Deterministic Keys** - ZIP-32 compliant key derivation
- ✅ **Commitment/Nullifier System** - Privacy-preserving balance tracking

### DeFi Integration
- 🔄 **Jupiter Swap Integration** - Private token swaps with best price routing
- 🤖 **AI Agent Support** - Decentralized AI agents with TEE security
- 💧 **Privacy Pools** - Private liquidity pools for institutional-grade privacy
- 🔐 **Encrypted Asset Wrapping** - Convert any token to privacy-preserving eAssets

### Infrastructure
- ⚡ **Helius RPC Integration** - Fast, reliable RPC with smart transactions
- 🔗 **Anchor Program Client** - Type-safe program interactions
- 🌐 **Multi-Network Support** - Devnet, testnet, mainnet, localnet
- 🛠️ **TypeScript-First** - Full type safety and IntelliSense support

---

## 📦 Core Modules

### 1. Client (`DarkProtocolClient`)

Main entry point for interacting with Dark Protocol.

```typescript
import { DarkProtocolClient } from '@dark-protocol/sdk';

const client = await DarkProtocolClient.create({
  heliusApiKey: 'your-api-key',
  network: 'devnet',
  useSecureRpc: true,
  commitment: 'confirmed'
});

// Access underlying clients
client.connection  // Solana Connection
client.program     // Anchor Program
client.helius      // Helius SDK
```

### 2. Wallet (`DarkWallet`)

Manage privacy-preserving wallets.

```typescript
import { DarkWallet } from '@dark-protocol/sdk';

// Generate new wallet
const { wallet, mnemonic } = await DarkWallet.generate(client);

// Restore from mnemonic
const wallet = await DarkWallet.fromMnemonic(client, mnemonic, 0);

// Restore from private key
const wallet = DarkWallet.fromPrivateKey(client, privateKey);

// Get wallet state
const state = await wallet.getState();
console.log('Shielded Balance:', state.shieldedBalance);
console.log('Transparent Balance:', state.transparentBalance);
```

### 3. Sapling (`SaplingHDWallet`)

Zcash Sapling hierarchical deterministic wallet.

```typescript
import { SaplingHDWallet, SaplingUtils } from '@dark-protocol/sdk';

// Generate new Sapling wallet
const { wallet, mnemonic } = await SaplingUtils.generateWallet();

// Get keys
const spendingKey = wallet.getSpendingKey();       // ⚠️ NEVER share!
const fullViewingKey = wallet.getFullViewingKey(); // Safe to store
const incomingViewingKey = wallet.getIncomingViewingKey();

// Get addresses
const defaultAddress = wallet.getDefaultAddress();
const addresses = wallet.generateDiversifiedAddresses(10); // Unlimited addresses!
```

### 4. Privacy (`PrivacyUtils`)

Privacy utilities for commitments, nullifiers, and encryption.

```typescript
import { PrivacyUtils } from '@dark-protocol/sdk';

// Generate privacy primitives
const commitment = PrivacyUtils.generateCommitment();
const nullifier = PrivacyUtils.generateNullifier();
const viewingKey = PrivacyUtils.generateViewingKey();

// Encrypt/decrypt memos
const encrypted = await PrivacyUtils.encryptMemo('secret', sharedSecret);
const decrypted = await PrivacyUtils.decryptMemo(encrypted, sharedSecret);

// Create ephemeral account for unlinkable transactions
const ephemeralAccount = PrivacyUtils.createEphemeralAccount();
```

### 5. Swaps (`PrivateSwapManager`)

Private token swaps via Jupiter aggregator.

```typescript
import { PrivateSwapManager } from '@dark-protocol/sdk';

const swapManager = new PrivateSwapManager(client, jupiterApiKey);

// Get quote
const quote = await swapManager.getQuote(
  inputMint,
  outputMint,
  BigInt(1_000_000_000),
  50 // 0.5% slippage
);

// Execute private swap
const swapTx = await swapManager.executePrivateSwap({
  inputMint,
  outputMint,
  inputAmount: BigInt(1_000_000_000),
  minOutputAmount: quote.outputAmount,
  userPublicKey: wallet.publicKey
});
```

### 6. AI Agents (`AIAgentManager`)

Decentralized AI agents with TEE security.

```typescript
import { AIAgentManager } from '@dark-protocol/sdk';

const aiManager = new AIAgentManager(client, redpillApiKey);

// Register AI agent
const registerTx = await aiManager.registerAgent({
  agentPubkey: agentKeypair.publicKey,
  teeAttestation: { measurement, timestamp, signature },
  capabilities: [
    { type: 'swap', enabled: true, maxAmount: 10n ** 10n, requiresApproval: false }
  ],
  owner: wallet.publicKey
});

// Get agent info
const agent = await aiManager.getAgent(agentPubkey);

// Request analysis
const analysis = await aiManager.requestAnalysis({
  agentPubkey,
  dataType: 'portfolio',
  encryptedData: Buffer.from(JSON.stringify(data))
});
```

### 7. Note Encryption (`NoteEncryptionUtils`)

Zcash-style note encryption with ChaCha20-Poly1305.

```typescript
import { NoteEncryptionUtils } from '@dark-protocol/sdk';

// Create encrypted note
const encryptedNote = await NoteEncryptionUtils.createEncryptedNote({
  recipientAddress: saplingAddress,
  value: BigInt(1_000_000_000),
  memo: 'Private payment',
  senderOvk: senderViewingKey.ovk
});

// Try to decrypt note
const plaintext = await NoteEncryptionUtils.tryDecryptNote(
  encryptedNote,
  incomingViewingKey,
  signatureHash
);
```

---

## 🎯 Usage Examples

### Example 1: Complete Privacy Workflow

```typescript
import {
  DarkProtocolClient,
  DarkWallet,
  SaplingHDWallet
} from '@dark-protocol/sdk';

async function privacyWorkflow() {
  // 1. Initialize client
  const client = await DarkProtocolClient.create({
    heliusApiKey: process.env.HELIUS_API_KEY!,
    network: 'devnet',
    useSecureRpc: true
  });

  // 2. Create Solana wallet
  const { wallet, mnemonic } = await DarkWallet.generate(client);
  console.log('Wallet:', wallet.publicKey.toBase58());
  console.log('⚠️  Save mnemonic:', mnemonic);

  // 3. Create Sapling wallet (same mnemonic)
  const saplingWallet = await SaplingHDWallet.fromMnemonic(mnemonic);
  const saplingAddress = saplingWallet.getDefaultAddress();
  console.log('Sapling Address:', saplingAddress.toBase58());

  // 4. Initialize shielded address on-chain
  const fvk = saplingWallet.getFullViewingKey();
  const ivk = fvk.inViewingKey();

  const initTx = await wallet.initializeShieldedAddress(
    ivk.ivk,
    new Uint8Array(32) // spending key commitment
  );
  await client.connection.confirmTransaction(initTx);

  // 5. Shield tokens (public → private)
  const shieldTx = await wallet.shieldTokens(
    BigInt(1_000_000_000), // 1 SOL
    PublicKey.default
  );
  console.log('Shielded:', shieldTx);

  // 6. Check balance
  const state = await wallet.getState();
  console.log('Shielded Balance:', state.shielded Balance);

  // 7. Private transfer
  const transferTx = await wallet.privateTransfer(
    recipientAddress,
    BigInt(500_000_000), // 0.5 SOL
    'Private payment for services'
  );
  console.log('Transfer:', transferTx);
}
```

### Example 2: Private Swap with Jupiter

```typescript
import {
  DarkProtocolClient,
  PrivateSwapManager
} from '@dark-protocol/sdk';

async function privateSwap() {
  const client = await DarkProtocolClient.create({
    heliusApiKey: process.env.HELIUS_API_KEY!,
    network: 'devnet'
  });

  const swapManager = new PrivateSwapManager(
    client,
    process.env.JUPITER_API_KEY
  );

  // SOL → USDC swap
  const SOL = new PublicKey('So11111111111111111111111111111111111111112');
  const USDC = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

  // Get best route
  const quote = await swapManager.getBestRoute(
    SOL,
    USDC,
    BigInt(1_000_000_000) // 1 SOL
  );

  console.log('Quote:');
  console.log('  Input:', quote.inputAmount.toString());
  console.log('  Output:', quote.outputAmount.toString());
  console.log('  Price Impact:', quote.priceImpactPct, '%');

  // Execute swap with privacy
  const swapTx = await swapManager.executePrivateSwap({
    inputMint: SOL,
    outputMint: USDC,
    inputAmount: BigInt(1_000_000_000),
    minOutputAmount: quote.outputAmount,
    slippageBps: 50,
    userPublicKey: wallet.publicKey
  });

  console.log('Swap completed:', swapTx);
}
```

### Example 3: Generate Multiple Sapling Addresses

```typescript
import { SaplingUtils } from '@dark-protocol/sdk';

async function generateAddresses() {
  // Generate wallet
  const { wallet, mnemonic } = await SaplingUtils.generateWallet();
  console.log('Mnemonic:', mnemonic);

  // Default address
  const defaultAddr = wallet.getDefaultAddress();
  console.log('Default:', defaultAddr.toBase58());

  // Generate 100 diversified addresses (all valid, all private!)
  const addresses = wallet.generateDiversifiedAddresses(100);
  addresses.forEach((addr, i) => {
    console.log(`  Address ${i + 1}:`, addr.toBase58());
  });

  // Restore wallet from mnemonic
  const restored = await SaplingUtils.restoreWallet(mnemonic);
  const restoredAddr = restored.getDefaultAddress();
  console.log('Restored address matches:',
    defaultAddr.toBase58() === restoredAddr.toBase58()
  );
}
```

---

## 📚 API Reference

### Configuration

```typescript
interface DarkProtocolConfig {
  heliusApiKey: string;
  network?: 'devnet' | 'mainnet' | 'testnet' | 'localnet';
  useSecureRpc?: boolean;
  jupiterApiKey?: string;
  redpillApiKey?: string;
  rpcUrl?: string;
  programId?: PublicKey;
  commitment?: 'processed' | 'confirmed' | 'finalized';
}
```

### Program IDs

```typescript
// Dark Protocol Program
const DARK_PROTOCOL_PROGRAM_ID = '3KWLFYco7T2rUZkzjSSthjHGmbWmo9HAsRmvupDTomGC';

// Shielded Wallet Program
const SHIELDED_WALLET_PROGRAM_ID = '4753b1cCrPzwr7taWWD8yrcM8dc98fTR7wCFdv1TsAbg';
```

### Network Endpoints

```typescript
// Devnet (Helius)
const DEVNET_RPC = 'https://devnet.helius-rpc.com/?api-key=YOUR_KEY';
const DEVNET_SECURE = 'https://your-devnet-staked-endpoint.helius-rpc.com';

// Mainnet (Helius)
const MAINNET_RPC = 'https://mainnet.helius-rpc.com/?api-key=YOUR_KEY';
const MAINNET_SECURE = 'https://your-mainnet-staked-endpoint.helius-rpc.com';
```

---

## 🔐 Security Considerations

### Current Status

- ✅ Zcash Sapling cryptography fully implemented
- ✅ ChaCha20-Poly1305 AEAD encryption for notes
- ✅ Constant-time operations for timing attack prevention
- ⚠️ ZK-SNARK circuits use placeholder proofs (development only)
- ⚠️ **NOT PRODUCTION READY** - Security audit required

### Best Practices

1. **Never share spending keys** - Only share viewing keys or payment addresses
2. **Save mnemonics securely** - Use hardware wallets or secure storage
3. **Use devnet for testing** - Do not use mainnet without audit
4. **Verify transactions** - Always check transaction signatures
5. **Monitor balances** - Regularly check shielded and transparent balances

### Known Limitations

- ZK-SNARK proofs are placeholders (need production circuits)
- Threshold ElGamal moved to off-chain SDK (BPF stack limits)
- BPF stack warnings in Sapling module (non-blocking)

---

## 🛠️ Development

### Build from Source

```bash
# Clone repository
git clone https://github.com/your-org/dark-protocol
cd dark-protocol/sdk/typescript

# Install dependencies
npm install

# Build SDK
npm run build

# Run tests
npm test

# Watch mode
npm run dev
```

### Environment Variables

Create a `.env` file:

```bash
# Required
HELIUS_API_KEY=your-helius-api-key

# Optional
JUPITER_API_KEY=your-jupiter-api-key
REDPILL_API_KEY=your-redpill-api-key
HELIUS_SECURE_RPC_URL=https://custom-rpc.example.com
```

### Project Structure

```
sdk/typescript/
├── src/
│   ├── client.ts           # Main client
│   ├── wallet.ts           # Wallet management
│   ├── sapling.ts          # Zcash Sapling
│   ├── note-encryption.ts  # Note encryption
│   ├── privacy.ts          # Privacy utilities
│   ├── swap.ts             # Jupiter swaps
│   ├── ai-agent.ts         # AI agents
│   ├── config.ts           # Configuration
│   ├── types.ts            # TypeScript types
│   ├── utils.ts            # Utilities
│   ├── examples.ts         # Examples
│   └── index.ts            # Main export
├── dist/                   # Build output
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Add tests for new features
- Update documentation
- Run linter before committing: `npm run lint`
- Format code: `npm run format`

---

## 📄 License

Apache License 2.0 - see [LICENSE](../../LICENSE) for details.

---

## 🌐 Links

- **Documentation**: [docs/](../../docs/)
- **Program Repository**: [../..](../..)
- **Dark Protocol Devnet**: [Explorer](https://explorer.solana.com/address/3KWLFYco7T2rUZkzjSSthjHGmbWmo9HAsRmvupDTomGC?cluster=devnet)
- **Discord**: Coming Soon
- **Twitter**: Coming Soon

---

## 💡 Support

For help and questions:

1. Check the [examples](./src/examples.ts)
2. Review [API documentation](#api-reference)
3. Open an issue on GitHub
4. Join our Discord community (coming soon)

---

## 🙏 Acknowledgments

- **Zcash Foundation** - For Sapling protocol design
- **Electric Coin Company** - For Zcash reference implementation
- **Solana Labs** - For Solana blockchain
- **Helius** - For RPC infrastructure
- **Jupiter** - For swap aggregation
- **Anchor** - For Solana program framework

---

**🌑 Welcome to Dark DeFi - Where Privacy Meets Liquidity 🌑**

Built with ❤️ for the Solana ecosystem
