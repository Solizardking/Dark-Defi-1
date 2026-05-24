import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const recordSwap = mutation({
  args: {
    walletAddress: v.string(),
    inputMint: v.string(),
    outputMint: v.string(),
    inputSymbol: v.string(),
    outputSymbol: v.string(),
    inputAmount: v.string(),
    outputAmount: v.string(),
    txSignature: v.string(),
    slippageBps: v.number(),
    priceImpactPct: v.string(),
    source: v.string(),
    route: v.string(),
    privacyEnabled: v.boolean(),
    ephemeralEnabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("swaps", args);
  },
});

export const getSwapsByWallet = query({
  args: { walletAddress: v.string() },
  handler: async (ctx, { walletAddress }) => {
    return ctx.db
      .query("swaps")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", walletAddress))
      .order("desc")
      .take(50);
  },
});

export const getRecentSwaps = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query("swaps").order("desc").take(20);
  },
});
