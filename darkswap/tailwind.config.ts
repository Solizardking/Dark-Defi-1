import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        dark: {
          900: "#030308",
          800: "#07070f",
          700: "#0d0d1a",
          600: "#111122",
          500: "#161630",
        },
        neon: {
          cyan: "#00f5ff",
          green: "#00ff88",
          purple: "#a855f7",
          pink: "#ff00aa",
          amber: "#ffaa00",
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "Consolas", "monospace"],
      },
      boxShadow: {
        "neon-cyan": "0 0 20px rgba(0,245,255,0.4), 0 0 60px rgba(0,245,255,0.1)",
        "neon-green": "0 0 20px rgba(0,255,136,0.4), 0 0 60px rgba(0,255,136,0.1)",
        "neon-purple": "0 0 20px rgba(168,85,247,0.4), 0 0 60px rgba(168,85,247,0.1)",
        "neon-amber": "0 0 20px rgba(255,170,0,0.4), 0 0 60px rgba(255,170,0,0.1)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin-slow": "spin 8s linear infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
        "scan": "scan 3s linear infinite",
      },
      keyframes: {
        glow: {
          "0%": { boxShadow: "0 0 5px rgba(0,245,255,0.2)" },
          "100%": { boxShadow: "0 0 20px rgba(0,245,255,0.6), 0 0 60px rgba(0,245,255,0.2)" },
        },
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
