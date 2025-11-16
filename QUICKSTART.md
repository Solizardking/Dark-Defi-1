# 🚀 Dark X402 Terminal - Quick Start Guide

Get up and running with the Dark X402 Terminal in 5 minutes!

---

## ⚡ Quick Install

```bash
cd terminal
chmod +x install.sh
./install.sh
```

The installer will:
- ✅ Check Node.js version (18+ required)
- ✅ Install all dependencies
- ✅ Create `.env` configuration file
- ✅ Build the terminal

---

## 🔑 Configure API Keys

Edit the `.env` file:

```bash
nano .env
```

Add your Helius API key (required):

```env
HELIUS_API_KEY=your_actual_api_key_here
```

### Get API Keys

| Service | Required | Purpose | Sign Up |
|---------|----------|---------|---------|
| **Helius** | ✅ **Required** | Solana RPC access | [helius.dev](https://helius.dev) → Free tier available |
| **Jupiter** | ⚠️ Recommended | Token swaps | [station.jup.ag/api-keys](https://station.jup.ag/api-keys) |
| **Google AI** | 🎯 Optional | AI agents | [makersuite.google.com](https://makersuite.google.com/app/apikey) |
| **RedPill** | 🔐 Optional | TEE verification | [redpill.ai](https://redpill.ai) |

---

## 🎮 Start the Terminal

```bash
npm start
```

You'll see:

```
  ██████╗  █████╗ ██████╗ ██╗  ██╗    ██╗  ██╗██╗  ██╗ ██████╗ ██████╗
  ██╔══██╗██╔══██╗██╔══██╗██║ ██╔╝    ╚██╗██╔╝██║  ██║██╔═████╗╚════██╗
  ██║  ██║███████║██████╔╝█████╔╝      ╚███╔╝ ███████║██║██╔██║ █████╔╝
  ██║  ██║██╔══██║██╔══██╗██╔═██╗      ██╔██╗ ╚════██║████╔╝██║██╔═══╝
  ██████╔╝██║  ██║██║  ██║██║  ██╗    ██╔╝ ██╗     ██║╚██████╔╝███████╗
  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝    ╚═╝  ╚═╝     ╚═╝ ╚═════╝ ╚══════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    Privacy-First DeFi Terminal with AI Agents & Shielded Swaps
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 📖 First Steps

### 1. Create Your Wallet

On first run, you'll be prompted:

```
? Wallet Setup:
  🆕 Create new wallet
  🔑 Import from mnemonic
  📂 Import from private key
```

**Choose "Create new wallet"**

You'll receive a 24-word mnemonic phrase:

```
⚠️  SAVE THIS MNEMONIC PHRASE SECURELY ⚠️
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

word1 word2 word3 ... word24

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This phrase is the ONLY way to recover your wallet!
Never share it with anyone!
```

**⚠️ CRITICAL: Write down your mnemonic on paper and store it securely!**

### 2. Get Test SOL (Devnet)

```bash
# In a new terminal
solana airdrop 2 YOUR_WALLET_ADDRESS --url devnet
```

Or use: [solfaucet.com](https://solfaucet.com)

### 3. Explore the Main Menu

```
? Main Menu:
  🤖 X402 AI Agents
  🔄 Dark Swaps
  💼 Wallet Manager
  📊 Dashboard
  ⚙️  Settings
  🚪 Exit
```

---

## 🤖 Using AI Agents

### Launch Google Gen AI Agent

```
Main Menu → 🤖 X402 AI Agents → 🤖 Launch Google Gen AI Agent
```

Chat with your AI agent:

```
You: Analyze my portfolio

Agent: Based on your current holdings of 2 SOL in devnet:

1. Risk Assessment: LOW
   - Single asset concentration
   - Recommend diversification into stablecoins

2. Privacy Score: 85%
   - 1.5 SOL shielded (good!)
   - 0.5 SOL transparent (consider shielding)

3. Recommendations:
   - Shield remaining 0.5 SOL for enhanced privacy
   - Swap 25% into USDC for stability
   - Set up automated rebalancing

Would you like me to execute any of these actions?
```

### Deploy X402 Agent Swarm

```
Main Menu → 🤖 X402 AI Agents → 🔥 Deploy X402 Agent Swarm
```

Create multiple specialized agents:

```
? How many X402 agents to deploy? 3

Deploying X402 agent swarm...
✓ Deployed 3 X402 agents!

┌──────────┬───────────┬────────┬──────────────────────────┐
│ Agent ID │ Type      │ Status │ Capabilities             │
├──────────┼───────────┼────────┼──────────────────────────┤
│ x402-1a2 │ swap      │ Active │ swap, analyze            │
│ x402-3b4 │ arbitrage │ Active │ swap, analyze            │
│ x402-5c6 │ portfolio │ Active │ analyze, transfer        │
└──────────┴───────────┴────────┴──────────────────────────┘
```

---

## 🔄 Making Dark Swaps

### Execute a Private Swap

```
Main Menu → 🔄 Dark Swaps → 🔀 Execute Private Swap
```

Follow the prompts:

```
? Input token: SOL
? Output token: USDC
? Amount to swap: 0.5
? Slippage tolerance: 0.5%

Fetching best route...
✓ Quote received

📋 Quote Details:
─────────────────────────────────────────────────────────
Input Amount:     0.5 SOL (500000000 lamports)
Expected Output:  75.234 USDC (approx)
Price Impact:     0.0234%
Slippage:         0.5%
Platform Fee:     0.2%
─────────────────────────────────────────────────────────

? Execute this private swap? Yes

Executing private swap...
✓ Swap executed successfully!

Transaction: 3x4y5z... (view on Solscan)
```

**Privacy Features:**
- ✅ Transaction amounts hidden
- ✅ Routing path obfuscated
- ✅ MEV protection enabled
- ✅ Zero-knowledge proofs used

---

## 💼 Managing Your Wallet

### View Balances

```
Main Menu → 💼 Wallet Manager → 👁️ View Balances
```

```
💰 Wallet Balances
─────────────────────────────────────────────────────────
Shielded Balance:     1500000000 lamports
                      1.5 SOL

Transparent Balance:  500000000 lamports
                      0.5 SOL

Total Notes:          12
Pending Notes:        2
─────────────────────────────────────────────────────────
```

### Shield Tokens (Public → Private)

```
Main Menu → 💼 Wallet Manager → 🔐 Shield Tokens
```

```
🔐 Shield Tokens
Move tokens from transparent to shielded pool

? Amount to shield (SOL): 0.5
? Shield 0.5 SOL? Yes

Shielding tokens...
✓ Tokens shielded successfully!

Transaction: 7a8b9c...
```

**What happens:**
- Tokens moved from public balance to shielded balance
- Amount is now hidden from blockchain explorers
- Zero-knowledge proof generated to verify balance
- Privacy score increased

### Generate Sapling Addresses

```
Main Menu → 💼 Wallet Manager → 🌳 Sapling Addresses
```

```
🌳 Sapling Addresses

Default Address:
  zs1abc...xyz (full address)

? Action: ✨ Generate Diversified Addresses
? How many addresses? 5

┌───┬────────────────────────────────────────────────────┐
│ # │ Address                                            │
├───┼────────────────────────────────────────────────────┤
│ 1 │ zs1def...uvw                                       │
│ 2 │ zs1ghi...rst                                       │
│ 3 │ zs1jkl...opq                                       │
│ 4 │ zs1mno...lmn                                       │
│ 5 │ zs1pqr...ijk                                       │
└───┴────────────────────────────────────────────────────┘
```

**Benefits:**
- ✅ Unlimited addresses from one seed
- ✅ Each address unlinkable to others
- ✅ Enhanced privacy for receiving payments
- ✅ All controlled by same private key

---

## 📊 Dashboard

```
Main Menu → 📊 Dashboard
```

```
═══════════════════════════════════════════════════════════════════════════════
  DASHBOARD
═══════════════════════════════════════════════════════════════════════════════

💼 Wallet
  Shielded Balance: 1500000000 lamports
  Transparent Balance: 500000000 lamports
  Notes: 12

🤖 Agents
  Total: 3
  Active: 3
  Success Rate: 94.56%

📊 Recent Activity
┌─────────┬──────────┬────────────┬────────┐
│ Time    │ Type     │ Agent      │ Status │
├─────────┼──────────┼────────────┼────────┤
│ 2m ago  │ Swap     │ X402-1     │ ✓      │
│ 5m ago  │ Analysis │ Google-Gen │ ✓      │
│ 12m ago │ Transfer │ X402-2     │ ✓      │
└─────────┴──────────┴────────────┴────────┘
```

---

## 🎯 Common Workflows

### Workflow 1: Privacy-First Setup

```bash
# 1. Create wallet
Main Menu → Create new wallet

# 2. Get devnet SOL
solana airdrop 2 YOUR_ADDRESS --url devnet

# 3. Shield all tokens
Wallet Manager → Shield Tokens → 2 SOL

# 4. Generate diverse addresses
Wallet Manager → Sapling Addresses → Generate 10 addresses

# 5. Ready for private operations!
```

### Workflow 2: AI-Assisted Trading

```bash
# 1. Deploy agent swarm
X402 AI Agents → Deploy X402 Agent Swarm → 5 agents

# 2. Launch Google AI
X402 AI Agents → Launch Google Gen AI Agent

# 3. Ask for analysis
Chat: "What should I do with 2 SOL in current market?"

# 4. Execute recommended swaps
Follow agent recommendations

# 5. Monitor with dashboard
Dashboard → Check agent performance
```

### Workflow 3: Private DeFi Operations

```bash
# 1. Shield your capital
Wallet Manager → Shield Tokens

# 2. Get swap quote
Dark Swaps → Get Quote → SOL to USDC

# 3. Execute private swap
Dark Swaps → Execute Private Swap

# 4. Verify transaction
Dashboard → Recent Activity

# 5. Unshield if needed
Wallet Manager → Unshield Tokens
```

---

## ⚠️ Important Notes

### Security

- 🔐 **Never share your mnemonic phrase**
- 🔐 **Never share your private keys**
- 🔐 **Always verify transaction details**
- 🔐 **Test on devnet before mainnet**

### Privacy

- 🛡️ Shielded transactions hide amounts and recipients
- 🛡️ Use diversified Sapling addresses for receiving
- 🛡️ Higher privacy score = better anonymity
- 🛡️ MEV protection enabled by default

### Network Selection

```env
# .env file
NETWORK=devnet  # Safe for testing
# NETWORK=mainnet  # Use only after testing!
```

**Always test on devnet first!**

---

## 🐛 Troubleshooting

### "HELIUS_API_KEY required"

```bash
# Edit .env
nano .env

# Add your key
HELIUS_API_KEY=your_actual_key_here
```

### "Insufficient balance"

```bash
# Get devnet SOL
solana airdrop 2 YOUR_ADDRESS --url devnet

# Or use faucet
open https://solfaucet.com
```

### "Transaction failed"

- Check network status (devnet can be unstable)
- Verify you have enough SOL for fees
- Try reducing swap amount
- Increase slippage tolerance

### "Agent not responding"

- Verify GOOGLE_AI_API_KEY is set
- Check API quota limits
- Try restarting the terminal

---

## 📚 Learn More

- **Full Documentation**: [terminal/README.md](terminal/README.md)
- **Protocol Docs**: [Protocol/README.md](Protocol/README.md)
- **API Reference**: [docs/API.md](docs/API.md)
- **Examples**: [Protocol/examples.ts](Protocol/examples.ts)

---

## 🆘 Get Help

- **Issues**: [GitHub Issues](https://github.com/your-org/dark-protocol/issues)
- **Discord**: Coming Soon
- **Twitter**: [@DarkProtocol](https://twitter.com/DarkProtocol)

---

## 🎉 Next Steps

Now that you're set up:

1. ✅ **Experiment on devnet** - Try all features safely
2. ✅ **Deploy AI agents** - Let them optimize your portfolio
3. ✅ **Execute private swaps** - Experience true DeFi privacy
4. ✅ **Generate Sapling addresses** - Maximize anonymity
5. ✅ **Read the docs** - Learn advanced features

---

**🌑 Welcome to the future of private DeFi! 🌑**

Happy trading! 🚀
