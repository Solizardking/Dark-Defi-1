import { DarkSwap } from "@/components/DarkSwap";
import { Shield, Activity, Zap } from "lucide-react";

export default function SwapPage() {
  return (
    <main className="relative min-h-screen grid-bg flex flex-col">
      {/* Nav */}
      <nav className="sticky top-0 z-40 glass border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-lg">🌑</span>
            <span className="text-sm font-bold gradient-text-cyan tracking-widest">DARK PROTOCOL</span>
          </div>
          <div className="hidden sm:flex items-center gap-4">
            <NavPill icon={<Shield size={11} />} label="Privacy ON" color="cyan" />
            <NavPill icon={<Activity size={11} />} label="Oracle ON" color="purple" />
            <NavPill icon={<Zap size={11} />} label="MEV Shield" color="green" />
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="text-center pt-12 pb-8 px-4">
        <h2 className="text-2xl sm:text-3xl font-bold gradient-text-cyan mb-2">
          Swap in the Dark
        </h2>
        <p className="text-sm text-slate-500 max-w-sm mx-auto">
          Oracle-validated · MEV-resistant · Zcash shielded · MagicBlock ephemeral
        </p>
      </div>

      {/* Swap card */}
      <div className="flex-1 flex items-start justify-center px-4 pb-16">
        <div className="w-full max-w-md">
          <DarkSwap />
        </div>
      </div>

      {/* Feature grid */}
      <section className="max-w-4xl mx-auto w-full px-4 pb-16 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: "🔮", title: "Multi-Oracle", desc: "Birdeye + Jupiter price validation" },
          { icon: "🛡️", title: "Token Safety", desc: "Jupiter Shield API risk assessment" },
          { icon: "⚡", title: "MEV Resist", desc: "Private TX submission pipeline" },
          { icon: "🔵", title: "Ephemeral", desc: "MagicBlock rollup privacy layer" },
        ].map((f) => (
          <FeatureCard key={f.title} {...f} />
        ))}
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-6 text-center">
        <p className="text-xs text-slate-600 tracking-wider">
          DARK SWAP v1.0.0 · Built on{" "}
          <span className="text-slate-500">Jupiter · Birdeye · MagicBlock · Helius</span>
        </p>
      </footer>
    </main>
  );
}

function NavPill({ icon, label, color }: { icon: React.ReactNode; label: string; color: "cyan" | "purple" | "green" }) {
  const colorMap = {
    cyan: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    green: "text-green-400 bg-green-500/10 border-green-500/20",
  };
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${colorMap[color]}`}>
      {icon}
      {label}
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="glass neon-border-cyan rounded-xl p-4 flex flex-col gap-2 hover:border-cyan-500/40 transition-colors">
      <span className="text-2xl">{icon}</span>
      <div className="text-xs font-bold text-slate-200">{title}</div>
      <div className="text-xs text-slate-600 leading-relaxed">{desc}</div>
    </div>
  );
}
