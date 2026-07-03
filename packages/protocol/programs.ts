/**
 * Canonical public program addresses for the Dark DeFi Solana stack.
 *
 * These constants mirror the checked-in Anchor manifests under `programs/`
 * and `dark-protocol-program/` so app, SDK, and status surfaces share one
 * source instead of carrying divergent string literals.
 */

export const DARK_PROTOCOL_PROGRAM_ID =
  'E8zL7h9qHjC7sMf2WCYhdqS5iLkYhPJ9yAhTfevo74jm' as const;

export const SHIELDED_WALLET_PROGRAM_ID = DARK_PROTOCOL_PROGRAM_ID;

export const DARKDEFI_PROGRAM_IDS = {
  darkProtocol: DARK_PROTOCOL_PROGRAM_ID,
  shieldedWallet: SHIELDED_WALLET_PROGRAM_ID,
  solanaAiInference: '3xFBRCtk5hxeLWzHvwyDg2B67RHoA9JFTKmHPzzccBVc',
  clawdStake: '5bp3bDnWYdjiYyB99XWWi6h8ga2wnB1TxuRUb4VNJrTn',
  mplCoreNftStaking: '7AFH2R2vAowRbYxLJnS5eRazZxQyHcMD9VTJKEFsjpdZ',
  agentMinter: 'agnmDKzZkv63sRhPFvm3iWpxaopgTRcohXA6CSYSXvQ',
  solanaGptOracle: 'LLMrieZMpbJFwN52WgmBNMxYojrpRVYXdC1RCweEbab',
  tokenLauncher: 'funvWGBmpr8N7pTNqpxkWPgWnQbL3Yr5vzCHNJT2YkL',
  tokenLaunchProgramClient: 'TLaunDAP1sZks8dGmcNWHxdAgzMuiYzKg87mfjHRFzM',
  metaplexTokenMetadata: 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s',
} as const;

export type DarkDefiProgramName = keyof typeof DARKDEFI_PROGRAM_IDS;
