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
import { PublicKey, Transaction } from '@solana/web3.js';
import { SaplingHDWallet, SaplingFullViewingKey, SaplingIncomingViewingKey, SaplingPaymentAddress } from './sapling';
import { EncryptedNote } from './note-encryption';
/** Deployed program ID — Dark Protocol shielded note pool. */
export declare const SHIELDED_WALLET_PROGRAM_ID: "E8zL7h9qHjC7sMf2WCYhdqS5iLkYhPJ9yAhTfevo74jm";
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
/**
 * Simple incremental Merkle tree for note commitments.
 * Uses SHA-256 as the hash function (can upgrade to Poseidon).
 */
export declare class CommitmentTree {
    private leaves;
    private depth;
    append(commitment: Uint8Array): number;
    root(): Uint8Array;
    rootHex(): string;
    size(): number;
    /** Produce a witness path (sibling hashes) for a given leaf index. */
    witness(index: number): string[];
}
/** Tracks spent nullifiers to prevent double-spend. */
export declare class NullifierSet {
    private set;
    /** Add a nullifier (hex). Returns false if already present. */
    add(nullifier: string): boolean;
    has(nullifier: string): boolean;
    size(): number;
    toArray(): string[];
}
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
export declare class ShieldedWallet {
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
    protected notes: ShieldedNote[];
    protected commitmentTree: CommitmentTree;
    protected nullifierSet: NullifierSet;
    protected mnemonic_: string | null;
    protected constructor(params: ShieldedWalletParams);
    /**
     * @internal — Build raw constructor params for subclass factories.
     * Returns params + mnemonic so callers can store the seed if needed.
     */
    protected static _buildParams(config?: ShieldedWalletConfig): Promise<{
        params: ShieldedWalletParams;
        mnemonic: string;
    }>;
    /**
     * Create a brand-new shielded wallet with a fresh keypair.
     */
    static create(config?: ShieldedWalletConfig): Promise<ShieldedWallet>;
    /**
     * Restore wallet from a 24-word BIP-39 mnemonic.
     */
    static fromMnemonic(mnemonic: string, config?: ShieldedWalletConfig): Promise<ShieldedWallet>;
    /**
     * Create a view-only wallet from a {@link ViewingKeyExport}.
     * This wallet can scan and decrypt notes but **cannot spend**.
     */
    static fromViewingKey(vk: ViewingKeyExport): ViewOnlyWallet;
    /**
     * Returns the 24-word BIP-39 mnemonic.
     * Only available if the wallet was freshly generated.
     */
    generateMnemonic(): string;
    /**
     * Export a view-only key bundle.
     * Safe to share with auditors — cannot spend funds.
     */
    exportViewingKey(): ViewingKeyExport;
    /** Get the default (index-0) diversified Sapling payment address. */
    getDefaultAddress(): SaplingPaymentAddress;
    /** Get the shielded address as a base58 string (the "zs1…"-equivalent). */
    getShieldedAddress(): string;
    /**
     * Generate a fresh diversified address at the given index.
     * All addresses share the same keys and are unlinkable by observers.
     */
    getDiversifiedAddress(index: number): string;
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
    deposit(params: {
        amount: bigint;
        memo?: string;
        recipientAddress?: string;
    }): Promise<DepositResult>;
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
    transfer(params: {
        to: string;
        amount: bigint;
        memo?: string;
    }): Promise<TransferResult>;
    /**
     * Compute local balance from unspent notes.
     * Decrypts notes in-place; no chain scan needed.
     */
    getBalance(): Promise<ShieldedBalance>;
    /**
     * Scan an array of on-chain encrypted notes and add any that belong
     * to this wallet's IVK. Returns count of newly discovered notes.
     *
     * Use this to sync with chain state after receiving a viewing key export.
     */
    scanNotes(encryptedNotes: Array<{
        encryptedNote: EncryptedNote;
        slot: number;
    }>): Promise<number>;
    /**
     * Encrypt a message string into a 512-byte AEAD-encrypted memo blob.
     * Suitable for the memo field of a shielded note.
     */
    encryptMessage(message: string, recipientAddress: string): Promise<Uint8Array>;
    /**
     * Decrypt a message blob encrypted with `encryptMessage`.
     */
    decryptMessage(encrypted: Uint8Array): Promise<string>;
    /**
     * Return all notes whose memo looks like a message (non-empty, zero value).
     */
    getEncryptedMessages(): Array<{
        message: string;
        noteId: string;
        slot: number;
    }>;
    /**
     * Create a payment disclosure proof for a given note.
     * Share this with the recipient to prove the payment was made.
     */
    createPaymentProof(params: {
        noteId?: string;
        txSignature?: string;
        recipient?: string;
    }): PaymentProof;
    /**
     * Verify a payment proof against this wallet's ovk (or publicly).
     */
    static verifyPaymentProof(proof: PaymentProof, ovk?: Uint8Array): boolean;
    /** Current Merkle root of the commitment tree. */
    merkleRoot(): string;
    /** Produce a Merkle witness (sibling path) for a note by ID. */
    merkleWitness(noteId: string): string[];
    protected _storeNote(encNote: EncryptedNote, value: bigint, memo: string, recipient: string, slot?: number): ShieldedNote;
    protected _selectNote(amount: bigint): ShieldedNote | null;
    /**
     * Submit a deposit instruction to the Dark Protocol program.
     * Requires `signerPublicKey` and `signTransaction` set on the wallet.
     */
    protected _submitDeposit(note: ShieldedNote, encNote: EncryptedNote): Promise<string>;
    /**
     * Submit a shielded_transfer instruction to the Dark Protocol program.
     * Requires `signerPublicKey` and `signTransaction` set on the wallet.
     */
    protected _submitTransfer(inputNote: ShieldedNote, outputNote: ShieldedNote, encNote: EncryptedNote): Promise<string>;
}
/**
 * View-only wallet derived from a {@link ViewingKeyExport}.
 * Can decrypt notes and compute balances, but cannot sign or spend.
 */
export declare class ViewOnlyWallet extends ShieldedWallet {
    /** Get full transaction history (all notes, spent + unspent). */
    getTransactionHistory(): ShieldedNote[];
}
/**
 * M-of-N multisig shielded wallet.
 * Proposals are held in memory; the final threshold approval triggers transfer.
 */
export declare class MultisigShieldedWallet extends ShieldedWallet {
    private required;
    private owners;
    private proposals;
    private constructor();
    static createMultisig(params: {
        required: number;
        owners: string[];
        config?: ShieldedWalletConfig;
    }): Promise<MultisigShieldedWallet>;
    /** Propose a new shielded transfer. */
    proposeTransfer(params: {
        to: string;
        amount: bigint;
        memo?: string;
    }): MultisigProposal;
    /**
     * Approve a proposal.
     * When `required` approvals are reached the transfer executes automatically.
     */
    approve(proposalId: string, signerPubkey: string): Promise<{
        executed: boolean;
        result?: TransferResult;
    }>;
    getProposal(id: string): MultisigProposal | undefined;
    getPendingProposals(): MultisigProposal[];
}
export {};
//# sourceMappingURL=shielded-wallet.d.ts.map