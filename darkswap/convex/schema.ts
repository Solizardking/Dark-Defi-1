import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  swaps: defineTable({
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
  })
    .index("by_wallet", ["walletAddress"])
    .index("by_tx", ["txSignature"]),
});
