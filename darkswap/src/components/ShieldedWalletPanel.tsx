"use client";

import { useState, useEffect, useCallback } from "react";
import { Shield, Eye, Copy, Check, RefreshCw, ArrowDownToLine, Send, Lock, Unlock, FileText, ChevronDown, ChevronUp } from "lucide-react";
import toast from "react-hot-toast";
import { BrowserShieldedWallet } from "@/lib/shielded";
import type { ShieldedBalance, ShieldedNote, ViewingKeyExport, PaymentProof } from "@/types";

const LAMPORTS_PER_SOL = 1_000_000_000n;

function solToLamports(sol: string): bigint {
  const n = parseFloat(sol);
  if (!isFinite(n) || n <= 0) return 0n;
  return BigInt(Math.floor(n * 1e9));
}

function truncateAddr(addr: string, head = 10, tail = 6): string {
  if (addr.length <= head + tail + 3) return addr;
  return `${addr.slice(0, head)}…${addr.slice(-tail)}`;
}

function truncateHex(hex: string, chars = 12): string {
  return `${hex.slice(0, chars)}…`;
}

// ── Sub: CopyButton ───────────────────────────────────────────────────────────

function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`transition-colors ${className}`}
      title="Copy"
    >
      {copied ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
    </button>
  );
}

// ── Sub: NoteRow ──────────────────────────────────────────────────────────────

function NoteRow({ note, onProof }: { note: ShieldedNote; onProof: (id: string) => void }) {
  const solAmount = (Number(BigInt(note.valueLamports)) / 1e9).toFixed(4);
  const isSelf = note.memo === "change" || note.memo === "";

  return (
    <div className={`flex items-center justify-between py-1.5 px-2 rounded-lg ${note.spent ? "opacity-40" : ""}`}>
      <div className="flex items-center gap-2 min-w-0">
        <div
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
            note.spent ? "bg-slate-600" : isSelf ? "bg-cyan-400" : "bg-purple-400"
          }`}
        />
        <div className="min-w-0">
          <div className="text-xs font-mono text-slate-300">
            {note.spent ? "−" : "+"}{solAmount} SOL
          </div>
          <div className="text-[10px] text-slate-600 truncate">
            {note.memo || truncateHex(note.commitment)}
          </div>
        </div>
      </div>
      {!note.spent && (
        <button
          type="button"
          onClick={() => onProof(note.id)}
          className="text-[10px] text-slate-600 hover:text-purple-400 transition-colors shrink-0 ml-2"
          title="Create payment proof"
        >
          <FileText size={10} />
        </button>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function ShieldedWalletPanel() {
  const [wallet, setWallet] = useState<BrowserShieldedWallet | null>(null);
  const [balance, setBalance] = useState<ShieldedBalance | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [tab, setTab] = useState<"deposit" | "transfer">("deposit");
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  // Form state
  const [depositAmount, setDepositAmount] = useState("");
  const [depositMemo, setDepositMemo] = useState("");
  const [transferTo, setTransferTo] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferMemo, setTransferMemo] = useState("");

  // Modal state
  const [viewingKey, setViewingKey] = useState<ViewingKeyExport | null>(null);
  const [paymentProof, setPaymentProof] = useState<PaymentProof | null>(null);

  // Load or create wallet on mount
  useEffect(() => {
    BrowserShieldedWallet.load().then(w => {
      setWallet(w);
      setInitializing(false);
      return w.getBalance();
    }).then(setBalance).catch(() => setInitializing(false));
  }, []);

  const refreshBalance = useCallback(async () => {
    if (!wallet) return;
    const bal = await wallet.getBalance();
    setBalance(bal);
  }, [wallet]);

  const handleDeposit = useCallback(async () => {
    if (!wallet) return;
    const lamports = solToLamports(depositAmount);
    if (lamports <= 0n) { toast.error("Enter a valid amount"); return; }

    setLoading(true);
    const toastId = toast.loading("Shielding tokens…");
    try {
      const result = await wallet.deposit({ amount: lamports, memo: depositMemo });
      await refreshBalance();
      toast.success(`Shielded ${depositAmount} SOL ✓ (demo)`, { id: toastId });
      setDepositAmount("");
      setDepositMemo("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Deposit failed", { id: toastId });
    } finally {
      setLoading(false);
    }
  }, [wallet, depositAmount, depositMemo, refreshBalance]);

  const handleTransfer = useCallback(async () => {
    if (!wallet) return;
    if (!transferTo.startsWith("dark1")) { toast.error("Recipient must be a dark1… shielded address"); return; }
    const lamports = solToLamports(transferAmount);
    if (lamports <= 0n) { toast.error("Enter a valid amount"); return; }

    setLoading(true);
    const toastId = toast.loading("Sending shielded transfer…");
    try {
      await wallet.transfer({ to: transferTo, amount: lamports, memo: transferMemo });
      await refreshBalance();
      toast.success("Private transfer complete ✓ (demo)", { id: toastId });
      setTransferTo("");
      setTransferAmount("");
      setTransferMemo("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Transfer failed", { id: toastId });
    } finally {
      setLoading(false);
    }
  }, [wallet, transferTo, transferAmount, transferMemo, refreshBalance]);

  const handleExportViewingKey = useCallback(() => {
    if (!wallet) return;
    setViewingKey(wallet.exportViewingKey());
  }, [wallet]);

  const handleCreateProof = useCallback(async (noteId: string) => {
    if (!wallet) return;
    try {
      const proof = await wallet.createPaymentProof(noteId);
      setPaymentProof(proof);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Proof failed");
    }
  }, [wallet]);

  const handleReset = useCallback(async () => {
    if (!confirm("Reset shielded wallet? All local notes will be erased.")) return;
    const w = await BrowserShieldedWallet.reset();
    setWallet(w);
    const bal = await w.getBalance();
    setBalance(bal);
    setViewingKey(null);
    setPaymentProof(null);
    toast.success("Shielded wallet reset");
  }, []);

  const addr = wallet?.getShieldedAddress() ?? "";
  const allNotes = wallet?.getAllNotes() ?? [];

  return (
    <>
      <div className="glass rounded-xl overflow-hidden" style={{ border: "1px solid rgba(34,211,238,0.15)" }}>
        {/* Header row */}
        <div className="w-full flex items-center justify-between p-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Shield size={13} className="text-cyan-400 shrink-0" />
            <span className="text-xs font-semibold text-cyan-400 tracking-wider">SHIELDED WALLET</span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
              ALPHA
            </span>
            {balance && balance.total > 0n && (
              <span className="text-xs font-mono text-cyan-300 ml-1">
                {balance.totalSol} SOL
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={refreshBalance}
              disabled={initializing}
              className="p-0.5 text-slate-500 hover:text-cyan-400 transition-colors disabled:opacity-40"
              title="Refresh balance"
            >
              <RefreshCw size={11} className={initializing ? "animate-spin" : ""} />
            </button>
            <button
              type="button"
              onClick={() => setExpanded(v => !v)}
              className="p-0.5 text-slate-500 hover:text-slate-300 transition-colors"
              aria-label={expanded ? "Collapse" : "Expand"}
            >
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          </div>
        </div>

        {expanded && (
          <div className="px-3 pb-3 pt-0 border-t border-white/5 space-y-3">
            {/* Shielded address */}
            <div className="bg-white/3 rounded-lg p-2.5 border border-white/6">
              <div className="text-[10px] text-slate-500 mb-1">Shielded Address (Sapling)</div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-cyan-300 truncate">{truncateAddr(addr, 14, 8)}</span>
                <CopyButton text={addr} className="text-slate-500 hover:text-cyan-400 shrink-0" />
              </div>
            </div>

            {/* Balance grid */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl p-2.5 bg-cyan-500/8 border border-cyan-500/20">
                <div className="text-[10px] text-cyan-500 mb-1">Shielded</div>
                <div className="text-sm font-mono font-semibold text-cyan-300">
                  {balance ? `${balance.totalSol} SOL` : "—"}
                </div>
              </div>
              <div className="rounded-xl p-2.5 bg-white/4 border border-white/8">
                <div className="text-[10px] text-slate-500 mb-1">Notes</div>
                <div className="text-sm font-mono font-semibold text-slate-300">
                  {balance ? `${balance.notes.length} unspent` : "—"}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1.5">
              {(["deposit", "transfer"] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                    tab === t
                      ? "bg-cyan-500/15 text-cyan-400 border-cyan-500/30"
                      : "bg-white/4 text-slate-500 border-white/8 hover:border-white/15"
                  }`}
                >
                  {t === "deposit" ? <ArrowDownToLine size={11} /> : <Send size={11} />}
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            {/* Deposit form */}
            {tab === "deposit" && (
              <div className="space-y-2">
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Shield SOL from your transparent wallet into the private pool. Demo mode — no on-chain tx.
                </p>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="Amount (SOL)"
                  value={depositAmount}
                  onChange={e => setDepositAmount(e.target.value)}
                  className="w-full bg-white/4 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-slate-600 border border-white/8 focus:outline-none focus:border-cyan-500/30"
                />
                <input
                  type="text"
                  placeholder="Memo (optional)"
                  value={depositMemo}
                  onChange={e => setDepositMemo(e.target.value)}
                  className="w-full bg-white/4 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-slate-600 border border-white/8 focus:outline-none focus:border-cyan-500/30"
                />
                <button
                  type="button"
                  onClick={handleDeposit}
                  disabled={loading || !depositAmount}
                  className="w-full py-2 rounded-lg text-xs font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/25 hover:bg-cyan-500/20 hover:border-cyan-500/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Lock size={10} className="inline mr-1.5" />
                  Shield Tokens
                </button>
              </div>
            )}

            {/* Transfer form */}
            {tab === "transfer" && (
              <div className="space-y-2">
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Send privately to any dark1… shielded address. On-chain graph obfuscated.
                </p>
                <input
                  type="text"
                  placeholder="Recipient (dark1…)"
                  value={transferTo}
                  onChange={e => setTransferTo(e.target.value)}
                  className="w-full bg-white/4 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-slate-600 border border-white/8 focus:outline-none focus:border-purple-500/30"
                />
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="Amount (SOL)"
                  value={transferAmount}
                  onChange={e => setTransferAmount(e.target.value)}
                  className="w-full bg-white/4 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-slate-600 border border-white/8 focus:outline-none focus:border-purple-500/30"
                />
                <input
                  type="text"
                  placeholder="Encrypted memo (optional)"
                  value={transferMemo}
                  onChange={e => setTransferMemo(e.target.value)}
                  className="w-full bg-white/4 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-slate-600 border border-white/8 focus:outline-none focus:border-purple-500/30"
                />
                <button
                  type="button"
                  onClick={handleTransfer}
                  disabled={loading || !transferTo || !transferAmount}
                  className="w-full py-2 rounded-lg text-xs font-bold text-purple-400 bg-purple-500/10 border border-purple-500/25 hover:bg-purple-500/20 hover:border-purple-500/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Shield size={10} className="inline mr-1.5" />
                  Send Privately
                </button>
              </div>
            )}

            {/* Note history */}
            {allNotes.length > 0 && (
              <div className="space-y-1">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Note History</div>
                <div className="space-y-0.5 max-h-32 overflow-y-auto">
                  {allNotes.map(note => (
                    <NoteRow key={note.id} note={note} onProof={handleCreateProof} />
                  ))}
                </div>
              </div>
            )}

            {/* Feature list */}
            {allNotes.length === 0 && (
              <div className="space-y-1">
                {[
                  "Zcash Sapling key hierarchy (sk → fvk → ivk → addr)",
                  "ChaCha20-Poly1305 note encryption",
                  "Nullifier double-spend prevention",
                  "Viewing key export for auditors",
                ].map(f => (
                  <div key={f} className="flex items-center gap-1.5">
                    <div className="w-1 h-1 rounded-full bg-cyan-400" />
                    <span className="text-[10px] text-slate-500">{f}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1 border-t border-white/5">
              <button
                type="button"
                onClick={handleExportViewingKey}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] text-slate-400 bg-white/4 hover:bg-white/8 border border-white/8 hover:border-white/15 transition-all"
              >
                <Eye size={10} />
                Viewing Key
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] text-slate-600 hover:text-red-400 bg-white/4 hover:bg-red-500/5 border border-white/8 hover:border-red-500/20 transition-all"
              >
                <Unlock size={10} />
                Reset
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Viewing key modal */}
      {viewingKey && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.85)" }}
          onClick={() => setViewingKey(null)}
        >
          <div
            className="glass rounded-2xl p-5 max-w-sm w-full space-y-3"
            style={{ border: "1px solid rgba(34,211,238,0.25)" }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <Eye size={14} className="text-cyan-400" />
              <h2 className="text-sm font-bold text-cyan-400 tracking-wider">VIEWING KEY EXPORT</h2>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Share this with auditors. It allows decrypting notes but cannot spend funds.
            </p>
            {(["fvk", "ivk", "ovk"] as const).map(k => (
              <div key={k} className="bg-white/4 rounded-lg p-2 border border-white/8">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] text-slate-500 uppercase">{k}</span>
                  <CopyButton text={viewingKey[k]} className="text-slate-500 hover:text-cyan-400" />
                </div>
                <div className="text-[10px] font-mono text-slate-300 break-all">{viewingKey[k]}</div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setViewingKey(null)}
              className="w-full py-2 rounded-lg text-xs text-slate-400 bg-white/5 border border-white/10 hover:border-white/20 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Payment proof modal */}
      {paymentProof && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.85)" }}
          onClick={() => setPaymentProof(null)}
        >
          <div
            className="glass rounded-2xl p-5 max-w-sm w-full space-y-3"
            style={{ border: "1px solid rgba(168,85,247,0.25)" }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <FileText size={14} className="text-purple-400" />
              <h2 className="text-sm font-bold text-purple-400 tracking-wider">PAYMENT PROOF</h2>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Cryptographic proof that this payment was made. Share with recipient to verify.
            </p>
            {[
              ["Note ID", truncateHex(paymentProof.noteId, 16)],
              ["Amount", `${(Number(BigInt(paymentProof.amount)) / 1e9).toFixed(4)} SOL`],
              ["Recipient", truncateAddr(paymentProof.recipientAddress)],
              ["Signature", truncateHex(paymentProof.signature, 20)],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="text-[10px] text-slate-500">{label}</span>
                <span className="text-[10px] font-mono text-purple-300">{value}</span>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(paymentProof, null, 2));
                toast.success("Proof copied to clipboard");
              }}
              className="w-full py-2 rounded-lg text-xs text-purple-400 bg-purple-500/10 border border-purple-500/25 hover:bg-purple-500/20 transition-all"
            >
              <Copy size={10} className="inline mr-1.5" />
              Copy Full Proof
            </button>
            <button
              type="button"
              onClick={() => setPaymentProof(null)}
              className="w-full py-2 rounded-lg text-xs text-slate-400 bg-white/5 border border-white/10 hover:border-white/20 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
