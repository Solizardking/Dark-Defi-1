"use client";

import { useEffect, useRef } from "react";

/* Canvas-based matrix/particle background — zero external deps */
export function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf: number;
    const chars = "01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホ∑∏∂∇∈∉⊂⊃∪∩";
    const cols: number[] = [];
    let W = 0, H = 0;

    const resize = () => {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
      const n = Math.floor(W / 18);
      cols.length = 0;
      for (let i = 0; i < n; i++) cols.push(Math.random() * -H);
    };

    const tick = () => {
      ctx.fillStyle = "rgba(2,2,8,0.045)";
      ctx.fillRect(0, 0, W, H);

      for (let i = 0; i < cols.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        const x = i * 18;
        const y = cols[i];

        // leading bright character
        ctx.fillStyle = `rgba(0,245,255,${Math.random() * 0.4 + 0.6})`;
        ctx.font = "12px JetBrains Mono, monospace";
        ctx.fillText(char, x, y);

        // trail: random mix of cyan and purple
        if (Math.random() > 0.5) {
          ctx.fillStyle = `rgba(0,245,255,${Math.random() * 0.12})`;
        } else {
          ctx.fillStyle = `rgba(168,85,247,${Math.random() * 0.08})`;
        }
        ctx.fillText(chars[Math.floor(Math.random() * chars.length)], x, y - 14);

        cols[i] += 14;
        if (cols[i] > H + 50 && Math.random() > 0.975) {
          cols[i] = -20;
        }
      }

      raf = requestAnimationFrame(tick);
    };

    resize();
    window.addEventListener("resize", resize);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.032 }}
      aria-hidden
    />
  );
}

/* Pure-CSS floating orb blobs */
export function AmbientOrbs() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden>
      {/* Cyan orb — top-left */}
      <div
        className="orb orb-cyan absolute"
        style={{ width: 600, height: 600, top: "-10%", left: "-10%" }}
      />
      {/* Purple orb — bottom-right */}
      <div
        className="orb orb-purple absolute"
        style={{ width: 500, height: 500, bottom: "-5%", right: "-5%" }}
      />
      {/* Green accent — mid */}
      <div
        className="orb orb-green absolute"
        style={{ width: 300, height: 300, top: "40%", left: "60%" }}
      />
      {/* Extra deep cyan — top-right */}
      <div
        className="orb orb-cyan absolute"
        style={{ width: 400, height: 400, top: "5%", right: "15%", opacity: 0.6,
                 animationDelay: "-6s", animationDuration: "25s" }}
      />
    </div>
  );
}
