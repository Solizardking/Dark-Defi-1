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

import * as http from 'node:http';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as https from 'node:https';
import type { IncomingMessage, ServerResponse } from 'node:http';
import * as dotenv from 'dotenv';
import {
  getTicker,
  getAllTickers,
  getOrderbook,
  getCandles,
  getMarketList,
} from './phoenix-perps';

// ──────────────────────────────────────────────
// Load .env from the terminal package directory
// ──────────────────────────────────────────────
const envPath = path.resolve(__dirname, '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const PORT = Number.parseInt(process.env.LOCAL_PORT ?? '3333', 10);
const HTML_FILE = path.resolve(__dirname, 'web', 'dark-defi-terminal.html');

// ──────────────────────────────────────────────
// RedPill model selection
// TEE (confidential) models:  phala/qwen3.5-27b, z-ai/glm-5.1, z-ai/glm-5
// Standard models:            anthropic/claude-sonnet-4.5, openai/gpt-5
// ──────────────────────────────────────────────
const REDPILL_MODEL =
  process.env.REDPILL_MODEL ??
  (process.env.REDPILL_TEE === '1' ? 'phala/qwen3.5-27b' : 'anthropic/claude-sonnet-4.5');

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────
function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk: Buffer) => {
      body += chunk.toString();
    });
    req.on('end', () => { resolve(body); });
    req.on('error', reject);
  });
}

function jsonReply(res: ServerResponse, status: number, data: object): void {
  const payload = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
  });
  res.end(payload);
}

function setCors(res: ServerResponse): void {
  res.setHeader('Access-Control-Allow-Origin', `http://localhost:${PORT}`);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function httpsPost(
  hostname: string,
  urlPath: string,
  headers: Record<string, string>,
  body: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const options: https.RequestOptions = {
      hostname,
      path: urlPath,
      method: 'POST',
      headers: { ...headers, 'Content-Length': Buffer.byteLength(body) },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (c: Buffer) => { data += c.toString(); });
      res.on('end', () => { resolve(data); });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
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

  const body = JSON.stringify({
    system_instruction: systemMsg ? { parts: [{ text: systemMsg }] } : undefined,
    contents: userMessages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
    generationConfig: { maxOutputTokens: 1000, temperature: 0.7 },
  });

  const raw = await httpsPost(
    'generativelanguage.googleapis.com',
    `/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    { 'Content-Type': 'application/json' },
    body
  );

  const parsed = JSON.parse(raw) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  return parsed?.candidates?.[0]?.content?.parts?.[0]?.text ?? 'No response from Google AI.';
}

// ──────────────────────────────────────────────
// OpenAI-compatible proxy (XAI Grok, RedPill, etc.)
// ──────────────────────────────────────────────
async function callOpenAICompat(
  apiKey: string,
  hostname: string,
  urlPath: string,
  model: string,
  messages: Array<{ role: string; content: string }>
): Promise<string> {
  const body = JSON.stringify({ model, messages, temperature: 0.7, max_tokens: 1000 });
  const raw = await httpsPost(
    hostname,
    urlPath,
    { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body
  );
  const parsed = JSON.parse(raw) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return parsed?.choices?.[0]?.message?.content ?? 'No response.';
}

// ──────────────────────────────────────────────
// Helius price data proxy
// ──────────────────────────────────────────────
async function getHeliusPrices(apiKey: string, mints: string[]): Promise<object> {
  const body = JSON.stringify({ mints });
  const raw = await httpsPost(
    'api.helius.xyz',
    `/v0/token-metadata?api-key=${apiKey}`,
    { 'Content-Type': 'application/json' },
    body
  );
  return JSON.parse(raw) as object;
}

// ──────────────────────────────────────────────
// Local fallback reply (no AI key configured)
// ──────────────────────────────────────────────
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
  if (q.includes('perp') || q.includes('funding') || q.includes('phoenix'))
    return '📈 Phoenix Perps: SOL, BTC, ETH and 27 more markets. Check the PERPS tab for live data.';
  return '🌑 Dark DeFi Agent (offline fallback). Set an AI API key in .env to get live responses.';
}

// ──────────────────────────────────────────────
// Chat handler — Gemini → XAI → RedPill → fallback
// ──────────────────────────────────────────────
async function handleChat(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = await readBody(req);
  let messages: Array<{ role: string; content: string }>;

  try {
    ({ messages } = JSON.parse(body) as { messages: Array<{ role: string; content: string }> });
    if (!Array.isArray(messages)) throw new Error('messages must be an array');
  } catch {
    jsonReply(res, 400, { error: 'Invalid JSON body — expected { messages: [...] }' });
    return;
  }

  if (process.env.GOOGLE_AI_API_KEY) {
    try {
      const reply = await callGoogleAI(process.env.GOOGLE_AI_API_KEY, messages);
      jsonReply(res, 200, { reply, provider: 'google-gemini' });
      return;
    } catch (err) {
      console.error('[chat] Google AI error:', (err as Error).message);
    }
  }

  if (process.env.XAI_API_KEY) {
    try {
      const reply = await callOpenAICompat(
        process.env.XAI_API_KEY,
        'api.x.ai',
        '/v1/chat/completions',
        'grok-beta',
        messages
      );
      jsonReply(res, 200, { reply, provider: 'xai-grok' });
      return;
    } catch (err) {
      console.error('[chat] XAI error:', (err as Error).message);
    }
  }

  if (process.env.REDPILL_API_KEY) {
    try {
      const reply = await callOpenAICompat(
        process.env.REDPILL_API_KEY,
        'api.redpill.ai',           // ← correct hostname (no hyphen)
        '/v1/chat/completions',
        REDPILL_MODEL,              // ← claude-sonnet-4.5 or phala TEE model
        messages
      );
      const isTee = REDPILL_MODEL.startsWith('phala/') || REDPILL_MODEL.startsWith('z-ai/');
      jsonReply(res, 200, {
        reply,
        provider: isTee ? `redpill-tee (${REDPILL_MODEL})` : `redpill (${REDPILL_MODEL})`,
      });
      return;
    } catch (err) {
      console.error('[chat] RedPill error:', (err as Error).message);
    }
  }

  jsonReply(res, 503, {
    error: 'No AI provider configured. Set GOOGLE_AI_API_KEY, XAI_API_KEY, or REDPILL_API_KEY in .env',
    reply: getFallbackReply(messages.at(-1)?.content ?? ''),
    provider: 'local-fallback',
  });
}

// ──────────────────────────────────────────────
// Perps handlers
// ──────────────────────────────────────────────

/** GET /api/perps/markets  — all tickers + market info */
async function handlePerpsMarkets(_req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const [tickers, markets] = await Promise.all([getAllTickers(), getMarketList()]);
    jsonReply(res, 200, { tickers, markets, fetchedAt: Date.now() });
  } catch (err) {
    jsonReply(res, 500, { error: (err as Error).message });
  }
}

/** GET /api/perps/ticker?symbol=SOL */
async function handlePerpsTicker(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const symbol = new URL(req.url ?? '', `http://localhost:${PORT}`).searchParams.get('symbol') ?? 'SOL';
  try {
    const ticker = await getTicker(symbol.toUpperCase());
    jsonReply(res, 200, ticker);
  } catch (err) {
    jsonReply(res, 500, { error: (err as Error).message });
  }
}

/** GET /api/perps/orderbook?symbol=SOL&depth=10 */
async function handlePerpsOrderbook(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const params = new URL(req.url ?? '', `http://localhost:${PORT}`).searchParams;
  const symbol = params.get('symbol') ?? 'SOL';
  const depth = Number.parseInt(params.get('depth') ?? '10', 10);
  try {
    const book = await getOrderbook(symbol.toUpperCase(), depth);
    jsonReply(res, 200, book);
  } catch (err) {
    jsonReply(res, 500, { error: (err as Error).message });
  }
}

/** GET /api/perps/candles?symbol=SOL&interval=1h&limit=24 */
async function handlePerpsCandles(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const params = new URL(req.url ?? '', `http://localhost:${PORT}`).searchParams;
  const symbol = params.get('symbol') ?? 'SOL';
  const interval = (params.get('interval') ?? '1h') as '1m' | '5m' | '15m' | '1h' | '4h' | '1d';
  const limit = Number.parseInt(params.get('limit') ?? '24', 10);
  try {
    const candles = await getCandles(symbol.toUpperCase(), interval, limit);
    jsonReply(res, 200, { symbol: symbol.toUpperCase(), interval, candles });
  } catch (err) {
    jsonReply(res, 500, { error: (err as Error).message });
  }
}

// ──────────────────────────────────────────────
// Route handlers split by prefix to keep complexity low
// ──────────────────────────────────────────────

function buildConfigPayload(): object {
  const isTee = REDPILL_MODEL.startsWith('phala/') || REDPILL_MODEL.startsWith('z-ai/');
  const hasRedPill = Boolean(process.env.REDPILL_API_KEY);
  return {
    network: process.env.NETWORK ?? 'devnet',
    hasHelius: Boolean(process.env.HELIUS_API_KEY),
    hasGoogleAI: Boolean(process.env.GOOGLE_AI_API_KEY),
    hasXAI: Boolean(process.env.XAI_API_KEY),
    hasRedPill,
    redpillModel: hasRedPill ? REDPILL_MODEL : null,
    redpillTee: hasRedPill ? isTee : false,
    hasJupiter: Boolean(process.env.JUPITER_API_KEY),
    heliusRpcUrl: process.env.HELIUS_RPC_URL?.replace(/api-key=[^&]+/, 'api-key=***') ?? null,
  };
}

async function handleApiPrices(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (!process.env.HELIUS_API_KEY) {
    jsonReply(res, 503, { error: 'HELIUS_API_KEY not configured' });
    return;
  }
  try {
    const body = await readBody(req);
    const { mints } = JSON.parse(body) as { mints?: string[] };
    const data = await getHeliusPrices(process.env.HELIUS_API_KEY, mints ?? []);
    jsonReply(res, 200, data);
  } catch (err) {
    jsonReply(res, 500, { error: (err as Error).message });
  }
}

async function handleApiRoute(
  method: string,
  url: string,
  req: IncomingMessage,
  res: ServerResponse
): Promise<boolean> {
  if (method === 'GET' && url === '/api/config') {
    jsonReply(res, 200, buildConfigPayload());
    return true;
  }
  if (method === 'POST' && url === '/api/chat') {
    try { await handleChat(req, res); } catch (err) {
      jsonReply(res, 500, { error: (err as Error).message });
    }
    return true;
  }
  if (method === 'POST' && url === '/api/prices') {
    await handleApiPrices(req, res);
    return true;
  }
  return false;
}

async function handlePerpsRoute(
  method: string,
  url: string,
  req: IncomingMessage,
  res: ServerResponse
): Promise<boolean> {
  if (method !== 'GET') return false;
  if (url.startsWith('/api/perps/markets'))   { await handlePerpsMarkets(req, res);   return true; }
  if (url.startsWith('/api/perps/ticker'))    { await handlePerpsTicker(req, res);    return true; }
  if (url.startsWith('/api/perps/orderbook')) { await handlePerpsOrderbook(req, res); return true; }
  if (url.startsWith('/api/perps/candles'))   { await handlePerpsCandles(req, res);   return true; }
  return false;
}

async function router(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = req.url ?? '/';
  const method = req.method ?? 'GET';

  setCors(res);

  if (method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // Serve HTML
  if (method === 'GET' && (url === '/' || url === '/index.html')) {
    try {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(fs.readFileSync(HTML_FILE, 'utf-8'));
    } catch {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error reading dark-defi-terminal.html');
    }
    return;
  }

  if (await handleApiRoute(method, url, req, res)) return;
  if (await handlePerpsRoute(method, url, req, res)) return;

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
}

// ──────────────────────────────────────────────
// Main HTTP server
// ──────────────────────────────────────────────
const server = http.createServer((req, res) => {
  router(req, res).catch((err: Error) => {
    jsonReply(res, 500, { error: err.message });
  });
});

server.listen(PORT, '127.0.0.1', () => {
  const addr = `http://localhost:${PORT}`;
  const line = '='.repeat(60);
  const isTee = REDPILL_MODEL.startsWith('phala/') || REDPILL_MODEL.startsWith('z-ai/');

  let aiStatus: string;
  if (process.env.GOOGLE_AI_API_KEY) {
    aiStatus = '✅ Google Gemini';
  } else if (process.env.XAI_API_KEY) {
    aiStatus = '✅ XAI Grok';
  } else if (process.env.REDPILL_API_KEY) {
    aiStatus = isTee
      ? `✅ RedPill TEE (${REDPILL_MODEL})`
      : `✅ RedPill (${REDPILL_MODEL})`;
  } else {
    aiStatus = '⚠️  no AI key (fallback mode)';
  }

  console.log(`\n${line}`);
  console.log('  🌑 DARK DEFI TERMINAL — Local Server');
  console.log(line);
  console.log(`  URL:     ${addr}`);
  console.log(`  Network: ${process.env.NETWORK ?? 'devnet'}`);
  console.log(`  Helius:  ${process.env.HELIUS_API_KEY ? '✅ configured' : '❌ missing'}`);
  console.log(`  AI:      ${aiStatus}`);
  console.log('  Perps:   ✅ Phoenix (Vulcan CLI + HTTP fallback)');
  console.log(line);
  console.log(`\n  Open in browser: ${addr}\n`);
});

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} is already in use.`);
    console.error('   Change LOCAL_PORT in .env or kill the process on that port.\n');
  } else {
    console.error('\n❌ Server error:', err.message, '\n');
  }
  process.exit(1);
});
