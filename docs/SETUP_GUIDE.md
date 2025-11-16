# 🌑 Dark DeFi Terminal - Complete Setup Guide

## Overview

The Dark DeFi Terminal is a cyberpunk-themed web application that provides:

1. **XAI-Powered Agent** - Grok 4 integration for protocol explanations
2. **Interactive Examples** - Complete code samples for all integrations
3. **Protocol Documentation** - Comprehensive technical details
4. **Live Stats** - Real-time protocol metrics

## Features

### 🤖 AI Agent (XAI Grok)

The Dark Agent is powered by XAI's Grok model and has complete knowledge of:

- Zcash Sapling cryptography on Solana
- Shielded wallet implementation
- Private transfer mechanics
- FHE encrypted trading
- Dark pool architecture
- TEE-secured AI agents
- Cross-chain bridging
- Encrypted assets (eAssets)

**Ask anything:**
- "How does Zcash privacy work on Solana?"
- "Show me shielded wallet code examples"
- "Explain FHE encrypted trading"
- "How do dark pools prevent MEV?"

### 🔧 Integration Examples

**8 Complete Examples:**

1. **🛡️ Shielded Wallet Integration**
   - Create HD wallets with ZIP-32
   - Generate unlimited diversified addresses
   - Zcash-compatible 43-byte addresses

2. **🔒 Private Transfer**
   - ChaCha20-Poly1305 encryption
   - Hidden sender/receiver/amount
   - Zero-knowledge proofs

3. **🔍 Scan for Incoming Notes**
   - Decrypt with incoming viewing key
   - Calculate private balance
   - View transaction memos

4. **🌑 Dark Pool Trading**
   - MEV-resistant swaps
   - FHE encrypted amounts
   - Hidden liquidity

5. **💎 Encrypted Assets (eAssets)**
   - Wrap SOL → eSOL
   - Trade with privacy
   - Unwrap with ZK proofs

6. **🤖 TEE-Secured AI Agent**
   - Autonomous trading
   - TEE attestation
   - Private strategy execution

7. **🌉 Cross-Chain Bridge**
   - One-transaction deposits
   - ETH/BTC → Solana
   - Privacy preserved

8. **👁️ Selective Disclosure**
   - View keys for auditors
   - Compliance without compromise
   - No spending access

### 📚 Documentation

Complete protocol documentation:
- Protocol Overview
- Privacy Guarantees
- Technical Architecture
- Security Model

### 📊 Stats

Live protocol metrics:
- Program IDs
- Network status
- Privacy level
- Encryption type

## Setup Instructions

### Option 1: Quick Start (HTML File)

1. **Open the Terminal:**
   ```bash
   open dark-defi-terminal.html
   ```

2. **Configure XAI API Key:**
   - Open the HTML file in a text editor
   - Find `process.env.XAI_API_KEY || 'YOUR_XAI_API_KEY'`
   - Replace with your actual XAI API key

3. **Use the Terminal:**
   - Click "AI AGENT" tab to chat with Grok
   - Click examples to see code
   - Ask questions about the protocol

### Option 2: Production Setup (React App)

1. **Install Dependencies:**
   ```bash
   npm install react react-dom
   npm install @dark-protocol/sdk
   ```

2. **Environment Variables:**
   ```bash
   # .env
   XAI_API_KEY=your_xai_api_key_here
   HELIUS_API_KEY=your_helius_key_here
   ```

3. **Integration Code:**
   ```typescript
   // App.tsx
   import { DarkProtocolClient } from '@dark-protocol/sdk';

   const client = await DarkProtocolClient.create({
       heliusApiKey: process.env.HELIUS_API_KEY!,
       rpcUrl: 'https://api.devnet.solana.com'
   });
   ```

## XAI Integration Details

### API Configuration

```javascript
const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${XAI_API_KEY}`
    },
    body: JSON.stringify({
        model: 'grok-beta',
        messages: [
            {
                role: 'system',
                content: 'You are the Dark DeFi Agent...'
            },
            {
                role: 'user',
                content: userQuestion
            }
        ],
        temperature: 0.7,
        max_tokens: 1000
    })
});
```

### System Prompt

The agent is configured with comprehensive knowledge of:

- Dark Protocol architecture
- Zcash Sapling implementation
- FHE cryptography
- Zero-knowledge proofs
- Shielded wallet mechanics
- Private transfer flow
- Dark pool trading
- TEE agent deployment
- Cross-chain bridging

### Fallback Responses

If the XAI API is unavailable, the terminal includes intelligent fallback responses for:
- Shielded wallet questions
- Private transfer queries
- FHE encryption
- Dark pool mechanics
- AI agent deployment
- Cross-chain bridging

## Code Examples Breakdown

### Example 1: Shielded Wallet

```typescript
import { SaplingHDWallet, SaplingUtils } from '@dark-protocol/sdk';

// Generate wallet with mnemonic
const { wallet, mnemonic } = await SaplingUtils.generateWallet();

// Get default address (43 bytes, Zcash-compatible)
const address = wallet.getDefaultAddress();
console.log(address.toBase58()); // zs1abc...

// Generate diversified addresses
const addr1 = wallet.generateDiversifiedAddress(0);
const addr2 = wallet.generateDiversifiedAddress(1);
const addr3 = wallet.generateDiversifiedAddress(2);
```

**What This Does:**
- Creates HD wallet from BIP-39 mnemonic
- Generates Zcash Sapling addresses
- Each address is unlinkable
- All derivable from one seed

### Example 2: Private Transfer

```typescript
import { NoteEncryptionUtils } from '@dark-protocol/sdk';

// Create encrypted note
const encryptedNote = await NoteEncryptionUtils.createEncryptedNote({
    recipientAddress: bobAddress,
    value: 1_000_000_000n, // 1 SOL
    memo: "Payment for services",
    senderOvk: wallet.getFullViewingKey().ovk
});

// Submit to Solana
const tx = await client.program.methods
    .shieldTokensV2(
        new BN(1_000_000_000),
        Array.from(bobAddress.d),
        Array.from(bobAddress.pk_d),
        Buffer.from("Payment for services")
    )
    .rpc();
```

**Privacy Guarantees:**
- Sender: Hidden
- Receiver: Hidden
- Amount: Encrypted
- Memo: Encrypted
- Only participants know details

### Example 3: Scan Notes

```typescript
// Get incoming viewing key
const ivk = wallet.getIncomingViewingKey();

// Fetch notes
const notes = await client.program.account.note.all();

// Decrypt
for (const note of notes) {
    const plaintext = await NoteEncryptionUtils.tryDecryptNote(
        note.account,
        ivk,
        note.account.hSig
    );

    if (plaintext) {
        console.log('Value:', plaintext.value);
        console.log('Memo:', NoteEncryptionUtils.memoToString(plaintext.memo));
    }
}
```

**How It Works:**
- IVK tries to decrypt all notes
- Only your notes decrypt successfully
- Balance calculated locally
- Fully private scanning

### Example 4: Dark Pool Trading

```typescript
const swap = await darkPool.createPrivateSwap({
    inputToken: 'eSOL',
    outputToken: 'eBTC',
    inputAmount: 100_000_000_000n, // encrypted
    minOutputAmount: 3_200_000_000n, // encrypted
    slippageTolerance: 0.005
});

const tx = await darkPool.executePrivateSwap(swap, {
    wallet: shieldedWallet
});
```

**MEV Protection:**
- Order amounts encrypted (FHE)
- Matching done in encrypted space
- Random execution timing
- No mempool visibility

### Example 5: Encrypted Assets

```typescript
// Wrap SOL → eSOL
const wrapTx = await eAssetClient.wrap({
    baseToken: 'SOL',
    amount: 100_000_000_000n,
    recipient: shieldedAddress
});

// Trade eSOL → eBTC (private)
const swapTx = await darkPool.swap('eSOL', 'eBTC', amount);

// Unwrap eBTC → BTC
const unwrapTx = await eAssetClient.unwrap({
    encryptedToken: 'eBTC',
    amount: 2_000_000_000n,
    recipient: publicKey
});
```

**Privacy Flow:**
1. Public token → Encrypted asset
2. Trade in encrypted space
3. Unwrap to public (with ZK proof)

### Example 6: AI Agent

```typescript
const agent = await TEEAgentClient.deploy({
    name: 'DCA Bot',
    strategy: 'dollar_cost_average',
    parameters: {
        assetPair: 'eSOL/eBTC',
        buyAmount: 10_000_000_000n,
        interval: 86400
    },
    wallet: shieldedWallet
});

// Monitor trades
agent.on('trade', (trade) => {
    console.log('Agent traded:');
    console.log('Input:', trade.encryptedInput);
    console.log('Output:', trade.encryptedOutput);
});
```

**TEE Security:**
- Agent runs in trusted environment
- Cryptographic attestation
- Private strategy execution
- You maintain control

### Example 7: Cross-Chain Bridge

```typescript
// Bridge ETH from Ethereum
const bridge = await CrossChainBridge.deposit({
    token: 'ETH',
    amount: 5_000_000_000_000_000_000n, // 5 ETH
    recipient: shieldedAddress
});

// Receives eETH on Solana in < 30 seconds
const receipt = await bridge.waitForReceipt(bridge.id);
console.log('Received eETH:', receipt.encryptedBalance);
```

**Supported Chains:**
- Ethereum (< 30s)
- Bitcoin (< 10min)
- BSC, Polygon, Avalanche

### Example 8: View Keys

```typescript
// Export full viewing key
const fvk = wallet.getFullViewingKey();

// Share with auditor
const auditorWallet = SaplingHDWallet.fromViewingKey(fvk);

// Auditor sees all transactions
const history = await auditorWallet.getTransactionHistory();

// But CANNOT spend funds!
```

**Compliance:**
- Selective disclosure
- Audit without spending access
- Regulatory friendly
- User controlled

## Customization

### Styling

The terminal uses CSS variables for easy theming:

```css
:root {
    --terminal-bg: #0a0a0f;
    --neon-purple: #b366ff;
    --neon-cyan: #00fff9;
    --neon-pink: #ff0080;
    --neon-green: #39ff14;
}
```

### Adding Examples

Add new examples to the `EXAMPLES` object:

```javascript
const EXAMPLES = {
    yourExample: {
        title: "Your Example",
        description: "What it does",
        tags: ["Tag1", "Tag2"],
        code: `// Your code here`,
        explanation: "Detailed explanation"
    }
};
```

### Extending Documentation

Add sections to `DOCS`:

```javascript
const DOCS = {
    yourSection: {
        title: "Your Section",
        content: `Your documentation here`
    }
};
```

## Technical Details

### Architecture

```
┌─────────────────────────────────────┐
│      React Frontend (HTML)          │
│  - Terminal UI                      │
│  - Chat Interface                   │
│  - Example Browser                  │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│      XAI API (Grok)                 │
│  - Protocol Knowledge               │
│  - Code Generation                  │
│  - Technical Explanations           │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│      Dark Protocol SDK              │
│  - Shielded Wallets                 │
│  - Private Transfers                │
│  - Dark Pools                       │
│  - AI Agents                        │
└─────────────────────────────────────┘
```

### Dependencies

**Core:**
- React 18.2.0
- React DOM 18.2.0
- Babel Standalone 7.23.5

**APIs:**
- XAI API (Grok)
- Helius RPC
- Solana Web3.js

### Browser Compatibility

- Chrome/Edge: ✅
- Firefox: ✅
- Safari: ✅
- Mobile: ✅ (responsive)

## Usage Tips

### Getting the Most from the AI Agent

**Good Questions:**
- "How does Zcash privacy work on Solana?"
- "Show me shielded wallet code"
- "Explain FHE encrypted trading"
- "Dark pool MEV protection details"

**Ask for Specifics:**
- "What's the difference between IVK and FVK?"
- "How are nullifiers generated?"
- "Explain note encryption step-by-step"

**Request Code:**
- "Show me code for private transfers"
- "How to scan for incoming notes?"
- "Dark pool integration example"

### Exploring Examples

1. Click example cards to see full code
2. Read the explanation
3. Ask follow-up questions to the agent
4. Copy code for your project

### Understanding Privacy

**What's Hidden:**
- Sender/receiver identities
- Transfer amounts
- Transaction graph
- Wallet balances

**What's Visible:**
- Nullifiers (random hashes)
- Commitments (random hashes)
- ZK proofs (no data revealed)

## Security Notes

### API Keys

- Never commit API keys to git
- Use environment variables
- Rotate keys regularly
- Monitor usage

### Privacy

- The terminal is client-side only
- No data sent to servers (except XAI API)
- Messages not logged
- Privacy-first design

### Cryptography

- Zcash Sapling (battle-tested)
- ChaCha20-Poly1305 (AEAD)
- BLAKE2b (hashing)
- Zero-knowledge proofs (Groth16)

## Troubleshooting

### XAI API Not Working

**Issue:** Agent returns fallback responses

**Solutions:**
1. Check API key is correct
2. Verify API quota
3. Check network connectivity
4. Fallback responses still work!

### Code Examples Not Showing

**Issue:** Examples don't render

**Solutions:**
1. Refresh the page
2. Check browser console for errors
3. Verify JavaScript is enabled

### Styling Issues

**Issue:** Terminal looks broken

**Solutions:**
1. Clear browser cache
2. Check CSS loaded properly
3. Try different browser

## Next Steps

### For Developers

1. **Install Dark Protocol SDK:**
   ```bash
   npm install @dark-protocol/sdk
   ```

2. **Set Up Development Environment:**
   ```bash
   # Clone repo
   git clone https://github.com/your-repo/dark-protocol

   # Install dependencies
   cd dark-protocol && npm install

   # Build programs
   cargo build-sbf
   ```

3. **Deploy to Devnet:**
   ```bash
   solana config set --url devnet
   anchor deploy
   ```

4. **Integrate Examples:**
   - Copy code from terminal
   - Modify for your use case
   - Test on devnet first

### For Users

1. **Create Shielded Wallet:**
   - Use example code
   - Save mnemonic securely
   - Generate addresses

2. **Try Private Transfers:**
   - Shield tokens
   - Send privately
   - Scan for receipts

3. **Explore Dark Pools:**
   - Wrap to eAssets
   - Trade privately
   - No MEV risk

### For Researchers

1. **Study Cryptography:**
   - Zcash Sapling papers
   - FHE implementation
   - Zero-knowledge proofs

2. **Analyze Privacy:**
   - Unlinkability guarantees
   - Information theory
   - Attack vectors

3. **Contribute:**
   - Submit improvements
   - Report bugs
   - Write documentation

## Resources

### Official Links

- **Dark Protocol:** `3KWLFYco7T2rUZkzjSSthjHGmbWmo9HAsRmvupDTomGC`
- **Shielded Wallet:** `4753b1cCrPzwr7taWWD8yrcM8dc98fTR7wCFdv1TsAbg`
- **Explorer:** https://explorer.solana.com/address/[program-id]?cluster=devnet

### Documentation

- SDK Integration Guide
- Protocol Overview
- Zcash Integration
- FHE Implementation

### Community

- GitHub Issues
- Discord (coming soon)
- Twitter Updates

## License

Open source - built for the Solana ecosystem.

---

**🌑 Welcome to Dark DeFi**

*Where Privacy Meets Performance*

Built with ❤️ for financial freedom
