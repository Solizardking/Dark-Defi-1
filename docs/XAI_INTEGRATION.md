# 🤖 XAI (Grok) Integration Reference

## Quick Setup

### 1. Get Your API Key

Visit https://console.x.ai/ and create an API key.

### 2. Configure Environment

```bash
# .env
XAI_API_KEY=xai-your-key-here
```

### 3. Basic Integration

```javascript
const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.XAI_API_KEY}`
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
                content: 'Explain shielded wallets'
            }
        ],
        temperature: 0.7,
        max_tokens: 1000
    })
});

const data = await response.json();
const answer = data.choices[0].message.content;
```

## System Prompt

```javascript
const SYSTEM_PROMPT = `You are the Dark DeFi Agent, an expert on the Dark Protocol - a privacy-first DeFi metaprotocol on Solana.

Your knowledge includes:
- Zcash Sapling cryptography ported to Solana
- Fully Homomorphic Encryption (FHE) for encrypted computations
- Zero-Knowledge proofs (ZK-SNARKs)
- Shielded wallets with unlimited diversified addresses
- Private transfers with note encryption
- Dark pools with MEV protection
- Encrypted assets (eSOL, eBTC, eETH)
- TEE-secured AI agents
- Cross-chain bridges

Program IDs:
- Dark Protocol: 3KWLFYco7T2rUZkzjSSthjHGmbWmo9HAsRmvupDTomGC
- Shielded Wallet: 4753b1cCrPzwr7taWWD8yrcM8dc98fTR7wCFdv1TsAbg

Be technical but accessible. Use code examples when relevant. Explain privacy guarantees clearly.`;
```

## Example Questions & Responses

### Question: "How does Zcash privacy work on Solana?"

**Expected Response:**
```
Dark Protocol ports Zcash Sapling cryptography to Solana through:

1. **Shielded Addresses:**
   - 43-byte Sapling addresses (zs1...)
   - Diversified addresses (unlimited)
   - ZIP-32 HD wallet derivation

2. **Note Encryption:**
   - ChaCha20-Poly1305 AEAD
   - Ephemeral keys (ECDH)
   - Hidden sender/receiver/amount

3. **Commitments & Nullifiers:**
   - Pedersen commitments hide values
   - Nullifiers prevent double-spend
   - Merkle tree tracks all notes

4. **Zero-Knowledge Proofs:**
   - Prove note ownership
   - Verify without revealing
   - ZK-SNARK (Groth16)

Code example:
```typescript
const { wallet, mnemonic } = await SaplingUtils.generateWallet();
const address = wallet.getDefaultAddress();
console.log(address.toBase58()); // zs1abc...
```
```

### Question: "Show me dark pool trading code"

**Expected Response:**
```
Dark pools provide MEV-resistant private trading:

```typescript
import { DarkPoolClient } from '@dark-protocol/sdk';

const darkPool = new DarkPoolClient({
    programId: DARK_PROTOCOL_PROGRAM_ID
});

// Create encrypted swap
const swap = await darkPool.createPrivateSwap({
    inputToken: 'eSOL',
    outputToken: 'eBTC',
    inputAmount: 100_000_000_000n, // 100 SOL (encrypted)
    minOutputAmount: 3_200_000_000n, // 3.2 BTC (encrypted)
    slippageTolerance: 0.005
});

// Execute with MEV protection
const tx = await darkPool.executePrivateSwap(swap, {
    wallet: shieldedWallet
});
```

How it works:
- Order amounts encrypted with FHE
- Matching in encrypted space
- Random execution timing
- No mempool visibility
```

### Question: "What's the difference between IVK and FVK?"

**Expected Response:**
```
Key hierarchy in Dark Protocol:

**Spending Key (SK):**
- Master secret key
- NEVER share!
- Can spend funds

**Full Viewing Key (FVK):**
- Derived from SK
- Views ALL transactions (incoming + outgoing)
- Safe to share with auditors
- CANNOT spend

**Incoming Viewing Key (IVK):**
- Derived from FVK
- Views ONLY incoming transactions
- For scanning notes
- CANNOT spend

Example:
```typescript
const sk = wallet.getSpendingKey();    // SECRET!
const fvk = wallet.getFullViewingKey(); // Share with auditor
const ivk = wallet.getIncomingViewingKey(); // For scanning

// Auditor workflow
const auditorWallet = SaplingHDWallet.fromViewingKey(fvk);
const history = await auditorWallet.getTransactionHistory();
// Auditor sees everything but cannot spend
```
```

## Advanced Configuration

### Streaming Responses

```javascript
const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${XAI_API_KEY}`
    },
    body: JSON.stringify({
        model: 'grok-beta',
        messages: messages,
        stream: true // Enable streaming
    })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n').filter(line => line.trim());

    for (const line of lines) {
        if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            const content = data.choices[0].delta.content;
            if (content) {
                process.stdout.write(content);
            }
        }
    }
}
```

### Context Management

```javascript
class ChatContext {
    constructor() {
        this.messages = [];
        this.maxMessages = 20; // Keep last 20 messages
    }

    addMessage(role, content) {
        this.messages.push({ role, content });

        // Trim if too long
        if (this.messages.length > this.maxMessages) {
            this.messages = this.messages.slice(-this.maxMessages);
        }
    }

    getMessages() {
        return [
            {
                role: 'system',
                content: SYSTEM_PROMPT
            },
            ...this.messages
        ];
    }
}

const context = new ChatContext();
context.addMessage('user', 'How does FHE work?');

const response = await fetch('https://api.x.ai/v1/chat/completions', {
    // ...
    body: JSON.stringify({
        model: 'grok-beta',
        messages: context.getMessages()
    })
});
```

### Error Handling

```javascript
async function askGrok(question) {
    try {
        const response = await fetch('https://api.x.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${XAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'grok-beta',
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: question }
                ]
            })
        });

        if (!response.ok) {
            throw new Error(`XAI API error: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;

    } catch (error) {
        console.error('XAI API failed:', error);

        // Return fallback response
        return getFallbackResponse(question);
    }
}
```

## Fallback System

When XAI API is unavailable, use topic-based fallbacks:

```javascript
function getFallbackResponse(question) {
    const q = question.toLowerCase();

    const topics = {
        wallet: {
            keywords: ['wallet', 'shielded', 'address', 'sapling'],
            response: `Shielded Wallet uses Zcash Sapling cryptography...`
        },
        transfer: {
            keywords: ['transfer', 'send', 'private', 'payment'],
            response: `Private transfers use ChaCha20-Poly1305 encryption...`
        },
        fhe: {
            keywords: ['fhe', 'homomorphic', 'encrypted computation'],
            response: `FHE enables operations on encrypted data...`
        },
        darkpool: {
            keywords: ['dark pool', 'mev', 'trading', 'swap'],
            response: `Dark pools provide MEV-resistant trading...`
        }
    };

    for (const [key, topic] of Object.entries(topics)) {
        if (topic.keywords.some(kw => q.includes(kw))) {
            return topic.response;
        }
    }

    return `I'm the Dark DeFi Agent. Ask me about shielded wallets, private transfers, FHE, dark pools, or AI agents!`;
}
```

## Rate Limiting

```javascript
class RateLimiter {
    constructor(requestsPerMinute = 60) {
        this.limit = requestsPerMinute;
        this.requests = [];
    }

    async checkLimit() {
        const now = Date.now();
        this.requests = this.requests.filter(t => now - t < 60000);

        if (this.requests.length >= this.limit) {
            const oldestRequest = this.requests[0];
            const waitTime = 60000 - (now - oldestRequest);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            return this.checkLimit();
        }

        this.requests.push(now);
    }
}

const limiter = new RateLimiter(60);

async function askWithRateLimit(question) {
    await limiter.checkLimit();
    return askGrok(question);
}
```

## Cost Optimization

### Token Counting

```javascript
function estimateTokens(text) {
    // Rough estimate: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
}

function optimizePrompt(systemPrompt, userMessage) {
    const systemTokens = estimateTokens(systemPrompt);
    const userTokens = estimateTokens(userMessage);
    const total = systemTokens + userTokens;

    console.log('Estimated cost:');
    console.log(`  System: ${systemTokens} tokens`);
    console.log(`  User: ${userTokens} tokens`);
    console.log(`  Total: ${total} tokens`);

    // Warn if expensive
    if (total > 2000) {
        console.warn('Warning: Large prompt, may be expensive!');
    }

    return total;
}
```

### Caching Responses

```javascript
class ResponseCache {
    constructor(ttl = 3600000) { // 1 hour default
        this.cache = new Map();
        this.ttl = ttl;
    }

    get(key) {
        const entry = this.cache.get(key);
        if (!entry) return null;

        if (Date.now() - entry.timestamp > this.ttl) {
            this.cache.delete(key);
            return null;
        }

        return entry.value;
    }

    set(key, value) {
        this.cache.set(key, {
            value,
            timestamp: Date.now()
        });
    }
}

const cache = new ResponseCache();

async function askWithCache(question) {
    const cached = cache.get(question);
    if (cached) {
        console.log('Cache hit!');
        return cached;
    }

    const response = await askGrok(question);
    cache.set(question, response);
    return response;
}
```

## Testing

### Unit Tests

```javascript
describe('XAI Integration', () => {
    it('should handle successful responses', async () => {
        const response = await askGrok('What is Dark Protocol?');
        expect(response).toContain('privacy');
        expect(response).toContain('Solana');
    });

    it('should handle errors gracefully', async () => {
        // Mock failed API
        global.fetch = jest.fn(() => Promise.reject('API Error'));

        const response = await askGrok('Test question');
        expect(response).toBeTruthy(); // Fallback should work
    });

    it('should respect rate limits', async () => {
        const limiter = new RateLimiter(2);

        await limiter.checkLimit(); // 1st request
        await limiter.checkLimit(); // 2nd request

        const start = Date.now();
        await limiter.checkLimit(); // 3rd request (should wait)
        const elapsed = Date.now() - start;

        expect(elapsed).toBeGreaterThan(50000); // Waited ~1 minute
    });
});
```

### Integration Tests

```javascript
async function testFullConversation() {
    const questions = [
        'What is Dark Protocol?',
        'How do shielded wallets work?',
        'Show me private transfer code',
        'Explain FHE encryption'
    ];

    for (const question of questions) {
        console.log(`\nQ: ${question}`);

        const answer = await askGrok(question);
        console.log(`A: ${answer}\n`);

        // Validate response quality
        assert(answer.length > 100, 'Response too short');
        assert(answer.includes('Dark Protocol') || 
               answer.includes('privacy') ||
               answer.includes('Solana'), 'Relevant response');
    }

    console.log('✓ All tests passed!');
}
```

## Best Practices

### 1. Clear System Prompts

```javascript
// ✓ Good: Specific and detailed
const goodPrompt = `You are an expert on Dark Protocol, a privacy-first DeFi metaprotocol on Solana. Your knowledge includes Zcash cryptography, FHE, ZK-SNARKs, and shielded wallets. Be technical but accessible.`;

// ✗ Bad: Vague and generic
const badPrompt = `You are a helpful assistant.`;
```

### 2. Context Management

```javascript
// ✓ Good: Include relevant context
const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: 'Previous question' },
    { role: 'assistant', content: 'Previous answer' },
    { role: 'user', content: 'Follow-up question' }
];

// ✗ Bad: No context
const messages = [
    { role: 'user', content: 'Follow-up question' }
];
```

### 3. Error Recovery

```javascript
// ✓ Good: Graceful degradation
try {
    return await askGrok(question);
} catch (error) {
    console.error('API failed, using fallback');
    return getFallbackResponse(question);
}

// ✗ Bad: No fallback
try {
    return await askGrok(question);
} catch (error) {
    throw error; // User sees error!
}
```

## Monitoring

### Track Usage

```javascript
class UsageMonitor {
    constructor() {
        this.stats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            totalTokens: 0
        };
    }

    logRequest(success, tokens) {
        this.stats.totalRequests++;
        if (success) {
            this.stats.successfulRequests++;
            this.stats.totalTokens += tokens;
        } else {
            this.stats.failedRequests++;
        }
    }

    getStats() {
        return {
            ...this.stats,
            successRate: this.stats.successfulRequests / this.stats.totalRequests,
            avgTokensPerRequest: this.stats.totalTokens / this.stats.successfulRequests
        };
    }
}

const monitor = new UsageMonitor();
```

### Logging

```javascript
function logInteraction(question, answer, duration) {
    console.log({
        timestamp: new Date().toISOString(),
        question: question.slice(0, 100),
        answerLength: answer.length,
        duration: `${duration}ms`,
        tokens: estimateTokens(question + answer)
    });
}
```

## Production Checklist

- [ ] API key in environment variable
- [ ] Rate limiting implemented
- [ ] Error handling with fallbacks
- [ ] Response caching enabled
- [ ] Usage monitoring active
- [ ] Cost alerts configured
- [ ] Logging implemented
- [ ] Tests passing

## Resources

- **XAI Documentation:** https://docs.x.ai
- **XAI Console:** https://console.x.ai
- **API Reference:** https://api.x.ai/docs
- **Support:** support@x.ai

---

**Built for Dark DeFi Terminal**

*Privacy-first AI assistance*
