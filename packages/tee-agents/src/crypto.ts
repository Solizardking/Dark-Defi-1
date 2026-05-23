import { createHash, randomBytes } from "node:crypto";
import nacl from "tweetnacl";
import bs58 from "bs58";

/** 32-byte SHA-256 digest of arbitrary input. */
export function sha256(data: Uint8Array | string): Uint8Array {
  const buf = typeof data === "string" ? Buffer.from(data, "utf8") : Buffer.from(data);
  return new Uint8Array(createHash("sha256").update(buf).digest());
}

export function toHex(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("hex");
}

export function fromHex(hex: string): Uint8Array {
  return new Uint8Array(Buffer.from(hex, "hex"));
}

export function toBase58(bytes: Uint8Array): string {
  return bs58.encode(bytes);
}

export function fromBase58(s: string): Uint8Array {
  return bs58.decode(s);
}

/** An ed25519 signing identity (used for TEE quote signatures). */
export interface SigningKeypair {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
}

export function generateSigningKeypair(seed?: Uint8Array): SigningKeypair {
  const kp = seed ? nacl.sign.keyPair.fromSeed(seed.slice(0, 32)) : nacl.sign.keyPair();
  return { publicKey: kp.publicKey, secretKey: kp.secretKey };
}

export function sign(message: Uint8Array, secretKey: Uint8Array): Uint8Array {
  return nacl.sign.detached(message, secretKey);
}

export function verifySignature(
  message: Uint8Array,
  signature: Uint8Array,
  publicKey: Uint8Array
): boolean {
  return nacl.sign.detached.verify(message, signature, publicKey);
}

/** An x25519 box keypair (used to seal confidential inference payloads). */
export interface BoxKeypair {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
}

export function generateBoxKeypair(): BoxKeypair {
  const kp = nacl.box.keyPair();
  return { publicKey: kp.publicKey, secretKey: kp.secretKey };
}

export interface SealedMessage {
  /** base58 ephemeral x25519 public key of the sender. */
  ephemeralPublicKey: string;
  /** base58 24-byte nonce. */
  nonce: string;
  /** base58 ciphertext (xsalsa20-poly1305). */
  ciphertext: string;
}

/**
 * Seal a payload to a recipient's x25519 public key using an ephemeral sender
 * key (anonymous sender box). Only the holder of the recipient secret key —
 * e.g. an attested TEE — can open it.
 */
export function seal(plaintext: Uint8Array, recipientPublicKey: Uint8Array): SealedMessage {
  const ephemeral = nacl.box.keyPair();
  const nonce = randomBytes(nacl.box.nonceLength);
  const ciphertext = nacl.box(plaintext, nonce, recipientPublicKey, ephemeral.secretKey);
  return {
    ephemeralPublicKey: toBase58(ephemeral.publicKey),
    nonce: toBase58(nonce),
    ciphertext: toBase58(ciphertext),
  };
}

export function open(sealed: SealedMessage, recipientSecretKey: Uint8Array): Uint8Array {
  const opened = nacl.box.open(
    fromBase58(sealed.ciphertext),
    fromBase58(sealed.nonce),
    fromBase58(sealed.ephemeralPublicKey),
    recipientSecretKey
  );
  if (!opened) {
    throw new Error("Failed to open sealed message: bad key or tampered ciphertext");
  }
  return opened;
}

export function randomNonce(length = 32): Uint8Array {
  return new Uint8Array(randomBytes(length));
}
