/**
 * DarkDefi Solana program configuration.
 * Public devnet defaults only. Do not put private RPC keys in this package.
 */

// ============================================================================
// RPC ENDPOINTS
// ============================================================================

export const DEVNET_RPC_URL = 'https://api.devnet.solana.com';
export const DEVNET_WSS_URL = 'wss://api.devnet.solana.com';
export const HELIUS_RPC_URL = DEVNET_RPC_URL;
export const HELIUS_WSS_URL = DEVNET_WSS_URL;

/** Default RPC URL. Override in applications when using a private provider. */
export const DEFAULT_RPC_URL = DEVNET_RPC_URL;

// ============================================================================
// PROGRAM IDS
// ============================================================================

/** SolanaOS AI Inference Protocol */
export const AI_INFERENCE_PROGRAM_ID = '3xFBRCtk5hxeLWzHvwyDg2B67RHoA9JFTKmHPzzccBVc';

/** Clawd staking reward/position protocol */
export const CLAWD_STAKE_PROGRAM_ID = '5bp3bDnWYdjiYyB99XWWi6h8ga2wnB1TxuRUb4VNJrTn';

/** DarkDefi MPL Core staking registry */
export const MPL_CORENFT_STAKING_PROGRAM_ID = '7AFH2R2vAowRbYxLJnS5eRazZxQyHcMD9VTJKEFsjpdZ';

/** Agent minter reference program. Deployed on devnet and mainnet-beta as of 2026-05-08. */
export const AGENT_MINTER_PROGRAM_ID = 'agnmDKzZkv63sRhPFvm3iWpxaopgTRcohXA6CSYSXvQ';

/** Solana GPT oracle reference program. Deployed on devnet and mainnet-beta as of 2026-05-08. */
export const SOLANA_GPT_ORACLE_PROGRAM_ID = 'LLMrieZMpbJFwN52WgmBNMxYojrpRVYXdC1RCweEbab';

/** ORE Mining Protocol v2 */
export const ORE_PROGRAM_ID = 'ore2LrFdxHRrcqwR1KVW5jLEqfAXEJMxRNSGzwj73yz';

/** ORE Token Mint (11 decimals) */
export const ORE_MINT = 'oreoU2P8bN6jkk3jbaiVxYnG1dCXcYxwhwyK9jSybcp';

/** ORE v1 Program (legacy) */
export const ORE_V1_PROGRAM_ID = 'oreV3EG1i9BEgiAJ8b177Z2S2rMarzak4NMv1kULvWv';

/** Wrapped SOL Mint */
export const WSOL_MINT = 'So11111111111111111111111111111111111111112';

/** SPL Token Program */
export const TOKEN_PROGRAM = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';

/** Associated Token Program */
export const ASSOCIATED_TOKEN_PROGRAM = 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';

// ============================================================================
// LIVEKIT VOICE AGENT
// ============================================================================

export const LIVEKIT_AGENT_NAME = 'solanaos-voice-agent';
export const LIVEKIT_AGENT_ID = 'A_33KtGFACRxzi';
export const LIVEKIT_PROJECT = 'solanaOS';
export const LIVEKIT_PROJECT_ID = 'p_3zg9niwzqkd';
export const LIVEKIT_SANDBOX_ID = 'solanaos-1xlx2a';

// ============================================================================
// API ENDPOINTS
// ============================================================================

export const API_ENDPOINTS = {
    /** Backend server base URL */
    server: 'http://localhost:3005',
    /** Production backend */
    production: 'https://clawdos-backend-production.up.railway.app',
    /** ORE mining API routes */
    ore: {
        stats: '/api/ore/stats',
        round: '/api/ore/round',
        board: '/api/ore/board',
        miner: '/api/ore/miner',
        automation: '/api/ore/automation',
        balance: '/api/ore/balance',
        price: '/api/ore/price',
        status: '/api/ore/status',
        deployBuild: '/api/ore/deploy/build',
        claimBuild: '/api/ore/claim/build',
        automateBuild: '/api/ore/automate/build',
        checkpointBuild: '/api/ore/checkpoint/build',
    },
    /** LiveKit API routes */
    livekit: {
        token: '/api/livekit/token',
        sandboxConnect: '/api/livekit/sandbox/connect',
    },
} as const;

// ============================================================================
// EXTERNAL APIS
// ============================================================================

export const BIRDEYE_API_URL = 'https://public-api.birdeye.so';
export const JUPITER_API_URL = 'https://api.jup.ag';
export const JUPITER_ULTRA_URL = 'https://api.jup.ag/ultra';

/** Solscan explorer base URL */
export const SOLSCAN_BASE_URL = 'https://solscan.io';

/** Build a Solscan transaction URL */
export function solscanTxUrl(signature: string): string {
    return `${SOLSCAN_BASE_URL}/tx/${signature}?cluster=devnet`;
}

/** Build a Solscan account URL */
export function solscanAccountUrl(address: string): string {
    return `${SOLSCAN_BASE_URL}/account/${address}?cluster=devnet`;
}
