import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { SolanaWalletProvider } from "@/components/WalletProvider";
import { ConvexClientProvider } from "@/components/ConvexProvider";
import "./globals.css";

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Dark Swap | Privacy-First DEX on Solana",
  description: "Privacy-preserving token swaps on Solana — Oracle validated, MEV resistant, Zcash shielded notes, MagicBlock ephemeral accounts.",
  metadataBase: new URL("https://swap.solanaclawd.com"),
  alternates: { canonical: "https://swap.solanaclawd.com" },
  openGraph: {
    title: "Dark Swap | Privacy-First DEX on Solana",
    description: "Swap in the dark. Oracle-validated · MEV-shielded · Zcash shielded notes.",
    url: "https://swap.solanaclawd.com",
    siteName: "Dark Swap",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dark Swap | Privacy-First DEX",
    description: "Swap in the dark. Oracle-validated · MEV-shielded · Zcash shielded notes.",
  },
  icons: { icon: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🌑</text></svg>" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={jetBrainsMono.variable}>
        <ConvexClientProvider>
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
        </ConvexClientProvider>
      </body>
    </html>
  );
}
