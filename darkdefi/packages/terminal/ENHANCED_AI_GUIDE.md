# 🤖 Enhanced Google Gen AI Agent - Complete Guide

## Features

The Enhanced Google Gen AI Agent includes:

✅ **Solana Mainnet Integration** via Helius RPC
✅ **Function Calling** for blockchain operations
✅ **Image Understanding** (object detection, chart analysis, OCR)
✅ **Video Analysis** (summarization, transcription)
✅ **Audio Processing** (transcription, analysis)
✅ **PDF/Document Understanding**
✅ **Real-time Blockchain Queries**
✅ **Autonomous DeFi Operations**

---

## Setup

### 1. Environment Variables

Your `.env` file already has:
```bash
GOOGLE_GENERATIVE_AI_API_KEY=AIzaSyAdNysDBqAEN_TwZOIqrB7K9ZBcsbm-I2w
HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_HELIUS_API_KEY
```

### 2. Import the Agent

```typescript
import { EnhancedGoogleGenAIAgent } from './enhanced-google-ai-agent';
import { DarkProtocolClient, DarkWallet, PrivateSwapManager } from '../Protocol';

// Initialize
const client = await DarkProtocolClient.create({
  heliusApiKey: process.env.HELIUS_API_KEY!,
  network: 'mainnet',
});

const enhancedAI = new EnhancedGoogleGenAIAgent(
  process.env.GOOGLE_GENERATIVE_AI_API_KEY!,
  process.env.HELIUS_RPC_URL!
);
```

---

## Usage Examples

### Example 1: Create Agent with Blockchain Access

```typescript
const wallet = await DarkWallet.generate(client);
const swapManager = new PrivateSwapManager(client);

const agent = await enhancedAI.createAgent({
  name: 'SolanaTrader-Pro',
  capabilities: ['blockchain_query', 'swap', 'analyze', 'image_understanding'],
  wallet: wallet.wallet,
  swapManager,
  model: 'gemini-2.5-flash',
});

console.log(`Agent created: ${agent.id}`);
```

### Example 2: Query Blockchain Data

```typescript
// Agent automatically calls Solana RPC via function calling

const response = await enhancedAI.chat(
  agent.id,
  "What's the SOL balance of my wallet?"
);

// Agent will:
// 1. Call get_sol_balance function
// 2. Query Helius RPC
// 3. Return formatted response

console.log(response.text);
// Output: "Your wallet has 2.5 SOL (2,500,000,000 lamports)."
```

### Example 3: Analyze Trading Chart

```typescript
// Analyze a chart image
const chartAnalysis = await enhancedAI.analyzeChart(
  agent.id,
  '/path/to/solana-chart.png'
);

console.log(chartAnalysis.text);
/* Output:
"This SOL/USD chart shows:
- Strong upward trend with higher highs and higher lows
- Currently at $150, up 15% in 24h
- Support level at $145, resistance at $155
- RSI at 65 (bullish but not overbought)
- Volume increasing, confirming the trend
- RECOMMENDATION: Good entry point for long position with stop loss at $144"
*/
```

### Example 4: Image Understanding - Object Detection

```typescript
const response = await enhancedAI.chat(
  agent.id,
  [
    { text: 'Detect all objects in this image and provide bounding boxes' },
    {
      inlineData: {
        mimeType: 'image/jpeg',
        data: fs.readFileSync('/path/to/image.jpg', 'base64'),
      },
    },
  ]
);

// Agent detects: charts, logos, text, UI elements
console.log(response.text);
```

### Example 5: Portfolio Analysis with Function Calling

```typescript
const response = await enhancedAI.chat(
  agent.id,
  "Analyze my portfolio and suggest optimizations"
);

// Agent will:
// 1. Call analyze_portfolio function
// 2. Call get_token_accounts function
// 3. Query current prices
// 4. Provide comprehensive analysis

console.log(response.text);
/* Output:
"Portfolio Analysis:
- Total Value: $375 (2.5 SOL)
- Shielded: 1.5 SOL (60% - Good privacy!)
- Transparent: 1.0 SOL (40%)
- Risk Level: Medium

Recommendations:
1. Shield remaining 1.0 SOL for enhanced privacy (Confidence: 95%)
2. Diversify 25% into USDC for stability (Confidence: 80%)
3. Consider staking 0.5 SOL for passive income (Confidence: 70%)

Next Actions:
ACTION: shield
PARAMS: {"amount": 1.0}
CONFIDENCE: 95
REASON: Maximize privacy by shielding transparent balance"
*/
```

### Example 6: Execute Swap via Function Calling

```typescript
const response = await enhancedAI.chat(
  agent.id,
  "I want to swap 0.5 SOL for USDC with 0.5% slippage"
);

// Agent will:
// 1. Call execute_swap function
// 2. Get quote from Jupiter
// 3. Ask for confirmation
// 4. Execute if approved

console.log(response.text);
console.log('Function calls:', response.functionCalls);
/* Output:
"I can execute a swap of 0.5 SOL for approximately 75.5 USDC.

Quote Details:
- Input: 0.5 SOL
- Expected Output: 75.5 USDC
- Price Impact: 0.02%
- Slippage: 0.5%
- Platform Fee: 0.2%

Would you like me to proceed with this swap?"
*/
```

### Example 7: Video Analysis

```typescript
const response = await enhancedAI.analyzeVideo(
  agent.id,
  '/path/to/trading-tutorial.mp4',
  'Summarize this trading tutorial and extract key strategies'
);

console.log(response.text);
/* Output:
"Video Summary (5:30 duration):

00:00-01:00: Introduction to support/resistance levels
01:00-02:30: RSI indicator explained (buy below 30, sell above 70)
02:30-04:00: Moving average crossover strategy (50-day vs 200-day)
04:00-05:30: Risk management: Never risk more than 2% per trade

Key Strategies:
1. Wait for RSI confirmation before entries
2. Use moving average crossovers for trend direction
3. Set stop losses at support/resistance levels
4. Take profits at predetermined targets

Timestamps of Key Moments:
- 01:15: RSI buy signal example
- 03:45: Perfect MA crossover trade
- 05:10: Risk management rules"
*/
```

### Example 8: Audio Transcription

```typescript
const response = await enhancedAI.analyzeAudio(
  agent.id,
  '/path/to/market-update.mp3',
  'Transcribe this market update and summarize key points'
);

console.log(response.text);
/* Output:
"Transcript:

'Good morning traders, this is your daily market update for January 15th.
SOL has broken above the $150 resistance level with strong volume...
Bitcoin showing consolidation at $45,000...
Fed meeting minutes suggest dovish stance...'

Summary:
1. SOL bullish breakout above $150 (strong buy signal)
2. BTC consolidating (wait for direction)
3. Fed dovish = positive for crypto
4. Recommended action: Long SOL with $145 stop loss"
*/
```

### Example 9: PDF Document Analysis

```typescript
const pdfData = fs.readFileSync('/path/to/whitepaper.pdf', 'base64');

const response = await enhancedAI.chat(
  agent.id,
  [
    { text: 'Summarize this whitepaper and identify key tokenomics' },
    {
      inlineData: {
        mimeType: 'application/pdf',
        data: pdfData,
      },
    },
  ]
);

console.log(response.text);
```

### Example 10: Multi-Modal Analysis (Image + Text)

```typescript
const response = await enhancedAI.chat(
  agent.id,
  "Compare this chart with current market data and provide trading signal",
  {
    images: ['/path/to/historical-chart.png'],
  }
);

// Agent will:
// 1. Analyze the chart image
// 2. Query current blockchain data via functions
// 3. Compare patterns
// 4. Provide actionable signal

console.log(response.text);
```

### Example 11: Recent Transactions Analysis

```typescript
const response = await enhancedAI.chat(
  agent.id,
  "Show me my recent transactions and identify any suspicious activity"
);

// Agent calls get_recent_transactions function
console.log(response.text);
/* Output:
"Your Recent Transactions (Last 5):

1. [2 hours ago] Swap: 0.5 SOL → 75 USDC ✓
   Signature: 2ZE7...
   Status: Confirmed

2. [5 hours ago] Transfer: Received 1.0 SOL ✓
   Signature: 3Xa9...
   From: DRK...xyz

3. [1 day ago] Shield: 1.5 SOL ✓
   Privacy Score: 100%

No suspicious activity detected. All transactions appear legitimate."
*/
```

### Example 12: Get All Token Holdings

```typescript
const response = await enhancedAI.chat(
  agent.id,
  "List all my token holdings with current values"
);

// Agent calls get_token_accounts function
console.log(response.text);
/* Output:
"Your Token Holdings:

1. SOL: 2.5 (Native)
   Value: ~$375

2. USDC: 100.0
   Mint: EPjF...
   Value: $100

3. BONK: 1,000,000
   Mint: DezX...
   Value: ~$25

Total Portfolio Value: ~$500"
*/
```

---

## Function Calling Capabilities

The agent has these built-in functions:

### 1. `get_sol_balance`
Query SOL balance of any address
```typescript
// Auto-called when user asks about balance
"What's my SOL balance?"
"Check balance of DRK...xyz"
```

### 2. `get_token_accounts`
Get all SPL tokens for a wallet
```typescript
"List all my tokens"
"What tokens do I have?"
```

### 3. `get_recent_transactions`
Fetch recent transaction history
```typescript
"Show my recent transactions"
"What did I do yesterday?"
```

### 4. `execute_swap`
Get swap quote via Jupiter
```typescript
"Quote me 0.5 SOL to USDC"
"How much USDC can I get for 1 SOL?"
```

### 5. `analyze_portfolio`
Comprehensive portfolio analysis
```typescript
"Analyze my portfolio"
"How's my risk profile?"
```

---

## Image Understanding Capabilities

### Chart Analysis
```typescript
await enhancedAI.analyzeChart(agentId, 'chart.png');
```

Detects:
- Trend lines
- Support/resistance
- Indicators (RSI, MACD, etc.)
- Volume patterns
- Price action

### Object Detection
```typescript
await enhancedAI.chat(agentId, [
  { text: 'Detect all objects with bounding boxes' },
  { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } }
]);
```

Detects:
- UI elements
- Logos
- Charts
- Text
- Diagrams

### OCR / Text Extraction
```typescript
await enhancedAI.chat(agentId, [
  { text: 'Extract all text from this image' },
  { inlineData: { mimeType: 'image/png', data: screenshotBase64 } }
]);
```

---

## Video Understanding Capabilities

### Video Summarization
```typescript
await enhancedAI.analyzeVideo(
  agentId,
  'tutorial.mp4',
  'Summarize key points with timestamps'
);
```

### Transcript with Visual Description
```typescript
await enhancedAI.chat(agentId, [
  { text: 'Transcribe audio and describe visual events' },
  { inlineData: { mimeType: 'video/mp4', data: videoBase64 } }
]);
```

---

## Audio Understanding Capabilities

### Transcription
```typescript
await enhancedAI.analyzeAudio(
  agentId,
  'meeting.mp3',
  'Transcribe this audio'
);
```

### Sound Analysis
```typescript
await enhancedAI.chat(agentId, [
  { text: 'Identify all sounds in this audio' },
  { inlineData: { mimeType: 'audio/wav', data: audioBase64 } }
]);
```

---

## Advanced Usage

### Custom System Instructions

```typescript
const agent = await enhancedAI.createAgent({
  name: 'CustomAgent',
  capabilities: ['custom'],
  wallet,
  swapManager,
});

// Agent's system prompt is automatically generated with:
// - Solana network info
// - Wallet context
// - Available tools
// - Multimodal capabilities
```

### Streaming Responses

```typescript
// For long responses, use streaming
const chat = model.startChat({ history });
const result = await chat.sendMessageStream(parts);

for await (const chunk of result.stream) {
  console.log(chunk.text());
}
```

### Error Handling

```typescript
try {
  const response = await enhancedAI.chat(agentId, message);

  if (response.functionCalls) {
    console.log('Functions called:', response.functionCalls);
  }

  console.log(response.text);
} catch (error) {
  if (error.message.includes('API key')) {
    console.error('Check GOOGLE_GENERATIVE_AI_API_KEY');
  } else if (error.message.includes('quota')) {
    console.error('API quota exceeded');
  } else {
    console.error('Error:', error.message);
  }
}
```

---

## Best Practices

### 1. Image Analysis
- Use clear, high-resolution images
- For charts, ensure axes and labels are visible
- Provide context in your prompt

### 2. Function Calling
- Let the agent decide when to call functions
- Don't override function parameters
- Handle function results gracefully

### 3. Privacy
- Don't send sensitive private keys to the AI
- Use wallet addresses, not private keys
- Review agent actions before execution

### 4. Performance
- Use `gemini-2.5-flash` for fast responses
- Use `gemini-2.5-pro` for complex analysis
- Cache frequently used images/videos

### 5. Costs
- Images: ~258 tokens per image
- Video: ~300 tokens per second
- Audio: ~32 tokens per second
- Function calls: Free (just input/output tokens)

---

## Troubleshooting

### "API key invalid"
```bash
# Check .env file
echo $GOOGLE_GENERATIVE_AI_API_KEY
```

### "Function not found"
```typescript
// Ensure tool is registered
const agent = await enhancedAI.createAgent({
  // tools are auto-registered
});
```

### "RPC connection failed"
```bash
# Check Helius RPC URL
echo $HELIUS_RPC_URL
```

### "Image too large"
```typescript
// Max 20MB inline, use File API for larger
const file = await genAI.uploadFile(largefile);
```

---

## Complete Example: Trading Assistant

```typescript
import { EnhancedGoogleGenAIAgent } from './enhanced-google-ai-agent';

async function tradingAssistant() {
  const enhancedAI = new EnhancedGoogleGenAIAgent(
    process.env.GOOGLE_GENERATIVE_AI_API_KEY!,
    process.env.HELIUS_RPC_URL!
  );

  const agent = await enhancedAI.createAgent({
    name: 'TradingPro',
    capabilities: ['blockchain', 'swap', 'analyze', 'image'],
    wallet,
    swapManager,
  });

  // 1. Analyze chart
  console.log('Analyzing chart...');
  const chartAnalysis = await enhancedAI.analyzeChart(
    agent.id,
    'sol-chart.png'
  );
  console.log(chartAnalysis.text);

  // 2. Check portfolio
  console.log('\nChecking portfolio...');
  const portfolio = await enhancedAI.chat(
    agent.id,
    'Analyze my portfolio and suggest actions'
  );
  console.log(portfolio.text);

  // 3. Get swap quote
  console.log('\nGetting swap quote...');
  const quote = await enhancedAI.chat(
    agent.id,
    'Quote me 0.5 SOL to USDC'
  );
  console.log(quote.text);

  // 4. Execute if confirmed
  if (await confirmAction()) {
    const swap = await enhancedAI.chat(
      agent.id,
      'Execute the swap'
    );
    console.log(swap.text);
  }
}

tradingAssistant();
```

---

## 🎉 You're Ready!

The Enhanced Google Gen AI Agent is fully integrated with:
- ✅ Solana mainnet via Helius
- ✅ Function calling for blockchain ops
- ✅ Image/video/audio understanding
- ✅ Autonomous DeFi operations

Start building intelligent, multimodal trading agents! 🚀
