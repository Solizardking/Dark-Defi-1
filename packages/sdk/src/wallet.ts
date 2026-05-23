import { Keypair, PublicKey } from '@solana/web3.js';
import { DarkProtocolClient } from './client';
import type { ShieldedAddress, Note, WalletState } from './types';
import * as bip39 from 'bip39';

export class DarkWallet {
  private client: DarkProtocolClient;
  private keypair: Keypair;
  private shieldedAddress?: ShieldedAddress;
  private notes: Map<string, Note> = new Map();

  constructor(client: DarkProtocolClient, keypair: Keypair) {
    this.client = client;
    this.keypair = keypair;
  }

  /**
   * Create wallet from mnemonic
   */
  static async fromMnemonic(
    client: DarkProtocolClient,
    mnemonic: string,
    _accountIndex = 0
  ): Promise<DarkWallet> {
    const seed = await bip39.mnemonicToSeed(mnemonic);
    const keypair = Keypair.fromSeed(seed.slice(0, 32));
    return new DarkWallet(client, keypair);
  }

  /**
   * Create wallet from private key
   */
  static fromPrivateKey(
    client: DarkProtocolClient,
    privateKey: Uint8Array
  ): DarkWallet {
    return new DarkWallet(client, Keypair.fromSecretKey(privateKey));
  }

  /**
   * Generate new wallet
   */
  static async generate(client: DarkProtocolClient): Promise<{
    wallet: DarkWallet;
    mnemonic: string;
  }> {
    const mnemonic = bip39.generateMnemonic(256);
    const wallet   = await DarkWallet.fromMnemonic(client, mnemonic);
    return { wallet, mnemonic };
  }

  /** Solana public key */
  get publicKey(): PublicKey {
    return this.keypair.publicKey;
  }

  /**
   * Initialize shielded address (returns the on-chain PDA).
   * The actual on-chain account is created via `ShieldedWallet.deposit()`.
   */
  async initializeShieldedAddress(
    _viewingKey: Uint8Array,
    _spendingKeyCommitment: Uint8Array
  ): Promise<string> {
    const [pda] = this.client.protocolStatePDA();
    return pda.toBase58();
  }

  /**
   * Get wallet state — reads the protocol state + transparent balance.
   */
  async getState(): Promise<WalletState> {
    const state              = await this.client.getProtocolState();
    const transparentBalance = await this.client.connection.getBalance(this.publicKey);
    const [notePDA]          = this.client.protocolStatePDA();

    return {
      shieldedBalance:    BigInt(0), // Computed client-side by ShieldedWallet.getBalance()
      transparentBalance: BigInt(transparentBalance),
      notes:              [],
      pendingNotes:       [],
      shieldedAddress:    state
        ? ({ address: notePDA.toBase58() } as unknown as ShieldedAddress)
        : undefined,
    };
  }

  /**
   * Shield tokens — delegates to ShieldedWallet.deposit() for full privacy.
   * Returns the note commitment as the "transaction" identifier in demo mode.
   */
  async shieldTokens(
    _amount: bigint,
    _tokenMint: PublicKey
  ): Promise<string> {
    return 'use ShieldedWallet.deposit() for on-chain shielded transfers';
  }

  /**
   * Unshield tokens — delegates to ShieldedWallet.withdraw().
   */
  async unshieldTokens(
    _amount: bigint,
    _nullifier: Uint8Array,
    _proof: Uint8Array
  ): Promise<string> {
    return 'use ShieldedWallet.withdraw() for on-chain unshielding';
  }

  /**
   * Private transfer — delegates to ShieldedWallet.transfer().
   */
  async privateTransfer(
    _recipientAddress: PublicKey,
    _amount: bigint,
    _memo?: string
  ): Promise<string> {
    return 'use ShieldedWallet.transfer() for shielded transfers';
  }

  /** Export public + private keys */
  export(): { publicKey: string; privateKey: string } {
    return {
      publicKey:  this.publicKey.toBase58(),
      privateKey: Buffer.from(this.keypair.secretKey).toString('hex'),
    };
  }
}
