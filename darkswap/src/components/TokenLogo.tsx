"use client";

import { useState } from "react";
import Image from "next/image";

interface Props {
  logoURI?: string;
  symbol: string;
  size?: number;
}

export function TokenLogo({ logoURI, symbol, size = 32 }: Props) {
  const [errored, setErrored] = useState(false);

  if (!logoURI || errored) {
    return (
      <div
        className="token-logo-fallback"
        style={{ width: size, height: size, fontSize: Math.max(10, size / 3) }}
      >
        {symbol.slice(0, 2).toUpperCase()}
      </div>
    );
  }

  return (
    <Image
      src={logoURI}
      alt={symbol}
      width={size}
      height={size}
      className="rounded-full flex-shrink-0"
      onError={() => setErrored(true)}
      unoptimized
    />
  );
}
