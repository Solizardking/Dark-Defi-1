#!/usr/bin/env ts-node
/**
 * Dark DeFi Terminal — Local Development Server
 *
 * Serves the terminal UI at http://localhost:<PORT>
 * and proxies AI/API calls server-side so keys NEVER
 * leave your machine or appear in the browser.
 *
 * Run:  npm run serve
 * Or:   npx ts-node local-server.ts
 */

import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as dotenv from 'dotenv';
import { IncomingMessage, ServerResponse } from 'http';
import {
  getTicker,
  getAllTickers,
  getOrderbook,
  getCandles,
  getExchangeSnapshot,
  getMarketList,
} from './phoenix-perps';

// ──────────────────────────────────────────────
// Load .env from the terminal package directory
// ──────────────────────────────────────────────
const envPath = path.resolve(__dirname, '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config(); // fallback to CWD
}

const PORT = parseInt(process.env.LOCAL_PORT || '3333', 10);
const HTML_FILE = path.resolve(__dirname, 'web', 'dark-defi-terminal.html');

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────
function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk: Buffer) => (body += chunk.toString()));
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function json(res: ServerResponse, status: number, data: object) {
  const payload = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
  });
  res.end(payload);
}

function setCors(res: ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:' + PORT);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// ──────────────────────────────────────────────
// Google Gemini chat proxy
// ──────────────────────────────────────────────
async function callGoogleAI(
  apiKey: string,
  messages: Array<{ role: string; content: string }>
): Promise<string> {
  const systemMsg = messages.find((m) => m.role === 'system')?.content ?? '';
  const userMessages = messages.filter((m) => m.role !== 'system');

  const geminiMessages = userMessages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const body = JSON.stringify({
    system_instruction: systemMsg ? { parts: [{ text: systemMsg }] } : undefined,
    contents: geminiMessages,
    generationConfig: {
      maxOutputTokens: 1000,
      temperature: 0.7,
    },
  });

  return new Promise((resolve, reject) => {
    const options: https.RequestOptions = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk: Buffer) => (data += chunk.toString()));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const text =
            parsed?.candidates?.[0]?.content?.parts?.[0]?.text ??
            'No response from Google AI.';
          resolve(text);
        } catch {
          reject(new Error('Failed to parse Google AI response'));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ──────────────────────────────────────────────
// XAI (Grok) chat proxy
// ──────────────────────────────────────────────
async function callXAI(
  apiKey: string,
  messages: Array<{ role: string; content: string }>
): Promise<string> {
  const body = JSON.stringify({
    model: 'grok-beta',
    messages,
    temperature: 0.7,
    max_tokens: 1000,
  });

  return new Promise((resolve, reject) => {
    const options: https.RequestOptions = {
      hostname: 'api.x.ai',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk: Buffer) => (data += chunk.toString()));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const text =
            parsed?.choices?.[0]?.message?.content ?? 'No response from XAI.';
          resolve(text);
        } catch {
          reject(new Error('Failed to parse XAI response'));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ──────────────────────────────────────────────
// Helius price data proxy
// ──────────────────────────────────────────────
async function getHeliusPrices(apiKey: string, mints: string[]): Promise<object> {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ mints });
    const options: https.RequestOptions = {
      hostname: 'api.helius.xyz',
      path: `/v0/token-metadata?api-key=${apiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (c: Buffer) => (data += c.toString()));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          reject(new Error('Failed to parse Helius response'));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ──────────────────────────────────────────────
// Route handlers
// ──────────────────────────────────────────────
async function handleChat(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  const body = await readBody(req);
  let messages: Array<{ role: string; content: string }>;

  try {
    ({ messages } = JSON.parse(body));
    if (!Array.isArray(messages)) throw new Error('messages must be an array');
  } catch (e) {
    json(res, 400, { error: 'Invalid JSON body — expected { messages: [...] }' });
    return;
  }

  // Try Google AI first, then XAI, then error
  if (process.env.GOOGLE_AI_API_KEY) {
    try {
      const reply = await callGoogleAI(process.env.GOOGLE_AI_API_KEY, messages);
      json(res, 200, { reply, provider: 'google-gemini' });
      return;
    } catch (err: any) {
      console.error('[chat] Google AI error:', err.message);
    }
  }

  if (process.env.XAI_API_KEY) {
    try {
      const reply = await callXAI(process.env.XAI_API_KEY, messages);
      json(res, 200, { reply, provider: 'xai-grok' });
      return;
    } catch (err: any) {
      console.error('[chat] XAI error:', err.message);
    }
  }

  if (process.env.REDPILL_API_KEY) {
    try {
      // RedPill is OpenAI-compatible — reuse XAI helper with different host
      const reply = await callOpenAICompat(
        process.env.REDPILL_API_KEY,
        'api.red-pill.ai',
        '/v1/chat/completions',
        'gpt-4o',
        messages
      );
      json(res, 200, { reply, provider: 'redpill' });
      return;
    } catch (err: any) {
      console.error('[chat] RedPill error:', err.message);
    }
  }

  json(res, 503, {
    error: 'No AI provider configured. Set GOOGLE_AI_API_KEY, XAI_API_KEY, or REDPILL_API_KEY in .env',
    reply: getFallbackReply(messages[messages.length - 1]?.content ?? ''),
    provider: 'local-fallback',
  });
}

async function callOpenAICompat(
  apiKey: string,
  hostname: string,
  path: string,
  model: string,
  messages: Array<{ role: string; content: string }>
): Promise<string> {
  const body = JSON.stringify({ model, messages, temperature: 0.7, max_tokens: 1000 });
  return new Promise((resolve, reject) => {
    const options: https.RequestOptions = {
      hostname,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(body),
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (c: Buffer) => (data += c.toString()));
      res.on('end', () => {
        try {
          const p = JSON.parse(data);
          resolve(p?.choices?.[0]?.message?.content ?? 'No response.');
        } catch {
          reject(new Error('Parse error'));
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function getFallbackReply(question: string): string {
  const q = question.toLowerCase();
  if (q.includes('wallet') || q.includes('shielded'))
    return '🛡️ Shielded wallets use Zcash Sapling cryptography. See the Integration Examples panel →';
  if (q.includes('transfer') || q.includes('private'))
    return '🔒 Private transfers use ChaCha20-Poly1305 encryption. Sender, receiver, and amount are all hidden.';
  if (q.includes('fhe') || q.includes('encrypt'))
    return '🔐 FHE (Fully Homomorphic Encryption) lets you compute on encrypted data. No decryption needed.';
  if (q.includes('dark pool') || q.includes('mev'))
    return '🌑 Dark pools match orders in encrypted space — no frontrunning, no MEV extraction possible.';
  if (q.includes('bridge') || q.includes('cross'))
    return '🌉 Cross-chain bridge: deposit ETH/BTC → receive eETH/eBTC on Solana in one transaction.';
  if (q.includes('agent') || q.includes('tee'))
    return '🤖 TEE agents run autonomously with cryptographic attestation. They trade privately on your behalf.';
  return '🌑 Dark DeFi Agent (offline fallback). Set an AI API key in .env to get live responses.';
}

// ──────────────────────────────────────────────
// Main server
// ──────────────────────────────────────────────
const server = http.createServer(async (req: IncomingMessage, res: ServerResponse) => {
  const url = req.url ?? '/';
  const method = req.method ?? 'GET';

  setCors(res);

  // Preflight
  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // ── GET / → serve the HTML terminal
  if (method === 'GET' && (url === '/' || url === '/index.html')) {
    try {
      const html = fs.readFileSync(HTML_FILE, 'utf-8');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
    } catch {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error reading dark-defi-terminal.html');
    }
    return;
  }

  // ── GET /api/config → expose non-sensitive config
  if (method === 'GET' && url === '/api/config') {
    json(res, 200, {
      network: process.env.NETWORK ?? 'devnet',
      hasHelius: !!process.env.HELIUS_API_KEY,
      hasGoogleAI: !!process.env.GOOGLE_AI_API_KEY,
      hasXAI: !!process.env.XAI_API_KEY,
      hasRedPill: !!process.env.REDPILL_API_KEY,
      hasJupiter: !!process.env.JUPITER_API_KEY,
      heliusRpcUrl: process.env.HELIUS_RPC_URL?.replace(/api-key=[^&]+/, 'api-key=***') ?? null,
    });
    return;
  }

  // ── POST /api/chat → AI proxy
  if (method === 'POST' && url === '/api/chat') {
    try {
      await handleChat(req, res);
    } catch (err: any) {
      json(res, 500, { error: err.message ?? 'Unknown error' });
    }
    return;
  }

  // ── POST /api/prices → Helius token price proxy
  if (method === 'POST' && url === '/api/prices') {
    if (!process.env.HELIUS_API_KEY) {
      json(res, 503, { error: 'HELIUS_API_KEY not configured' });
      return;
    }
    try {
      const body = await readBody(req);
      const { mints } = JSON.parse(body);
      const data = await getHeliusPrices(process.env.HELIUS_API_KEY, mints ?? []);
      json(res, 200, data as object);
    } catch (err: any) {
      json(res, 500, { error: err.message });
    }
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
});

server.listen(PORT, '127.0.0.1', () => {
  const addr = `http://localhost:${PORT}`;
  console.log('\n' + '='.repeat(60));
  console.log('  🌑 DARK DEFI TERMINAL — Local Server');
  console.log('='.repeat(60));
  console.log(`  URL:     ${addr}`);
  console.log(`  Network: ${process.env.NETWORK ?? 'devnet'}`);
  console.log(`  Helius:  ${process.env.HELIUS_API_KEY ? '✅ configured' : '❌ missing'}`);
  console.log(`  AI:      ${
    process.env.GOOGLE_AI_API_KEY ? '✅ Google Gemini' :
    process.env.XAI_API_KEY ? '✅ XAI Grok' :
    process.env.REDPILL_API_KEY ? '✅ RedPill' :
    '⚠️  no AI key (fallback mode)'
  }`);
  console.log('='.repeat(60));
  console.log(`\n  Open in browser: ${addr}\n`);
});

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} is already in use.`);
    console.error(`   Change LOCAL_PORT in .env or kill the process on that port.\n`);
  } else {
    console.error('\n❌ Server error:', err.message, '\n');
  }
  process.exit(1);
});
