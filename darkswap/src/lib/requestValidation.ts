const SOLANA_BASE58_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const MAX_RAW_AMOUNT_DIGITS = 40;

export function isSolanaAddress(value: unknown): value is string {
  return typeof value === "string" && SOLANA_BASE58_RE.test(value);
}

export function isRawTokenAmount(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9]+$/.test(value) &&
    value.length <= MAX_RAW_AMOUNT_DIGITS &&
    BigInt(value) > 0n
  );
}

export function parseSlippageBps(value: unknown, fallback = 50): number | null {
  if (value === undefined || value === null || value === "") return fallback;

  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 1000) return null;

  return parsed;
}

export function isBoundedString(value: unknown, maxLength: number): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= maxLength;
}

export function isBase64Payload(value: unknown, maxLength: number): value is string {
  return isBoundedString(value, maxLength) && /^[A-Za-z0-9+/=]+$/.test(value);
}
