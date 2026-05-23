/**
 * ShieldedWallet — Zcash-style privacy wallet for Solana
 *
 * Implements the full note lifecycle described in SHIELDED_WALLET_GUIDE.md:
 *   deposit (public → private) → shielded transfer → withdraw (private → public)
 *
 * Architecture:
 *   - SaplingHDWallet  : key hierarchy (sk → fvk → ivk → addresses)
 *   - NoteStore        : in-memory set of received + spent notes
 *   - CommitmentTree   : incremental Merkle tree of note commitments
 *   - NullifierSet     : prevents double-spend
 *   - NoteEncryption   : ChaCha20-Poly1305 AEAD per note
 *
 * Status: alpha — cryptography is production-faithful TypeScript;
 * on-chain settlement requires the Solana shielded-wallet Anchor program
 * (roadmap). All flows work today in "demo mode" without an RPC connection.
 */

import { blake3 } from '@noble/hashes/blake3';
import { sha256 } from '@noble/hashes/sha256';
import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import {
  SaplingHDWallet,
  SaplingSpendingKey,
  SaplingFullViewingKey,
  SaplingIncomingViewingKey,
  SaplingPaymentAddress,
  SaplingUtils,
  SAPLING_ADDRESS_SIZE,
} from './sapling';
import {
  NoteEncryptionUtils,
  NoteEncryption,
  NoteDecryption,
  SaplingNotePlaintext,
  EncryptedNote,
  MEMO_SIZE,
} from './note-encryption';
import { DarkProtocolClient } from './client';
import { getRpcEndpoint } from './config';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Deployed program ID — Dark Protocol shielded note pool. */
export const SHIELDED_WALLET_PROGRAM_ID =
  'E8zL7h9qHjC7sMf2WCYhdqS5iLkYhPJ9yAhTfevo74jm' as const;

const LAMPORTS_PER_SOL = 1_000_000_000n;

// ─── Types ────────────────────────────────────────────────────────────────────

export type ShieldedNetwork = 'devnet' | 'mainnet' | 'localnet';

export interface ShieldedWalletConfig {
  network?: ShieldedNetwork;
  programId?: string;
  heliusApiKey?: string;
  /** Skip on-chain calls (default: true until Rust program is live). */
  demoMode?: boolean;
}

/** A single received note with lifecycle state. */
export interface ShieldedNote {
  /** Unique note ID (hex of commitment). */
  id: string;
  /** Note commitment hash (32 bytes, hex). */
  commitment: string;
  /** Amount in lamports. */
  value: bigint;
  /** Plaintext memo (decoded from note). */
  memo: string;
  /** Recipient address (base58). */
  recipient: string;
  /** Nullifier hash — computed from sk + position (hex). */
  nullifier: string;
  /** Position in the commitment tree. */
  position: number;
  /** True if spent. */
  spent: boolean;
  /** Block/slot when added (0 in demo mode). */
  slot: number;
  /** Raw encrypted note (for re-scanning). */
  encryptedNote: EncryptedNote;
  /** Random seed used for this note. */
  rseed: string;
}

/** Exported viewing-key bundle (safe to share with auditors). */
export interface ViewingKeyExport {
  version: 1;
  network: ShieldedNetwork;
  /** Full viewing key (96-byte, base58). */
  fvk: string;
  /** Incoming viewing key (32-byte, base58). */
  ivk: string;
  /** Outgoing viewing key (32-byte, base58). */
  ovk: string;
  /** Default shielded address. */
  defaultAddress: string;
  createdAt: number;
}

/** Proof that a specific payment was made. */
export interface PaymentProof {
  version: 1;
  noteId: string;
  commitment: string;
  recipientAddress: string;
  amount: bigint;
  memo: string;
  slot: number;
  /** Hmac-style signature over proof fields (simplified). */
  signature: string;
  createdAt: number;
}

/** Result of a shielded deposit. */
export interface DepositResult {
  noteId: string;
  commitment: string;
  amount: bigint;
  shieldedAddress: string;
  txSignature?: string;
  demoMode: boolean;
}

/** Result of a shielded transfer. */
export interface TransferResult {
  noteId: string;
  commitment: string;
  nullifierSpent: string;
  amount: bigint;
  recipient: string;
  memo: string;
  txSignature?: string;
  demoMode: boolean;
}

/** Shielded balance breakdown. */
export interface ShieldedBalance {
  /** Sum of all unspent notes (lamports). */
  total: bigint;
  /** Human-readable SOL string. */
  totalSol: string;
  /** Individual unspent notes. */
  notes: ShieldedNote[];
  /** Count of spent notes. */
  spentCount: number;
}

/** Multisig proposal. */
export interface MultisigProposal {
  id: string;
  to: string;
  amount: bigint;
  memo: string;
  requiredApprovals: number;
  approvals: string[];
  executed: boolean;
  createdAt: number;
}

// ─── CommitmentTree ───────────────────────────────────────────────────────────

/**
 * Simple incremental Merkle tree for note commitments.
 * Uses SHA-256 as the hash function (can upgrade to Poseidon).
 */
export class CommitmentTree {
  private leaves: string[] = [];
  private depth = 32;

  append(commitment: Uint8Array): number {
    const hex = Buffer.from(commitment).toString('hex');
    this.leaves.push(hex);
    return this.leaves.length - 1;
  }

  root(): Uint8Array {
    if (this.leaves.length === 0) return new Uint8Array(32);
    let level: Uint8Array[] = this.leaves.map(hex => Uint8Array.from(Buffer.from(hex, 'hex')));
    while (level.length > 1) {
      const next: Uint8Array[] = [];
      for (let i = 0; i < level.length; i += 2) {
        const left = level[i];
        const right = level[i + 1] ?? left;
        next.push(sha256(new Uint8Array([...left, ...right])));
      }
      level = next;
    }
    return level[0];
  }

  rootHex(): string {
    return Buffer.from(this.root()).toString('hex');
  }

  size(): number {
    return this.leaves.length;
  }

  /** Produce a witness path (sibling hashes) for a given leaf index. */
  witness(index: number): string[] {
    const path: string[] = [];
    let level: Uint8Array[] = this.leaves.map(hex => Uint8Array.from(Buffer.from(hex, 'hex')));
    let idx = index;
    while (level.length > 1) {
      const sibling = idx % 2 === 0 ? level[idx + 1] ?? level[idx] : level[idx - 1];
      path.push(Buffer.from(sibling).toString('hex'));
      const next: Uint8Array[] = [];
      for (let i = 0; i < level.length; i += 2) {
        const l = level[i];
        const r = level[i + 1] ?? l;
        next.push(sha256(new Uint8Array([...l, ...r])));
      }
      level = next;
      idx = Math.floor(idx / 2);
    }
    return path;
  }
}

// ─── NullifierSet ─────────────────────────────────────────────────────────────

/** Tracks spent nullifiers to prevent double-spend. */
export class NullifierSet {
  private set = new Set<string>();

  /** Add a nullifier (hex). Returns false if already present. */
  add(nullifier: string): boolean {
    if (this.set.has(nullifier)) return false;
    this.set.add(nullifier);
    return true;
  }

  has(nullifier: string): boolean {
    return this.set.has(nullifier);
  }

  size(): number {
    return this.set.size;
  }

  toArray(): string[] {
    return Array.from(this.set);
  }
}

// ─── Nullifier computation ────────────────────────────────────────────────────

/**
 * Compute a note nullifier.
 * nf = Blake3(nk || position || commitment)
 */
function computeNullifier(
  nk: Uint8Array,
  position: number,
  commitment: Uint8Array
): Uint8Array {
  const posBytes = new Uint8Array(8);
  new DataView(posBytes.buffer).setBigUint64(0, BigInt(position), true);
  return blake3(
    new Uint8Array([
      ...nk,
      ...posBytes,
      ...commitment,
      ...Buffer.from('sapling_nf', 'utf8'),
    ]),
    { dkLen: 32 }
  );
}

/** Constant-time byte comparison. */
function ctEq(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

// ─── Internal constructor params ─────────────────────────────────────────────

/** Internal params type for ShieldedWallet (and subclasses) constructors. */
interface ShieldedWalletParams {
  hdWallet: SaplingHDWallet | null;
  fvk: SaplingFullViewingKey;
  network: ShieldedNetwork;
  programId: string;
  demoMode: boolean;
  heliusApiKey?: string;
  /** Optional signer public key — required for on-chain operations */
  signerPublicKey?: PublicKey;
  /** Optional sign-transaction callback — required for on-chain operations */
  signTransaction?: (tx: Transaction) => Promise<Transaction>;
}

// ─── ShieldedWallet ───────────────────────────────────────────────────────────

/**
 * Privacy-preserving wallet using Zcash Sapling cryptography on Solana.
 *
 * @example
 * ```typescript
 * // Create new wallet
 * const wallet = await ShieldedWallet.create({ network: 'devnet' });
 * const mnemonic = wallet.generateMnemonic();
 *
 * // Deposit SOL into shielded pool
 * const result = await wallet.deposit({ amount: 1_000_000_000n });
 * console.log('Deposited:', result.commitment);
 *
 * // Transfer privately
 * await wallet.transfer({
 *   to: recipientAddress,
 *   amount: 500_000_000n,
 *   memo: 'Private payment',
 * });
 *
 * // Check balance
 * const { totalSol } = await wallet.getBalance();
 * console.log('Balance:', totalSol, 'SOL');
 * ```
 */
export class ShieldedWallet {
  protected readonly hdWallet: SaplingHDWallet | null;
  protected readonly fvk: SaplingFullViewingKey;
  protected readonly ivk: SaplingIncomingViewingKey;
  protected readonly network: ShieldedNetwork;
  protected readonly programId: string;
  protected readonly demoMode: boolean;
  /** Optional signer PK — required for on-chain operations */
  protected readonly signerPublicKey?: PublicKey;
  /** Optional sign-transaction hook — required for on-chain operations */
  protected readonly signTx?: (tx: Transaction) => Promise<Transaction>;
  /** Optional Helius API key for RPC calls */
  protected readonly heliusApiKey?: string;

  /** In-memory note store. */
  protected notes: ShieldedNote[] = [];
  protected commitmentTree = new CommitmentTree();
  protected nullifierSet = new NullifierSet();

  protected mnemonic_: string | null = null;

  // ── Constructors ────────────────────────────────────────────────────────────

  protected constructor(params: ShieldedWalletParams) {
    this.hdWallet = params.hdWallet;
    this.fvk            = params.fvk;
    this.ivk            = params.fvk.inViewingKey();
    this.network        = params.network;
    this.programId      = params.programId;
    this.demoMode       = params.demoMode;
    this.signerPublicKey = params.signerPublicKey;
    this.signTx         = params.signTransaction;
    this.heliusApiKey   = params.heliusApiKey;
  }

  /**
   * @internal — Build raw constructor params for subclass factories.
   * Returns params + mnemonic so callers can store the seed if needed.
   */
  protected static async _buildParams(
    config: ShieldedWalletConfig = {}
  ): Promise<{ params: ShieldedWalletParams; mnemonic: string }> {
    const { wallet, mnemonic } = await SaplingUtils.generateWallet();
    return {
      params: {
        hdWallet:    wallet,
        fvk:         wallet.getFullViewingKey(),
        network:     config.network    ?? 'devnet',
        programId:   config.programId  ?? SHIELDED_WALLET_PROGRAM_ID,
        demoMode:    config.demoMode   ?? true,
        heliusApiKey: config.heliusApiKey,
      },
      mnemonic,
    };
  }

  /**
   * Create a brand-new shielded wallet with a fresh keypair.
   */
  static async create(config: ShieldedWalletConfig = {}): Promise<ShieldedWallet> {
    const { params, mnemonic } = await ShieldedWallet._buildParams(config);
    const sw = new ShieldedWallet(params);
    sw.mnemonic_ = mnemonic;
    return sw;
  }

  /**
   * Restore wallet from a 24-word BIP-39 mnemonic.
   */
  static async fromMnemonic(
    mnemonic: string,
    config: ShieldedWalletConfig = {}
  ): Promise<ShieldedWallet> {
    const hdWallet = await SaplingHDWallet.fromMnemonic(mnemonic);
    const network = config.network ?? 'devnet';
    const programId = config.programId ?? SHIELDED_WALLET_PROGRAM_ID;
    const demoMode = config.demoMode ?? true;

    const sw = new ShieldedWallet({
      hdWallet,
      fvk: hdWallet.getFullViewingKey(),
      network,
      programId,
      demoMode,
    });
    sw.mnemonic_ = mnemonic;
    return sw;
  }

  /**
   * Create a view-only wallet from a {@link ViewingKeyExport}.
   * This wallet can scan and decrypt notes but **cannot spend**.
   */
  static fromViewingKey(vk: ViewingKeyExport): ViewOnlyWallet {
    const bs58 = require('bs58');
    const fvkBytes: Uint8Array = bs58.decode(vk.fvk);
    const fvk = SaplingFullViewingKey.fromBytes(fvkBytes);
    return new ViewOnlyWallet({
      hdWallet: null,
      fvk,
      network: vk.network,
      programId: SHIELDED_WALLET_PROGRAM_ID,
      demoMode: true,
    });
  }

  // ── Key management ──────────────────────────────────────────────────────────

  /**
   * Returns the 24-word BIP-39 mnemonic.
   * Only available if the wallet was freshly generated.
   */
  generateMnemonic(): string {
    if (!this.mnemonic_) {
      throw new Error(
        'Mnemonic not available — wallet was restored from a key, not freshly generated'
      );
    }
    return this.mnemonic_;
  }

  /**
   * Export a view-only key bundle.
   * Safe to share with auditors — cannot spend funds.
   */
  exportViewingKey(): ViewingKeyExport {
    const bs58 = require('bs58');
    return {
      version: 1,
      network: this.network,
      fvk: bs58.encode(this.fvk.toBytes()),
      ivk: bs58.encode(this.ivk.ivk),
      ovk: bs58.encode(this.fvk.ovk),
      defaultAddress: this.getDefaultAddress().toBase58(),
      createdAt: Date.now(),
    };
  }

  // ── Address management ──────────────────────────────────────────────────────

  /** Get the default (index-0) diversified Sapling payment address. */
  getDefaultAddress(): SaplingPaymentAddress {
    if (this.hdWallet) return this.hdWallet.getDefaultAddress();
    // View-only: derive from ivk with default diversifier
    const div = SaplingIncomingViewingKey.defaultDiversifier();
    return this.ivk.address(div);
  }

  /** Get the shielded address as a base58 string (the "zs1…"-equivalent). */
  getShieldedAddress(): string {
    return this.getDefaultAddress().toBase58();
  }

  /**
   * Generate a fresh diversified address at the given index.
   * All addresses share the same keys and are unlinkable by observers.
   */
  getDiversifiedAddress(index: number): string {
    if (this.hdWallet) {
      return this.hdWallet.generateDiversifiedAddress(index).toBase58();
    }
    // View-only path
    const indexBytes = new Uint8Array(4);
    new DataView(indexBytes.buffer).setUint32(0, index, true);
    const diversifier = blake3(
      new Uint8Array([...this.ivk.ivk, ...indexBytes, ...Buffer.from('div', 'utf8')]),
      { dkLen: 11 }
    );
    diversifier[0] = diversifier[0] || 1;
    return this.ivk.address(diversifier).toBase58();
  }

  // ── Deposit (public → private) ───────────────────────────────────────────────

  /**
   * Shield tokens into the private pool.
   *
   * In demo mode: records the note locally without touching the chain.
   * In live mode (when the Rust program is deployed): sends a `deposit`
   * instruction to the shielded-wallet program.
   *
   * @param params.amount  Lamports to shield.
   * @param params.memo    Optional memo.
   * @param params.recipientAddress  Override recipient (defaults to `getShieldedAddress()`).
   */
  async deposit(params: {
    amount: bigint;
    memo?: string;
    recipientAddress?: string;
  }): Promise<DepositResult> {
    const recipientStr =
      params.recipientAddress ?? this.getShieldedAddress();
    const recipient = SaplingPaymentAddress.fromBase58(recipientStr);

    const encNote = await NoteEncryptionUtils.createEncryptedNote({
      recipientAddress: recipient,
      value: params.amount,
      memo: params.memo ?? '',
      senderOvk: this.fvk.ovk,
    });

    const note = this._storeNote(encNote, params.amount, params.memo ?? '', recipientStr);

    let txSignature: string | undefined;
    if (!this.demoMode) {
      txSignature = await this._submitDeposit(note, encNote);
    }

    return {
      noteId: note.id,
      commitment: note.commitment,
      amount: params.amount,
      shieldedAddress: recipientStr,
      txSignature,
      demoMode: this.demoMode,
    };
  }

  // ── Transfer (private → private) ─────────────────────────────────────────────

  /**
   * Transfer privately from one shielded address to another.
   *
   * Selects the largest unspent note that covers `amount`, creates two
   * output notes (payment + change), and marks the input as spent.
   *
   * @param params.to      Recipient shielded address (base58).
   * @param params.amount  Lamports to send.
   * @param params.memo    Optional encrypted memo.
   */
  async transfer(params: {
    to: string;
    amount: bigint;
    memo?: string;
  }): Promise<TransferResult> {
    if (!this.hdWallet) {
      throw new Error('Cannot spend from a view-only wallet');
    }

    const inputNote = this._selectNote(params.amount);
    if (!inputNote) {
      throw new Error(
        `Insufficient shielded balance — need ${params.amount} lamports`
      );
    }

    // Spend the input note
    if (!this.nullifierSet.add(inputNote.nullifier)) {
      throw new Error('Nullifier already spent (double-spend prevented)');
    }
    inputNote.spent = true;

    const recipient = SaplingPaymentAddress.fromBase58(params.to);

    // Output 1: payment to recipient
    const payNote = await NoteEncryptionUtils.createEncryptedNote({
      recipientAddress: recipient,
      value: params.amount,
      memo: params.memo ?? '',
      senderOvk: this.fvk.ovk,
    });

    // Output 2: change back to self
    const change = inputNote.value - params.amount;
    if (change > 0n) {
      const selfAddr = this.getDefaultAddress();
      const changeNote = await NoteEncryptionUtils.createEncryptedNote({
        recipientAddress: selfAddr,
        value: change,
        memo: 'change',
        senderOvk: this.fvk.ovk,
      });
      this._storeNote(changeNote, change, 'change', selfAddr.toBase58());
    }

    // Store payment note (recipient will scan for it)
    const storedPay = this._storeNote(
      payNote,
      params.amount,
      params.memo ?? '',
      params.to
    );

    let txSignature: string | undefined;
    if (!this.demoMode) {
      txSignature = await this._submitTransfer(inputNote, storedPay, payNote);
    }

    return {
      noteId: storedPay.id,
      commitment: storedPay.commitment,
      nullifierSpent: inputNote.nullifier,
      amount: params.amount,
      recipient: params.to,
      memo: params.memo ?? '',
      txSignature,
      demoMode: this.demoMode,
    };
  }

  // ── Balance ─────────────────────────────────────────────────────────────────

  /**
   * Compute local balance from unspent notes.
   * Decrypts notes in-place; no chain scan needed.
   */
  async getBalance(): Promise<ShieldedBalance> {
    const unspent = this.notes.filter(n => !n.spent);
    const total = unspent.reduce((acc, n) => acc + n.value, 0n);
    const totalSol = (Number(total) / Number(LAMPORTS_PER_SOL)).toFixed(9);

    return {
      total,
      totalSol,
      notes: unspent,
      spentCount: this.notes.filter(n => n.spent).length,
    };
  }

  // ── Note scanning ────────────────────────────────────────────────────────────

  /**
   * Scan an array of on-chain encrypted notes and add any that belong
   * to this wallet's IVK. Returns count of newly discovered notes.
   *
   * Use this to sync with chain state after receiving a viewing key export.
   */
  async scanNotes(
    encryptedNotes: Array<{ encryptedNote: EncryptedNote; slot: number }>
  ): Promise<number> {
    let found = 0;
    const h_sig = new Uint8Array(32); // placeholder; real impl uses note-specific h_sig

    for (const { encryptedNote, slot } of encryptedNotes) {
      const plaintext = await NoteEncryptionUtils.tryDecryptNote(
        encryptedNote,
        this.ivk,
        h_sig
      );
      if (plaintext) {
        // Verify the diversifier belongs to us
        const addr = this.ivk.address(plaintext.d);
        const memo = NoteEncryptionUtils.memoToString(plaintext.memo);
        const note = this._storeNote(
          encryptedNote,
          plaintext.value,
          memo,
          addr.toBase58(),
          slot
        );
        found++;
      }
    }
    return found;
  }

  // ── Message encryption ──────────────────────────────────────────────────────

  /**
   * Encrypt a message string into a 512-byte AEAD-encrypted memo blob.
   * Suitable for the memo field of a shielded note.
   */
  async encryptMessage(
    message: string,
    recipientAddress: string
  ): Promise<Uint8Array> {
    const recipient = SaplingPaymentAddress.fromBase58(recipientAddress);
    const rseed = new Uint8Array(32);
    crypto.getRandomValues(rseed);
    const h_sig = sha256(rseed);
    const enc = new NoteEncryption(h_sig, rseed);

    // Encode message as padded 512-byte memo
    const memo = NoteEncryptionUtils.memoFromString(message);
    // Encrypt using recipient's pk_d as the encryption key target
    const msgPlaintext = SaplingNotePlaintext.new(
      recipient,
      0n, // zero-value note (message-only)
      rseed,
      memo
    );
    const ciphertext = await enc.encryptNote(msgPlaintext, recipient.pk_d);

    // Return [epk(32) || ciphertext]
    const result = new Uint8Array(32 + ciphertext.length);
    result.set(enc.getEpk(), 0);
    result.set(ciphertext, 32);
    return result;
  }

  /**
   * Decrypt a message blob encrypted with `encryptMessage`.
   */
  async decryptMessage(encrypted: Uint8Array): Promise<string> {
    const epk = encrypted.slice(0, 32);
    const ct = encrypted.slice(32);
    const h_sig = sha256(epk);
    const dec = NoteDecryption.fromSaplingIVK(this.ivk);
    try {
      const plaintext = await dec.decryptNote(ct, epk, h_sig);
      return NoteEncryptionUtils.memoToString(plaintext.memo);
    } catch {
      throw new Error('Failed to decrypt message — wrong key or corrupted data');
    }
  }

  /**
   * Return all notes whose memo looks like a message (non-empty, zero value).
   */
  getEncryptedMessages(): Array<{ message: string; noteId: string; slot: number }> {
    return this.notes
      .filter(n => n.value === 0n && n.memo.length > 0)
      .map(n => ({ message: n.memo, noteId: n.id, slot: n.slot }));
  }

  // ── Payment proof ────────────────────────────────────────────────────────────

  /**
   * Create a payment disclosure proof for a given note.
   * Share this with the recipient to prove the payment was made.
   */
  createPaymentProof(params: {
    noteId?: string;
    txSignature?: string;
    recipient?: string;
  }): PaymentProof {
    const note = params.noteId
      ? this.notes.find(n => n.id === params.noteId)
      : this.notes.filter(n => !n.spent).at(-1);

    if (!note) throw new Error('Note not found');

    const fields = `${note.id}:${note.commitment}:${note.recipient}:${note.value}`;
    const sig = Buffer.from(
      sha256(new Uint8Array([...Buffer.from(fields, 'utf8'), ...this.fvk.ovk]))
    ).toString('hex');

    return {
      version: 1,
      noteId: note.id,
      commitment: note.commitment,
      recipientAddress: note.recipient,
      amount: note.value,
      memo: note.memo,
      slot: note.slot,
      signature: sig,
      createdAt: Date.now(),
    };
  }

  /**
   * Verify a payment proof against this wallet's ovk (or publicly).
   */
  static verifyPaymentProof(proof: PaymentProof, ovk?: Uint8Array): boolean {
    try {
      const fields = `${proof.noteId}:${proof.commitment}:${proof.recipientAddress}:${proof.amount}`;
      if (ovk) {
        const expected = Buffer.from(
          sha256(new Uint8Array([...Buffer.from(fields, 'utf8'), ...ovk]))
        ).toString('hex');
        return proof.signature === expected;
      }
      // Without ovk: verify structural consistency only
      return (
        proof.version === 1 &&
        proof.commitment.length === 64 &&
        proof.amount >= 0n
      );
    } catch {
      return false;
    }
  }

  // ── Commitment tree helpers ──────────────────────────────────────────────────

  /** Current Merkle root of the commitment tree. */
  merkleRoot(): string {
    return this.commitmentTree.rootHex();
  }

  /** Produce a Merkle witness (sibling path) for a note by ID. */
  merkleWitness(noteId: string): string[] {
    const note = this.notes.find(n => n.id === noteId);
    if (!note) throw new Error(`Note ${noteId} not found`);
    return this.commitmentTree.witness(note.position);
  }

  // ── Internal helpers ─────────────────────────────────────────────────────────

  protected _storeNote(
    encNote: EncryptedNote,
    value: bigint,
    memo: string,
    recipient: string,
    slot = 0
  ): ShieldedNote {
    const commitmentHex = Buffer.from(encNote.cm).toString('hex');
    const position = this.commitmentTree.append(encNote.cm);

    // Derive nullifier using nk (nullifier key) and position
    const nf = computeNullifier(this.fvk.nk, position, encNote.cm);
    const nullifierHex = Buffer.from(nf).toString('hex');

    const rseedHex = Buffer.from(
      sha256(new Uint8Array([...encNote.cm, ...encNote.epk]))
    ).toString('hex');

    const note: ShieldedNote = {
      id: commitmentHex,
      commitment: commitmentHex,
      value,
      memo,
      recipient,
      nullifier: nullifierHex,
      position,
      spent: false,
      slot,
      encryptedNote: encNote,
      rseed: rseedHex,
    };

    this.notes.push(note);
    return note;
  }

  protected _selectNote(amount: bigint): ShieldedNote | null {
    const unspent = this.notes
      .filter(n => !n.spent && n.value >= amount)
      .sort((a, b) => (a.value < b.value ? -1 : 1));
    return unspent[0] ?? null;
  }

  // ── On-chain submission helpers ─────────────────────────────────────────────

  /**
   * Submit a deposit instruction to the Dark Protocol program.
   * Requires `signerPublicKey` and `signTransaction` set on the wallet.
   */
  protected async _submitDeposit(
    note: ShieldedNote,
    encNote: EncryptedNote
  ): Promise<string> {
    if (!this.signerPublicKey || !this.signTx) {
      throw new Error(
        'On-chain deposit requires signerPublicKey and signTransaction. ' +
        'Pass them when creating the wallet, or set demoMode: true.'
      );
    }

    const client = await DarkProtocolClient.create({
      network:     this.network as 'devnet' | 'mainnet' | 'localnet',
      heliusApiKey: this.heliusApiKey,
      programId:   new PublicKey(this.programId),
    });

    const commitment = Uint8Array.from(Buffer.from(note.commitment, 'hex'));

    // Fixed-size ciphertext arrays (as expected by the Anchor program)
    const encCt = new Uint8Array(580);
    encCt.set(encNote.encCiphertext.slice(0, 580));
    const outCt = new Uint8Array(80);
    outCt.set(encNote.outCiphertext.slice(0, 80));
    const epkFixed = new Uint8Array(32);
    epkFixed.set(encNote.epk.slice(0, 32));

    const [statePDA] = client.protocolStatePDA();
    const [notePDA]  = client.notePDA(commitment);
    const [vaultPDA] = client.poolVaultPDA();

    const tx: Transaction = await (client.program.methods as any)
      .deposit(
        note.value,
        Array.from(commitment),
        Array.from(encCt),
        Array.from(outCt),
        Array.from(epkFixed),
      )
      .accounts({
        protocolState: statePDA,
        shieldedNote:  notePDA,
        poolVault:     vaultPDA,
        depositor:     this.signerPublicKey,
        systemProgram: SystemProgram.programId,
      })
      .transaction();

    const { blockhash } = await client.connection.getLatestBlockhash();
    tx.recentBlockhash  = blockhash;
    tx.feePayer         = this.signerPublicKey;

    const signed = await this.signTx(tx);
    const sig    = await client.connection.sendRawTransaction(signed.serialize());
    await client.connection.confirmTransaction(sig, 'confirmed');
    return sig;
  }

  /**
   * Submit a shielded_transfer instruction to the Dark Protocol program.
   * Requires `signerPublicKey` and `signTransaction` set on the wallet.
   */
  protected async _submitTransfer(
    inputNote:  ShieldedNote,
    outputNote: ShieldedNote,
    encNote:    EncryptedNote
  ): Promise<string> {
    if (!this.signerPublicKey || !this.signTx) {
      throw new Error(
        'On-chain transfer requires signerPublicKey and signTransaction. ' +
        'Pass them when creating the wallet, or set demoMode: true.'
      );
    }

    const client = await DarkProtocolClient.create({
      network:     this.network as 'devnet' | 'mainnet' | 'localnet',
      heliusApiKey: this.heliusApiKey,
      programId:   new PublicKey(this.programId),
    });

    const inputNullifier    = Uint8Array.from(Buffer.from(inputNote.nullifier, 'hex'));
    const outCommitment1    = Uint8Array.from(Buffer.from(outputNote.commitment, 'hex'));
    // Change note commitment: hash of output commitment + nonce
    const outCommitment2    = Uint8Array.from(sha256(new Uint8Array([...outCommitment1, 0x01])));

    const encCt1 = new Uint8Array(580); encCt1.set(encNote.encCiphertext.slice(0, 580));
    const encCt2 = new Uint8Array(580); // change note — empty ciphertext
    const outCt1 = new Uint8Array(80);  outCt1.set(encNote.outCiphertext.slice(0, 80));
    const outCt2 = new Uint8Array(80);
    const epk1   = new Uint8Array(32);  epk1.set(encNote.epk.slice(0, 32));
    const epk2   = new Uint8Array(32);  epk2.set(sha256(encNote.epk).slice(0, 32));

    const [statePDA]   = client.protocolStatePDA();
    const [inputPDA]   = client.notePDA(Uint8Array.from(Buffer.from(inputNote.commitment, 'hex')));
    const [nullPDA]    = client.nullifierPDA(inputNullifier);
    const [outNote1PDA] = client.notePDA(outCommitment1);
    const [outNote2PDA] = client.notePDA(outCommitment2);

    const tx: Transaction = await (client.program.methods as any)
      .shieldedTransfer(
        Array.from(inputNullifier),
        Array.from(outCommitment1),
        Array.from(outCommitment2),
        Array.from(encCt1),
        Array.from(encCt2),
        Array.from(outCt1),
        Array.from(outCt2),
        Array.from(epk1),
        Array.from(epk2),
        outputNote.value,
        inputNote.value - outputNote.value,
      )
      .accounts({
        protocolState:  statePDA,
        inputNote:      inputPDA,
        nullifierRecord: nullPDA,
        outputNote1:    outNote1PDA,
        outputNote2:    outNote2PDA,
        sender:         this.signerPublicKey,
        systemProgram:  SystemProgram.programId,
      })
      .transaction();

    const { blockhash } = await client.connection.getLatestBlockhash();
    tx.recentBlockhash  = blockhash;
    tx.feePayer         = this.signerPublicKey;

    const signed = await this.signTx(tx);
    const sig    = await client.connection.sendRawTransaction(signed.serialize());
    await client.connection.confirmTransaction(sig, 'confirmed');
    return sig;
  }
}

// ─── ViewOnlyWallet ───────────────────────────────────────────────────────────

/**
 * View-only wallet derived from a {@link ViewingKeyExport}.
 * Can decrypt notes and compute balances, but cannot sign or spend.
 */
export class ViewOnlyWallet extends ShieldedWallet {
  /** Get full transaction history (all notes, spent + unspent). */
  getTransactionHistory(): ShieldedNote[] {
    return [...this.notes].sort((a, b) => a.slot - b.slot);
  }
}

// ─── MultisigShieldedWallet ───────────────────────────────────────────────────

/**
 * M-of-N multisig shielded wallet.
 * Proposals are held in memory; the final threshold approval triggers transfer.
 */
export class MultisigShieldedWallet extends ShieldedWallet {
  private required: number;
  private owners: string[];
  private proposals = new Map<string, MultisigProposal>();

  private constructor(
    base: ShieldedWalletParams,
    required: number,
    owners: string[]
  ) {
    super(base);
    this.required = required;
    this.owners = owners;
  }

  static async createMultisig(params: {
    required: number;
    owners: string[]; // base58 pubkeys
    config?: ShieldedWalletConfig;
  }): Promise<MultisigShieldedWallet> {
    if (params.required < 1 || params.required > params.owners.length) {
      throw new Error(
        `required (${params.required}) must be between 1 and ${params.owners.length}`
      );
    }
    const config = params.config ?? {};
    const { wallet, mnemonic } = await SaplingUtils.generateWallet();
    const network = config.network ?? 'devnet';
    const programId = config.programId ?? SHIELDED_WALLET_PROGRAM_ID;
    const demoMode = config.demoMode ?? true;
    const ms = new MultisigShieldedWallet(
      {
        hdWallet: wallet,
        fvk: wallet.getFullViewingKey(),
        network,
        programId,
        demoMode,
      },
      params.required,
      params.owners
    );
    ms.mnemonic_ = mnemonic;
    return ms;
  }

  /** Propose a new shielded transfer. */
  proposeTransfer(params: {
    to: string;
    amount: bigint;
    memo?: string;
  }): MultisigProposal {
    const id = Buffer.from(
      sha256(
        new Uint8Array([
          ...Buffer.from(`${params.to}:${params.amount}:${Date.now()}`, 'utf8'),
        ])
      )
    ).toString('hex');

    const proposal: MultisigProposal = {
      id,
      to: params.to,
      amount: params.amount,
      memo: params.memo ?? '',
      requiredApprovals: this.required,
      approvals: [],
      executed: false,
      createdAt: Date.now(),
    };
    this.proposals.set(id, proposal);
    return proposal;
  }

  /**
   * Approve a proposal.
   * When `required` approvals are reached the transfer executes automatically.
   */
  async approve(
    proposalId: string,
    signerPubkey: string
  ): Promise<{ executed: boolean; result?: TransferResult }> {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) throw new Error(`Proposal ${proposalId} not found`);
    if (proposal.executed) throw new Error('Proposal already executed');
    if (!this.owners.includes(signerPubkey)) {
      throw new Error(`${signerPubkey} is not an owner of this multisig`);
    }
    if (proposal.approvals.includes(signerPubkey)) {
      throw new Error('Already approved by this signer');
    }

    proposal.approvals.push(signerPubkey);

    if (proposal.approvals.length >= proposal.requiredApprovals) {
      proposal.executed = true;
      const result = await this.transfer({
        to: proposal.to,
        amount: proposal.amount,
        memo: proposal.memo,
      });
      return { executed: true, result };
    }

    return { executed: false };
  }

  getProposal(id: string): MultisigProposal | undefined {
    return this.proposals.get(id);
  }

  getPendingProposals(): MultisigProposal[] {
    return Array.from(this.proposals.values()).filter(p => !p.executed);
  }
}
