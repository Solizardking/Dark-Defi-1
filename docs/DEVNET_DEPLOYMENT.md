# Dark DeFi Devnet Deployment Guide

## Overview

This guide covers deploying Dark DeFi to Solana Devnet using Helius Secure RPC endpoints.

## Prerequisites

1. **Solana CLI installed**
   ```bash
   sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
   ```

2. **Anchor CLI installed**
   ```bash
   cargo install --git https://github.com/coral-xyz/anchor anchor-cli --locked
   ```

3. **Node.js & Yarn**
   ```bash
   node --version  # v18+ required
   yarn --version
   ```

4. **Helius API Key**
   - Sign up at https://helius.dev
   - Get your API key (already configured in `.env`)

## Environment Configuration

The project is pre-configured with Helius RPC endpoints:

### `. env` Configuration

```env
# Helius Devnet RPC (Standard)
HELIUS_DEVNET_URL=https://devnet.helius-rpc.com/?api-key=YOUR_HELIUS_API_KEY

# Helius Devnet RPC (Secure/Fast)
HELIUS_SECURE_DEVNET_URL=https://cati-etnoqa-fast-devnet.helius-rpc.com

# Helius Devnet WebSocket
HELIUS_DEVNET_WSS_URL=wss://devnet.helius-rpc.com/?api-key=YOUR_HELIUS_API_KEY

# Default RPC for deployment
SOLANA_RPC_URL=https://devnet.helius-rpc.com/?api-key=YOUR_HELIUS_API_KEY
```

### `Anchor.toml` Configuration

The Anchor configuration is set to use Devnet by default:

```toml
[provider]
cluster = "Devnet"
wallet = "~/.config/solana/id.json"

[provider.devnet]
cluster = "https://devnet.helius-rpc.com/?api-key=YOUR_HELIUS_API_KEY"
```

## Deployment Steps

### 1. Set Up Solana Wallet

```bash
# Generate new keypair (if you don't have one)
solana-keygen new --outfile ~/.config/solana/id.json

# Check your public key
solana address

# Request devnet SOL airdrop
solana airdrop 2 --url devnet
```

### 2. Configure Solana CLI for Devnet

```bash
# Set cluster to devnet
solana config set --url devnet

# Verify configuration
solana config get
```

### 3. Build the Program

```bash
cd dark-protocol

# Install dependencies
yarn install

# Build Anchor programs
anchor build
```

### 4. Deploy to Devnet

```bash
# Deploy the program
anchor deploy --provider.cluster devnet

# Expected output:
# Program Id: <YOUR_PROGRAM_ID>
```

### 5. Update Program ID

After deployment, update the program ID in:

- `Anchor.toml` (under `[programs.devnet]`)
- `dark-protocol/programs/dark-protocol/src/lib.rs` (in `declare_id!` macro)

```rust
// Update this line with your deployed program ID
declare_id!("YOUR_DEPLOYED_PROGRAM_ID_HERE");
```

### 6. Verify Deployment

```bash
# Check program account
solana program show <YOUR_PROGRAM_ID> --url devnet

# Initialize protocol (first time only)
anchor run initialize-devnet
```

## Using Helius Secure RPC

### Standard RPC vs Secure RPC

**Standard RPC:**
- Public endpoint with API key
- Rate limited
- Good for development

**Secure RPC:**
- Private dedicated endpoint
- Higher throughput
- Lower latency
- Better for production/testing

### TypeScript SDK Configuration

```typescript
import { DarkProtocolClient } from '@dark-defi/sdk';

// Using Standard Devnet RPC
const client = await DarkProtocolClient.create({
  heliusApiKey: process.env.HELIUS_API_KEY!,
  network: 'devnet',
  useSecureRpc: false  // Standard RPC
});

// Using Secure Devnet RPC
const secureClient = await DarkProtocolClient.create({
  heliusApiKey: process.env.HELIUS_API_KEY!,
  network: 'devnet',
  useSecureRpc: true  // Secure/Fast RPC
});
```

## Testing on Devnet

### Run Integration Tests

```bash
# Set environment to devnet
export ANCHOR_PROVIDER_URL="https://devnet.helius-rpc.com/?api-key=YOUR_HELIUS_API_KEY"

# Run tests
anchor test --skip-local-validator
```

### Manual Testing

```typescript
import { DarkProtocolClient } from './sdk/typescript/src';
import { Keypair } from '@solana/web3.js';

async function testDevnet() {
  // Create client
  const client = await DarkProtocolClient.create({
    heliusApiKey: process.env.HELIUS_API_KEY!,
    network: 'devnet',
    useSecureRpc: true
  });

  // Get protocol state
  const protocolState = await client.getProtocolState();
  console.log('Protocol State:', protocolState);

  // Get merkle tree
  const merkleTree = await client.getMerkleTree();
  console.log('Merkle Tree:', merkleTree);
}

testDevnet().catch(console.error);
```

## Dark DeFi Features on Devnet

### Available Features

✅ **Zcash Cryptography**
- Sapling payment addresses
- Note encryption with ChaCha20-Poly1305
- ZIP-32 HD key derivation
- ZK-SNARKs for private transfers

✅ **Privacy Infrastructure**
- Shielded addresses
- Private transfers
- Merkle tree for commitment tracking
- Nullifier set for double-spend prevention

✅ **Advanced Cryptography (In Development)**
- Fully Homomorphic Encryption (FHE)
- Threshold ElGamal encryption
- Encrypted asset wrapping (eAssets)

✅ **AI Agents in TEE**
- Agent registration
- TEE attestation
- Private AI-powered trading

## Monitoring & Debugging

### View Logs

```bash
# Watch program logs
solana logs <YOUR_PROGRAM_ID> --url devnet
```

### Check Transaction Status

```bash
# Verify transaction
solana confirm <TRANSACTION_SIGNATURE> --url devnet
```

### Helius Dashboard

Monitor your RPC usage at:
https://dashboard.helius.dev

## Network Endpoints Reference

### Devnet
- **Standard RPC**: `https://devnet.helius-rpc.com/?api-key=YOUR_KEY`
- **Secure RPC**: `https://cati-etnoqa-fast-devnet.helius-rpc.com`
- **WebSocket**: `wss://devnet.helius-rpc.com/?api-key=YOUR_KEY`

### Mainnet (Future)
- **Standard RPC**: `https://mainnet.helius-rpc.com/?api-key=YOUR_KEY`
- **Secure RPC**: `https://alli-pigt1b-fast-mainnet.helius-rpc.com`
- **WebSocket**: `wss://mainnet.helius-rpc.com/?api-key=YOUR_KEY`

## Troubleshooting

### Issue: Insufficient SOL

```bash
# Request more SOL
solana airdrop 2 --url devnet

# Check balance
solana balance --url devnet
```

### Issue: Program deployment fails

```bash
# Increase compute budget
anchor build --  --features "cpi"

# Try with more SOL
solana airdrop 5 --url devnet
anchor deploy
```

### Issue: RPC rate limiting

Switch to secure RPC endpoint:
```typescript
const client = await DarkProtocolClient.create({
  heliusApiKey: process.env.HELIUS_API_KEY!,
  network: 'devnet',
  useSecureRpc: true  // Use secure endpoint
});
```

## Next Steps

1. **Test Core Features**
   - Create shielded addresses
   - Execute private transfers
   - Test note encryption

2. **Integrate Jupiter**
   - Set up private swaps
   - Test MEV protection

3. **Deploy AI Agents**
   - Register agents in TEE
   - Test automated trading strategies

4. **Production Deployment**
   - Security audit
   - Mainnet deployment
   - Liquidity incentives

## Support

- **Documentation**: https://docs.dark-defi.io (coming soon)
- **Discord**: https://discord.gg/dark-defi (coming soon)
- **GitHub**: https://github.com/yourusername/dark-defi

## Security Notes

⚠️ **Devnet is for testing only**
- Do not use real funds
- API keys in `.env` are for development
- Private keys should never be committed to git
- Always use `.env` for sensitive data

## Mainnet Deployment Checklist

Before deploying to mainnet:

- [ ] Complete security audit
- [ ] Formal verification of ZK circuits
- [ ] Extensive devnet testing (>1000 transactions)
- [ ] Bug bounty program
- [ ] Insurance fund established
- [ ] Multi-sig governance
- [ ] Emergency pause mechanism tested
- [ ] Documentation complete
- [ ] Community review period (2+ weeks)

---

**Dark DeFi: Where privacy meets performance on Solana**
