import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import { SolanaWalletProvider } from "@/components/WalletProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dark Swap | Privacy-First DEX",
  description: "Privacy-preserving token swaps on Solana — Oracle validated, MEV resistant, Zcash shielded.",
  icons: { icon: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🌑</text></svg>" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SolanaWalletProvider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "#07070f",
                border: "1px solid rgba(0,245,255,0.2)",
                color: "#e2e8f0",
                fontFamily: "JetBrains Mono, monospace",
                fontSize: "13px",
                borderRadius: "12px",
              },
              success: {
                iconTheme: { primary: "#00ff88", secondary: "#07070f" },
              },
              error: {
                iconTheme: { primary: "#ff4444", secondary: "#07070f" },
              },
            }}
          />
        </SolanaWalletProvider>
      </body>
    </html>
  );
}
