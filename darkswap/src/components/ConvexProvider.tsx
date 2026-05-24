"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import type { ReactNode } from "react";

// When NEXT_PUBLIC_CONVEX_URL is absent (CI build, local dev without Convex)
// use a placeholder so hooks don't throw "no Convex context".
// Mutations will fail with a network error but are swallowed by persistSwap's .catch().
const convexUrl =
  process.env.NEXT_PUBLIC_CONVEX_URL || "https://no-convex.convex.cloud";

const convex = new ConvexReactClient(convexUrl);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
