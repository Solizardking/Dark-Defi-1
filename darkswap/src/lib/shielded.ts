"use client";

// Browser-safe shielded wallet — Dark Protocol (demo mode)
// Implements Zcash-style note lifecycle using Web Crypto API.
// On-chain settlement requires the deployed Anchor program (roadmap).

import type {
  ShieldedNetwork,
  ShieldedNote,
  ShieldedBalance,
  ViewingKeyExport,
  DepositResult,
  TransferResult,
  PaymentProof,
} from "@/types";

export type { ShieldedNetwork, ShieldedNote, ShieldedBalance, ViewingKeyExport, DepositResult, TransferResult, PaymentProof };

const LAMPORTS_PER_SOL = 1_000_000_000n;

// ── Crypto helpers ────────────────────────────────────────────────────────────

async function sha256(data: Uint8Array): Promise<Uint8Array> {
  // Copy into a plain ArrayBuffer — required by Web Crypto typings in TS 5.x
  const ab = new ArrayBuffer(data.byteLength);
  new Uint8Array(ab).set(data);
  return new Uint8Array(await crypto.subtle.digest("SHA-256", ab));
}

function bytesToHex(b: Uint8Array): string {
  return Array.from(b).map(x => x.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex: string): Uint8Array {
  const arr = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) arr[i / 2] = Number.parseInt(hex.slice(i, i + 2), 16);
  return arr;
}

function strToBytes(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) { out.set(p, offset); offset += p.length; }
  return out;
}

async function domainHash(domain: string, ...data: Uint8Array[]): Promise<Uint8Array> {
  return sha256(concat(strToBytes(domain), ...data));
}

// ── Key derivation ────────────────────────────────────────────────────────────

async function deriveKeys(sk: Uint8Array) {
  const fvk = await domainHash("dark_fvk_v1", sk);
  const ivk = await domainHash("dark_ivk_v1", fvk);
  const ovk = await domainHash("dark_ovk_v1", fvk);
  return { fvk, ivk, ovk };
}

async function deriveAddress(ivk: Uint8Array, index = 0): Promise<string> {
  const idx = new Uint8Array(4);
  new DataView(idx.buffer).setUint32(0, index, false);
  const addrBytes = await domainHash("dark_addr_v1", ivk, idx);
  return `dark1${bytesToHex(addrBytes).slice(0, 40)}`;
}

// ── Note crypto ───────────────────────────────────────────────────────────────

async function computeCommitment(
  amount: bigint,
  recipient: string,
  rseed: Uint8Array
): Promise<Uint8Array> {
  const amtBytes = new Uint8Array(8);
  new DataView(amtBytes.buffer).setBigUint64(0, amount, false);
  return domainHash("dark_cm_v1", amtBytes, strToBytes(recipient), rseed);
}

async function computeNullifier(
  sk: Uint8Array,
  position: number,
  commitment: Uint8Array
): Promise<Uint8Array> {
  const posBytes = new Uint8Array(4);
  new DataView(posBytes.buffer).setUint32(0, position, false);
  return domainHash("dark_nf_v1", sk, posBytes, commitment);
}

async function signProof(ovk: Uint8Array, fields: string): Promise<string> {
  return bytesToHex(await domainHash("dark_proof_v1", ovk, strToBytes(fields)));
}

// ── Persistence ───────────────────────────────────────────────────────────────

const KEYS_STORAGE_KEY = "dark_shielded_keys";
const NOTES_STORAGE_KEY = "dark_shielded_notes";

interface WalletKeys {
  sk: string;
  fvk: string;
  ivk: string;
  ovk: string;
  address: string;
  network: ShieldedNetwork;
  createdAt: number;
}

function loadKeys(): WalletKeys | null {
  try {
    const raw = localStorage.getItem(KEYS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as WalletKeys) : null;
  } catch { return null; }
}

function saveKeys(keys: WalletKeys): void {
  localStorage.setItem(KEYS_STORAGE_KEY, JSON.stringify(keys));
}

function loadNotes(): ShieldedNote[] {
  try {
    const raw = localStorage.getItem(NOTES_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ShieldedNote[]) : [];
  } catch { return []; }
}

function saveNotes(notes: ShieldedNote[]): void {
  localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
}

// ── BrowserShieldedWallet ─────────────────────────────────────────────────────

export class BrowserShieldedWallet {
  private keys: WalletKeys;
  private notes: ShieldedNote[];

  private constructor(keys: WalletKeys, notes: ShieldedNote[]) {
    this.keys = keys;
    this.notes = notes;
  }

  static async create(network: ShieldedNetwork = "devnet"): Promise<BrowserShieldedWallet> {
    const sk = new Uint8Array(32);
    crypto.getRandomValues(sk);
    const { fvk, ivk, ovk } = await deriveKeys(sk);
    const address = await deriveAddress(ivk);

    const keys: WalletKeys = {
      sk: bytesToHex(sk),
      fvk: bytesToHex(fvk),
      ivk: bytesToHex(ivk),
      ovk: bytesToHex(ovk),
      address,
      network,
      createdAt: Date.now(),
    };
    saveKeys(keys);
    saveNotes([]);
    return new BrowserShieldedWallet(keys, []);
  }

  static async load(network: ShieldedNetwork = "devnet"): Promise<BrowserShieldedWallet> {
    const keys = loadKeys();
    if (!keys) return BrowserShieldedWallet.create(network);
    return new BrowserShieldedWallet(keys, loadNotes());
  }

  static async reset(): Promise<BrowserShieldedWallet> {
    localStorage.removeItem(KEYS_STORAGE_KEY);
    localStorage.removeItem(NOTES_STORAGE_KEY);
    return BrowserShieldedWallet.create();
  }

  getShieldedAddress(): string {
    return this.keys.address;
  }

  getNetwork(): ShieldedNetwork {
    return this.keys.network;
  }

  async getBalance(): Promise<ShieldedBalance> {
    const unspent = this.notes.filter(n => !n.spent);
    const total = unspent.reduce((acc, n) => acc + BigInt(n.valueLamports), 0n);
    return {
      total,
      totalSol: (Number(total) / Number(LAMPORTS_PER_SOL)).toFixed(4),
      notes: unspent,
      spentCount: this.notes.filter(n => n.spent).length,
    };
  }

  async deposit(params: { amount: bigint; memo?: string }): Promise<DepositResult> {
    const rseed = new Uint8Array(32);
    crypto.getRandomValues(rseed);

    const cm = await computeCommitment(params.amount, this.keys.address, rseed);
    const position = this.notes.length;
    const nf = await computeNullifier(hexToBytes(this.keys.sk), position, cm);

    const note: ShieldedNote = {
      id: bytesToHex(cm),
      commitment: bytesToHex(cm),
      valueLamports: params.amount.toString(),
      memo: params.memo ?? "",
      recipient: this.keys.address,
      nullifier: bytesToHex(nf),
      position,
      spent: false,
      slot: 0,
      createdAt: Date.now(),
    };

    this.notes.push(note);
    saveNotes(this.notes);

    return {
      noteId: note.id,
      commitment: note.commitment,
      amount: params.amount,
      shieldedAddress: this.keys.address,
      demoMode: true,
    };
  }

  async transfer(params: {
    to: string;
    amount: bigint;
    memo?: string;
  }): Promise<TransferResult> {
    const inputNote = this.notes
      .filter(n => !n.spent && BigInt(n.valueLamports) >= params.amount)
      .sort((a, b) => (BigInt(a.valueLamports) < BigInt(b.valueLamports) ? -1 : 1))[0];

    if (!inputNote) {
      throw new Error(`Insufficient shielded balance — need ${params.amount} lamports`);
    }

    inputNote.spent = true;

    const rseed = new Uint8Array(32);
    crypto.getRandomValues(rseed);

    const cm = await computeCommitment(params.amount, params.to, rseed);
    const position = this.notes.length;
    const nf = await computeNullifier(hexToBytes(this.keys.sk), position, cm);

    const outNote: ShieldedNote = {
      id: bytesToHex(cm),
      commitment: bytesToHex(cm),
      valueLamports: params.amount.toString(),
      memo: params.memo ?? "",
      recipient: params.to,
      nullifier: bytesToHex(nf),
      position,
      spent: false,
      slot: 0,
      createdAt: Date.now(),
    };

    this.notes.push(outNote);

    const change = BigInt(inputNote.valueLamports) - params.amount;
    if (change > 0n) {
      const crseed = new Uint8Array(32);
      crypto.getRandomValues(crseed);
      const ccm = await computeCommitment(change, this.keys.address, crseed);
      const cp = this.notes.length;
      const cnf = await computeNullifier(hexToBytes(this.keys.sk), cp, ccm);
      this.notes.push({
        id: bytesToHex(ccm),
        commitment: bytesToHex(ccm),
        valueLamports: change.toString(),
        memo: "change",
        recipient: this.keys.address,
        nullifier: bytesToHex(cnf),
        position: cp,
        spent: false,
        slot: 0,
        createdAt: Date.now(),
      });
    }

    saveNotes(this.notes);

    return {
      noteId: outNote.id,
      commitment: outNote.commitment,
      nullifierSpent: inputNote.nullifier,
      amount: params.amount,
      recipient: params.to,
      memo: params.memo ?? "",
      demoMode: true,
    };
  }

  exportViewingKey(): ViewingKeyExport {
    return {
      version: 1,
      network: this.keys.network,
      fvk: this.keys.fvk,
      ivk: this.keys.ivk,
      ovk: this.keys.ovk,
      defaultAddress: this.keys.address,
      createdAt: this.keys.createdAt,
    };
  }

  async createPaymentProof(noteId: string): Promise<PaymentProof> {
    const note = this.notes.find(n => n.id === noteId);
    if (!note) throw new Error(`Note ${noteId} not found`);

    const fields = `${note.id}:${note.commitment}:${note.recipient}:${note.valueLamports}`;
    const sig = await signProof(hexToBytes(this.keys.ovk), fields);

    return {
      version: 1,
      noteId: note.id,
      commitment: note.commitment,
      recipientAddress: note.recipient,
      amount: note.valueLamports,
      memo: note.memo,
      slot: note.slot,
      signature: sig,
      createdAt: Date.now(),
    };
  }

  getAllNotes(): ShieldedNote[] {
    return [...this.notes].sort((a, b) => b.createdAt - a.createdAt);
  }
}
