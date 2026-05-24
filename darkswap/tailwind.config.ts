import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        dark: {
          900: "#020208",
          800: "#060612",
          700: "#0a0a18",
          600: "#0f0f22",
          500: "#141430",
        },
        neon: {
          cyan:   "#00f5ff",
          green:  "#00ff88",
          purple: "#a855f7",
          pink:   "#ff00aa",
          amber:  "#ffaa00",
          blue:   "#3b82f6",
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "Cascadia Code", "Consolas", "monospace"],
      },
      boxShadow: {
        "neon-cyan":   "0 0 20px rgba(0,245,255,0.35), 0 0 60px rgba(0,245,255,0.10)",
        "neon-green":  "0 0 20px rgba(0,255,136,0.35), 0 0 60px rgba(0,255,136,0.10)",
        "neon-purple": "0 0 20px rgba(168,85,247,0.35), 0 0 60px rgba(168,85,247,0.10)",
        "neon-amber":  "0 0 20px rgba(255,170,0,0.35),  0 0 60px rgba(255,170,0,0.10)",
        "neon-pink":   "0 0 20px rgba(255,0,170,0.35),  0 0 60px rgba(255,0,170,0.10)",
        "card":        "0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)",
      },
      animation: {
        /* existing */
        "pulse-slow":  "pulse 3s cubic-bezier(0.4,0,0.6,1) infinite",
        "spin-slow":   "spin 8s linear infinite",
        "glow":        "glow 2s ease-in-out infinite alternate",
        "scan":        "scan 3s linear infinite",
        /* new */
        "orb-drift-1": "orb-drift-1 18s ease-in-out infinite alternate",
        "orb-drift-2": "orb-drift-2 22s ease-in-out infinite alternate",
        "orb-drift-3": "orb-drift-3 15s ease-in-out infinite alternate",
        "float":       "float 4s ease-in-out infinite",
        "glow-pulse":  "glow-pulse 2.5s ease-in-out infinite",
        "flicker":     "neon-flicker 8s ease-in-out infinite",
        "ticker":      "ticker-scroll 40s linear infinite",
        "shimmer":     "shimmer-slide 2s ease-in-out infinite",
        "border-spin": "border-spin 4s linear infinite",
        "quote-in":    "quote-appear 0.25s ease-out forwards",
        "slide-up":    "slide-up 0.4s ease-out forwards",
        "fade-in":     "fade-in 0.3s ease-out forwards",
      },
      keyframes: {
        glow: {
          "0%":   { boxShadow: "0 0 5px rgba(0,245,255,0.2)" },
          "100%": { boxShadow: "0 0 20px rgba(0,245,255,0.6), 0 0 60px rgba(0,245,255,0.2)" },
        },
        scan: {
          "0%":   { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)"  },
        },
        "orb-drift-1": {
          "0%":   { transform: "translate(0,0) scale(1)" },
          "33%":  { transform: "translate(30px,-20px) scale(1.1)" },
          "66%":  { transform: "translate(-20px,15px) scale(0.95)" },
          "100%": { transform: "translate(10px,-10px) scale(1.05)" },
        },
        "orb-drift-2": {
          "0%":   { transform: "translate(0,0) scale(1)" },
          "50%":  { transform: "translate(-40px,30px) scale(1.15)" },
          "100%": { transform: "translate(20px,-15px) scale(0.9)" },
        },
        "orb-drift-3": {
          "0%":   { transform: "translate(0,0) scale(1)" },
          "40%":  { transform: "translate(25px,20px) scale(1.08)" },
          "100%": { transform: "translate(-15px,-10px) scale(1.02)" },
        },
        float: {
          "0%,100%": { transform: "translateY(0px)" },
          "50%":     { transform: "translateY(-6px)" },
        },
        "glow-pulse": {
          "0%,100%": { boxShadow: "0 0 10px rgba(0,245,255,0.15)" },
          "50%":     { boxShadow: "0 0 30px rgba(0,245,255,0.4), 0 0 60px rgba(0,245,255,0.15)" },
        },
        "neon-flicker": {
          "0%,95%,100%": { opacity: "1" },
          "96%":          { opacity: "0.7" },
          "97%":          { opacity: "1" },
          "98%":          { opacity: "0.4" },
          "99%":          { opacity: "1" },
        },
        "ticker-scroll": {
          "0%":   { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "shimmer-slide": {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition:  "200% 0" },
        },
        "border-spin": {
          "0%":   { "--angle": "0deg"   },
          "100%": { "--angle": "360deg" },
        },
        "quote-appear": {
          "0%":   { opacity: "0", transform: "translateY(4px) scale(0.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)"      },
        },
        "slide-up": {
          "0%":   { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)"    },
        },
        "fade-in": {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      transitionTimingFunction: {
        spring:  "cubic-bezier(0.34,1.56,0.64,1)",
        smooth:  "cubic-bezier(0.4,0,0.2,1)",
      },
    },
  },
  plugins: [],
};

export default config;
