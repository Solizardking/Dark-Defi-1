import {
  Connection,
  PublicKey,
  type Keypair,
  Transaction as SolanaTransaction,
  SystemProgram,
} from '@solana/web3.js';
import { AnchorProvider, Program, type Idl, type Wallet } from '@coral-xyz/anchor';
import { getRpcEndpoint, getProgramId, PROTOCOL_STATE_SEED, POOL_VAULT_SEED } from './config';

export type Network = 'devnet' | 'mainnet' | 'localnet';

export interface DarkProtocolConfig {
  /** Helius API key — used for RPC and DAS queries */
  heliusApiKey?: string;
  network?: Network;
  useSecureRpc?: boolean;
  jupiterApiKey?: string;
  redpillApiKey?: string;
  rpcUrl?: string;
  programId?: PublicKey;
  commitment?: 'processed' | 'confirmed' | 'finalized';
}

// ─── IDL (inline from generated Anchor IDL) ───────────────────────────────────

const DARK_PROTOCOL_IDL: Idl = {
  address: 'E8zL7h9qHjC7sMf2WCYhdqS5iLkYhPJ9yAhTfevo74jm',
  metadata: {
    name: 'dark_protocol_program',
    version: '0.1.0',
    spec: '0.1.0',
    description: 'Dark Protocol — On-Chain Shielded Note Pool',
  },
  instructions: [
    {
      name: 'initialize',
      discriminator: [175, 175, 109, 31, 13, 152, 155, 237],
      accounts: [
        { name: 'protocol_state', writable: true, pda: { seeds: [{ kind: 'const', value: [112, 114, 111, 116, 111, 99, 111, 108] }] } },
        { name: 'pool_vault', writable: true },
        { name: 'payer', writable: true, signer: true },
        { name: 'system_program', address: '11111111111111111111111111111111' },
      ],
      args: [{ name: 'authority', type: 'pubkey' }],
    },
    {
      name: 'deposit',
      discriminator: [242, 35, 198, 137, 82, 225, 242, 182],
      accounts: [
        { name: 'protocol_state', writable: true, pda: { seeds: [{ kind: 'const', value: [112, 114, 111, 116, 111, 99, 111, 108] }] } },
        { name: 'shielded_note', writable: true },
        { name: 'pool_vault', writable: true },
        { name: 'depositor', writable: true, signer: true },
        { name: 'system_program', address: '11111111111111111111111111111111' },
      ],
      args: [
        { name: 'amount', type: 'u64' },
        { name: 'commitment', type: { array: ['u8', 32] } },
        { name: 'enc_ciphertext', type: { array: ['u8', 580] } },
        { name: 'out_ciphertext', type: { array: ['u8', 80] } },
        { name: 'ephemeral_key', type: { array: ['u8', 32] } },
      ],
    },
    {
      name: 'withdraw',
      discriminator: [183, 18, 70, 156, 148, 109, 161, 34],
      accounts: [
        { name: 'protocol_state', writable: true, pda: { seeds: [{ kind: 'const', value: [112, 114, 111, 116, 111, 99, 111, 108] }] } },
        { name: 'shielded_note', writable: true },
        { name: 'nullifier_record', writable: true },
        { name: 'pool_vault', writable: true },
        { name: 'recipient', writable: true, signer: true },
        { name: 'system_program', address: '11111111111111111111111111111111' },
      ],
      args: [
        { name: 'nullifier', type: { array: ['u8', 32] } },
        { name: 'amount', type: 'u64' },
      ],
    },
    {
      name: 'shielded_transfer',
      discriminator: [108, 23, 178, 53, 201, 43, 71, 12],
      accounts: [
        { name: 'protocol_state', writable: true, pda: { seeds: [{ kind: 'const', value: [112, 114, 111, 116, 111, 99, 111, 108] }] } },
        { name: 'input_note', writable: true },
        { name: 'nullifier_record', writable: true },
        { name: 'output_note_1', writable: true },
        { name: 'output_note_2', writable: true },
        { name: 'sender', writable: true, signer: true },
        { name: 'system_program', address: '11111111111111111111111111111111' },
      ],
      args: [
        { name: 'input_nullifier', type: { array: ['u8', 32] } },
        { name: 'output_commitment_1', type: { array: ['u8', 32] } },
        { name: 'output_commitment_2', type: { array: ['u8', 32] } },
        { name: 'enc_ciphertext_1', type: { array: ['u8', 580] } },
        { name: 'enc_ciphertext_2', type: { array: ['u8', 580] } },
        { name: 'out_ciphertext_1', type: { array: ['u8', 80] } },
        { name: 'out_ciphertext_2', type: { array: ['u8', 80] } },
        { name: 'ephemeral_key_1', type: { array: ['u8', 32] } },
        { name: 'ephemeral_key_2', type: { array: ['u8', 32] } },
        { name: 'amount_1', type: 'u64' },
        { name: 'amount_2', type: 'u64' },
      ],
    },
  ],
  accounts: [
    {
      name: 'ProtocolState',
      discriminator: [79, 146, 10, 236, 191, 171, 230, 55],
    },
    {
      name: 'ShieldedNote',
      discriminator: [62, 156, 51, 182, 82, 235, 152, 44],
    },
    {
      name: 'NullifierRecord',
      discriminator: [211, 24, 18, 132, 35, 207, 156, 87],
    },
  ],
  types: [],
  errors: [
    { code: 6000, name: 'ZeroAmount', msg: 'Amount must be greater than zero' },
    { code: 6001, name: 'NoteAlreadySpent', msg: 'Note has already been spent' },
    { code: 6002, name: 'AmountMismatch', msg: 'Amount does not match note value' },
    { code: 6003, name: 'NoteOverflow', msg: 'Note count overflow' },
  ],
} as unknown as Idl;

// ─── Client ───────────────────────────────────────────────────────────────────

export class DarkProtocolClient {
  public readonly connection: Connection;
  public readonly program: Program;
  public readonly config: DarkProtocolConfig;
  public readonly programId: PublicKey;

  private constructor(
    connection: Connection,
    program: Program,
    config: DarkProtocolConfig,
    programId: PublicKey,
  ) {
    this.connection = connection;
    this.program    = program;
    this.config     = config;
    this.programId  = programId;
  }

  /**
   * Create a new Dark Protocol client instance.
   *
   * @example
   * ```ts
   * const client = await DarkProtocolClient.create({
   *   network: 'mainnet',
   *   heliusApiKey: process.env.HELIUS_API_KEY,
   * });
   * ```
   */
  static async create(config: DarkProtocolConfig): Promise<DarkProtocolClient> {
    const network  = config.network ?? 'mainnet';
    const rpcUrl   = config.rpcUrl
      ?? getRpcEndpoint(network, config.heliusApiKey);
    const commitment = config.commitment ?? 'confirmed';

    const connection = new Connection(rpcUrl, commitment);
    const programId  = config.programId ?? getProgramId(network);

    // Read-only provider (wallet injected when needed)
    const dummyWallet = {
      publicKey: PublicKey.default,
      signTransaction:    async (tx: any) => tx,
      signAllTransactions: async (txs: any[]) => txs,
    } as unknown as Wallet;

    const provider = new AnchorProvider(connection, dummyWallet, { commitment });
    const program  = new Program(DARK_PROTOCOL_IDL, provider);

    return new DarkProtocolClient(connection, program, config, programId);
  }

  // ── Protocol state ──────────────────────────────────────────────────────────

  /**
   * Return the PDA for the global ProtocolState account.
   */
  protocolStatePDA(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from(PROTOCOL_STATE_SEED)],
      this.programId,
    );
  }

  /**
   * Return the PDA for the SOL pool vault.
   */
  poolVaultPDA(): [PublicKey, number] {
    const [statePDA] = this.protocolStatePDA();
    return PublicKey.findProgramAddressSync(
      [Buffer.from(POOL_VAULT_SEED), statePDA.toBuffer()],
      this.programId,
    );
  }

  /**
   * Return the PDA for a shielded note given its commitment.
   */
  notePDA(commitment: Uint8Array): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('note'), commitment],
      this.programId,
    );
  }

  /**
   * Return the PDA for a nullifier record.
   */
  nullifierPDA(nullifier: Uint8Array): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('nullifier'), nullifier],
      this.programId,
    );
  }

  /**
   * Fetch on-chain protocol state (note count, Merkle root, authority).
   */
  async getProtocolState(): Promise<{
    authority: PublicKey;
    noteCount: bigint;
    bump: number;
    vaultBump: number;
  } | null> {
    const [pda] = this.protocolStatePDA();
    try {
      const raw = await this.connection.getAccountInfo(pda);
      if (!raw || raw.data.length < 50) return null;
      // Decode manually: discriminator(8) + authority(32) + noteCount(8) + bump(1) + vaultBump(1)
      const authority  = new PublicKey(raw.data.slice(8, 40));
      const noteCount  = raw.data.readBigUInt64LE(40);
      const bump       = raw.data[48];
      const vaultBump  = raw.data[49];
      return { authority, noteCount, bump, vaultBump };
    } catch {
      return null;
    }
  }

  /**
   * Fetch a shielded note account by its commitment.
   */
  async getNote(commitment: Uint8Array): Promise<{
    commitment: Buffer;
    amount: bigint;
    spent: boolean;
    noteIndex: bigint;
    slot: bigint;
    depositor: PublicKey;
  } | null> {
    const [pda] = this.notePDA(commitment);
    try {
      const raw = await this.connection.getAccountInfo(pda);
      if (!raw) return null;
      // Discriminator(8) + commitment(32) + enc(580) + out(80) + epk(32) +
      // amount(8) + spent(1) + noteIndex(8) + slot(8) + depositor(32) + bump(1)
      const off = 8;
      const cm       = Buffer.from(raw.data.slice(off, off + 32));
      const amount   = raw.data.readBigUInt64LE(off + 32 + 580 + 80 + 32);
      const spent    = raw.data[off + 32 + 580 + 80 + 32 + 8] === 1;
      const nIdx     = raw.data.readBigUInt64LE(off + 32 + 580 + 80 + 32 + 8 + 1);
      const slot     = raw.data.readBigUInt64LE(off + 32 + 580 + 80 + 32 + 8 + 1 + 8);
      const dep      = new PublicKey(raw.data.slice(off + 32 + 580 + 80 + 32 + 8 + 1 + 8 + 8, off + 32 + 580 + 80 + 32 + 8 + 1 + 8 + 8 + 32));
      return { commitment: cm, amount, spent, noteIndex: nIdx, slot, depositor: dep };
    } catch {
      return null;
    }
  }

  /**
   * Check whether a nullifier has been spent on-chain.
   */
  async isNullifierSpent(nullifier: Uint8Array): Promise<boolean> {
    const [pda] = this.nullifierPDA(nullifier);
    const info  = await this.connection.getAccountInfo(pda);
    return info !== null;
  }

  /**
   * Create a transaction to initialise the protocol state.
   * Call once after first deployment.
   */
  async buildInitializeTx(
    payer: PublicKey,
    authority: PublicKey,
  ): Promise<SolanaTransaction> {
    const [statePDA] = this.protocolStatePDA();
    const [vaultPDA] = this.poolVaultPDA();

    return await (this.program.methods as any)
      .initialize(authority)
      .accounts({
        protocolState: statePDA,
        poolVault:     vaultPDA,
        payer,
        systemProgram: SystemProgram.programId,
      })
      .transaction();
  }

  /**
   * Legacy compat — kept for backward compatibility.
   */
  async createTransaction(params: {
    instructions: any[];
    signers: Keypair[];
    feePayer?: PublicKey;
  }): Promise<SolanaTransaction> {
    const tx = new SolanaTransaction();
    for (const ix of params.instructions) tx.add(ix);
    if (params.feePayer) tx.feePayer = params.feePayer;
    if (params.signers.length > 0) tx.sign(...params.signers);
    return tx;
  }

  /**
   * Fetch the AI agent info (legacy stub — kept for API compatibility).
   */
  async getAIAgent(_agentPubkey: PublicKey): Promise<null> {
    return null;
  }
}
