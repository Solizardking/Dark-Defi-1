# 🧪 Dark Protocol - Testing & Integration Guide

Complete guide for testing and integrating with the deployed Dark Protocol programs on Solana Devnet.

## 📋 Quick Reference

**Deployed Programs (Devnet):**
- Dark Protocol: `3KWLFYco7T2rUZkzjSSthjHGmbWmo9HAsRmvupDTomGC`
- Shielded Wallet: `4753b1cCrPzwr7taWWD8yrcM8dc98fTR7wCFdv1TsAbg`

**Network:** Solana Devnet  
**RPC Endpoint:** `https://devnet.helius-rpc.com/`

---

## 🚀 Quick Start Testing

### 1. Verify Programs Are Live

```bash
# Check dark-protocol
solana program show 3KWLFYco7T2rUZkzjSSthjHGmbWmo9HAsRmvupDTomGC --url devnet

# Check shielded-wallet
solana program show 4753b1cCrPzwr7taWWD8yrcM8dc98fTR7wCFdv1TsAbg --url devnet

# View recent transactions
solana logs 3KWLFYco7T2rUZkzjSSthjHGmbWmo9HAsRmvupDTomGC --url devnet
```

### 2. Get Test SOL

```bash
# Airdrop test SOL to your wallet
solana airdrop 2 --url devnet

# Check balance
solana balance --url devnet
```

---

## 🔧 TypeScript SDK Integration

### Setup

```bash
# Navigate to SDK directory
cd sdk/typescript

# Install dependencies
npm install

# Build SDK
npm run build
```

### Update Configuration

Edit `sdk/typescript/src/config.ts`:

```typescript
export const PROGRAM_IDS = {
  DARK_PROTOCOL: '3KWLFYco7T2rUZkzjSSthjHGmbWmo9HAsRmvupDTomGC',
  SHIELDED_WALLET: '4753b1cCrPzwr7taWWD8yrcM8dc98fTR7wCFdv1TsAbg',
};

export const RPC_ENDPOINTS = {
  DEVNET: 'https://devnet.helius-rpc.com/?api-key=YOUR_HELIUS_API_KEY',
  MAINNET: 'https://mainnet.helius-rpc.com/?api-key=YOUR_HELIUS_API_KEY',
};
```

### Basic Usage Example

Create `test-integration.ts`:

```typescript
import * as anchor from '@coral-xyz/anchor';
import { Connection, PublicKey, Keypair } from '@solana/web3.js';

// Program IDs
const DARK_PROTOCOL_ID = new PublicKey('3KWLFYco7T2rUZkzjSSthjHGmbWmo9HAsRmvupDTomGC');
const SHIELDED_WALLET_ID = new PublicKey('4753b1cCrPzwr7taWWD8yrcM8dc98fTR7wCFdv1TsAbg');

// Connect to devnet
const connection = new Connection(
  'https://devnet.helius-rpc.com/?api-key=YOUR_API_KEY',
  'confirmed'
);

async function testConnection() {
  console.log('Testing connection to Solana Devnet...');
  
  // Check dark-protocol
  const darkProtocolInfo = await connection.getAccountInfo(DARK_PROTOCOL_ID);
  console.log('Dark Protocol program exists:', darkProtocolInfo !== null);
  
  // Check shielded-wallet
  const shieldedWalletInfo = await connection.getAccountInfo(SHIELDED_WALLET_ID);
  console.log('Shielded Wallet program exists:', shieldedWalletInfo !== null);
  
  // Get program data
  if (darkProtocolInfo) {
    console.log('Dark Protocol executable:', darkProtocolInfo.executable);
    console.log('Dark Protocol owner:', darkProtocolInfo.owner.toString());
  }
}

testConnection().catch(console.error);
```

Run the test:
```bash
npx ts-node test-integration.ts
```

---

## 🧪 Manual Testing Scenarios

### Test 1: Program Account Verification

**Goal:** Verify both programs exist and are executable

```bash
#!/bin/bash

echo "=== Testing Program Accounts ==="

# Test Dark Protocol
echo "Testing Dark Protocol..."
DARK_INFO=$(solana program show 3KWLFYco7T2rUZkzjSSthjHGmbWmo9HAsRmvupDTomGC --url devnet)
if [[ $DARK_INFO == *"Program Id"* ]]; then
  echo "✓ Dark Protocol verified"
else
  echo "✗ Dark Protocol not found"
fi

# Test Shielded Wallet
echo "Testing Shielded Wallet..."
SHIELD_INFO=$(solana program show 4753b1cCrPzwr7taWWD8yrcM8dc98fTR7wCFdv1TsAbg --url devnet)
if [[ $SHIELD_INFO == *"Program Id"* ]]; then
  echo "✓ Shielded Wallet verified"
else
  echo "✗ Shielded Wallet not found"
fi
```

### Test 2: Program Invocation

**Using Anchor Client:**

```typescript
import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { DarkProtocol } from '../target/types/dark_protocol';

async function testProgramInvocation() {
  // Setup provider
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  
  // Load program
  const programId = new PublicKey('3KWLFYco7T2rUZkzjSSthjHGmbWmo9HAsRmvupDTomGC');
  const program = new Program<DarkProtocol>(
    IDL,
    programId,
    provider
  );
  
  console.log('Program loaded:', program.programId.toString());
  
  // Test fetching program accounts
  const accounts = await program.account.privacyPool.all();
  console.log('Privacy pools found:', accounts.length);
}
```

### Test 3: Transaction Simulation

```typescript
import { Transaction, SystemProgram } from '@solana/web3.js';

async function simulateTransaction() {
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  
  // Create a simple transaction
  const tx = new Transaction();
  // Add your program instructions here
  
  // Simulate (doesn't execute on-chain)
  const simulation = await connection.simulateTransaction(tx);
  console.log('Simulation result:', simulation);
  
  if (simulation.value.err) {
    console.error('Simulation failed:', simulation.value.err);
  } else {
    console.log('✓ Simulation successful');
    console.log('Logs:', simulation.value.logs);
  }
}
```

---

## 📊 Monitoring & Debugging

### View Program Logs

```bash
# Live log streaming
solana logs 3KWLFYco7T2rUZkzjSSthjHGmbWmo9HAsRmvupDTomGC --url devnet

# View specific transaction
solana confirm -v <TRANSACTION_SIGNATURE> --url devnet
```

### Check Program Data

```bash
# Get program info
solana program show 3KWLFYco7T2rUZkzjSSthjHGmbWmo9HAsRmvupDTomGC --url devnet

# Check program balance
solana balance 3KWLFYco7T2rUZkzjSSthjHGmbWmo9HAsRmvupDTomGC --url devnet

# View program authority
solana program show 3KWLFYco7T2rUZkzjSSthjHGmbWmo9HAsRmvupDTomGC --url devnet | grep Authority
```

### Monitor Using Solana Explorer

**Dark Protocol:**
```
https://explorer.solana.com/address/3KWLFYco7T2rUZkzjSSthjHGmbWmo9HAsRmvupDTomGC?cluster=devnet
```

**Shielded Wallet:**
```
https://explorer.solana.com/address/4753b1cCrPzwr7taWWD8yrcM8dc98fTR7wCFdv1TsAbg?cluster=devnet
```

---

## 🔐 Testing Privacy Features

### Test Privacy Pool Initialization

```typescript
async function testPrivacyPool() {
  const provider = anchor.AnchorProvider.env();
  const program = anchor.workspace.DarkProtocol;
  
  // Generate pool keypair
  const pool = Keypair.generate();
  
  try {
    // Initialize privacy pool
    const tx = await program.methods
      .initializePool()
      .accounts({
        pool: pool.publicKey,
        authority: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([pool])
      .rpc();
    
    console.log('✓ Privacy pool initialized');
    console.log('Transaction:', tx);
    console.log('Pool address:', pool.publicKey.toString());
  } catch (error) {
    console.error('✗ Failed to initialize pool:', error);
  }
}
```

### Test Sapling Key Generation

```typescript
import { generateSaplingKeys } from './sdk/typescript/src/sapling';

async function testSaplingKeys() {
  console.log('Generating Sapling keys...');
  
  const keys = await generateSaplingKeys();
  console.log('✓ Spending key generated');
  console.log('✓ Viewing key derived');
  console.log('✓ Payment address created');
  
  // Test key serialization
  const serialized = keys.serialize();
  console.log('Keys serialized:', serialized.length, 'bytes');
}
```

---

## 🧩 Integration Examples

### Example 1: Simple Client

```typescript
import { Connection, PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';

class DarkProtocolClient {
  connection: Connection;
  programId: PublicKey;
  
  constructor(rpcUrl: string) {
    this.connection = new Connection(rpcUrl, 'confirmed');
    this.programId = new PublicKey('3KWLFYco7T2rUZkzjSSthjHGmbWmo9HAsRmvupDTomGC');
  }
  
  async getProgramInfo() {
    const info = await this.connection.getAccountInfo(this.programId);
    return {
      exists: info !== null,
      executable: info?.executable,
      owner: info?.owner.toString(),
      dataLength: info?.data.length,
    };
  }
  
  async getRecentTransactions() {
    const signatures = await this.connection.getSignaturesForAddress(
      this.programId,
      { limit: 10 }
    );
    return signatures;
  }
}

// Usage
const client = new DarkProtocolClient('https://api.devnet.solana.com');
const info = await client.getProgramInfo();
console.log('Program info:', info);
```

### Example 2: React Integration

```typescript
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useEffect, useState } from 'react';

export function DarkProtocolIntegration() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [programStatus, setProgramStatus] = useState<string>('Checking...');
  
  useEffect(() => {
    const checkProgram = async () => {
      const programId = new PublicKey('3KWLFYco7T2rUZkzjSSthjHGmbWmo9HAsRmvupDTomGC');
      const info = await connection.getAccountInfo(programId);
      
      if (info) {
        setProgramStatus('✓ Program Online');
      } else {
        setProgramStatus('✗ Program Not Found');
      }
    };
    
    checkProgram();
  }, [connection]);
  
  return (
    <div>
      <h2>Dark Protocol Status</h2>
      <p>{programStatus}</p>
      <p>Wallet: {wallet.connected ? 'Connected' : 'Not Connected'}</p>
    </div>
  );
}
```

---

## ⚠️ Common Issues & Solutions

### Issue 1: "Invalid Base58 string"

**Problem:** Anchor.toml has incorrect program IDs  
**Solution:** Ensure program IDs match deployed addresses:
```toml
dark_protocol = "3KWLFYco7T2rUZkzjSSthjHGmbWmo9HAsRmvupDTomGC"
shielded_wallet = "4753b1cCrPzwr7taWWD8yrcM8dc98fTR7wCFdv1TsAbg"
```

### Issue 2: "Program account not found"

**Problem:** Using wrong network or program not deployed  
**Solution:** Always specify devnet:
```bash
solana program show <PROGRAM_ID> --url devnet
```

### Issue 3: Transaction fails with "Program failed to complete"

**Problem:** Instruction data or accounts incorrect  
**Solution:** 
1. Check program logs: `solana logs <PROGRAM_ID> --url devnet`
2. Verify account ownership and signers
3. Simulate transaction first before sending

### Issue 4: "Insufficient funds"

**Problem:** Wallet needs SOL for transactions  
**Solution:**
```bash
solana airdrop 2 --url devnet
```

---

## 📈 Performance Testing

### Load Test Script

```typescript
async function loadTest() {
  const connection = new Connection('https://api.devnet.solana.com');
  const programId = new PublicKey('3KWLFYco7T2rUZkzjSSthjHGmbWmo9HAsRmvupDTomGC');
  
  console.log('Starting load test...');
  const startTime = Date.now();
  const requests = 100;
  
  const promises = Array(requests).fill(null).map(() => 
    connection.getAccountInfo (programId)
  );
  
  await Promise.all(promises);
  
  const duration = Date.now() - startTime;
  console.log(`✓ Completed ${requests} requests in ${duration}ms`);
  console.log(`Average: ${duration / requests}ms per request`);
}
```

---

## 🎯 Next Steps

### 1. Development Phase

- [ ] Set up local testing environment
- [ ] Write unit tests for each instruction
- [ ] Create integration test suite
- [ ] Test privacy features thoroughly

### 2. Integration Phase

- [ ] Update SDK with deployed program IDs
- [ ] Build sample frontend application
- [ ] Test all user flows
- [ ] Document API endpoints

### 3. Testing Phase

- [ ] Perform end-to-end testing
- [ ] Load testing on devnet
- [ ] Security testing
- [ ] User acceptance testing

### 4. Pre-Production

- [ ] Complete code audit
- [ ] Fix any discovered issues
- [ ] Prepare for mainnet deployment
- [ ] Set up monitoring and alerts

---

## 📚 Additional Resources

**Documentation:**
- [PROGRAM_INFO.md](PROGRAM_INFO.md) - Program details
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Deployment guide
- [docs/DARK_DEFI_VISION.md](docs/DARK_DEFI_VISION.md) - Technical vision

**Tools:**
- [Solana Explorer (Devnet)](https://explorer.solana.com/?cluster=devnet)
- [Anchor Docs](https://www.anchor-lang.com/)
- [Solana Cookbook](https://solanacookbook.com/)

**Community:**
- GitHub Issues - Report bugs
- Discord - Coming soon
- Twitter - Coming soon

---

## 🔗 Quick Commands Reference

```bash
# Check program
solana program show <PROGRAM_ID> --url devnet

# View logs
solana logs <PROGRAM_ID> --url devnet

# Get test SOL
solana airdrop 2 --url devnet

# Check balance
solana balance --url devnet

# Simulate transaction
solana confirm -v <TX_SIGNATURE> --url devnet

# Build programs
anchor build

# Run tests (after fixing version)
anchor test --skip-deploy
```

---

**Last Updated:** November 11, 2025  
**Programs:** Live on Devnet  
**Status:** Ready for Integration Testing
