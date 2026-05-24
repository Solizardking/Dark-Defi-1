import { useCallback } from "react";
import { VersionedTransaction, Transaction, Connection } from "@solana/web3.js";
import type { PublicKey } from "@solana/web3.js";
import toast from "react-hot-toast";
import type { SwapQuote, SwapStatus, ProgressStep } from "@/types";

interface Deps {
  quote:           SwapQuote | null;
  publicKey:       PublicKey | null;
  signTransaction: ((tx: VersionedTransaction) => Promise<VersionedTransaction>) | null;
  connection:      Connection;
  onStatus:        (status: SwapStatus, extra?: { error?: string; txSignature?: string }) => void;
  onProgress:      (step: ProgressStep) => void;
  onBurst:         () => void;
}

export function useSwapExecution({
  quote,
  publicKey,
  signTransaction,
  connection,
  onStatus,
  onProgress,
  onBurst,
}: Deps) {
  return useCallback(async () => {
    if (!quote || !publicKey || !signTransaction) return;

    onStatus("swapping");
    const toastId = toast.loading("Building transaction...");

    try {
      /* ── 1. Build transaction ─────────────────────────────────── */
      onProgress("signing");
      const swapRes = await fetch("https://quote-api.jup.ag/v6/swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteResponse: quote,
          userPublicKey: publicKey.toString(),
          wrapAndUnwrapSol: true,
          prioritizationFeeLamports: "auto",
        }),
      });
      if (!swapRes.ok) throw new Error("Failed to build swap transaction");
      const { swapTransaction } = await swapRes.json() as { swapTransaction: string };

      const txBuf = Buffer.from(swapTransaction, "base64");
      let tx: VersionedTransaction | Transaction;
      try {
        tx = VersionedTransaction.deserialize(txBuf);
      } catch {
        tx = Transaction.from(txBuf);
      }

      /* ── 2. Sign ───────────────────────────────────────────────── */
      toast.loading("Sign in wallet…", { id: toastId });
      const signed = await signTransaction(tx as VersionedTransaction);

      /* ── 3. Send ───────────────────────────────────────────────── */
      onProgress("sending");
      toast.loading("Broadcasting to Solana…", { id: toastId });
      const rawTx = signed instanceof VersionedTransaction
        ? signed.serialize()
        : (signed as Transaction).serialize();
      const sig = await connection.sendRawTransaction(rawTx, {
        skipPreflight: false,
        maxRetries: 3,
      });

      /* ── 4. Confirm ────────────────────────────────────────────── */
      onProgress("confirming");
      toast.loading("Confirming on-chain…", { id: toastId });
      const conf = await connection.confirmTransaction(sig, "confirmed");
      if (conf.value.err) throw new Error(`Transaction failed: ${JSON.stringify(conf.value.err)}`);

      /* ── 5. Success ────────────────────────────────────────────── */
      onProgress("success");
      onBurst();
      toast.success("🌑 Swap complete!", { id: toastId, duration: 4000 });
      onStatus("success", { txSignature: sig });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Swap failed";
      toast.error(msg, { id: toastId });
      onStatus("error", { error: msg });
      onProgress("error");
    }
  }, [quote, publicKey, signTransaction, connection, onStatus, onProgress, onBurst]);
}
