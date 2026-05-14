"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
};

const PARTICLE_COUNT_DESKTOP = 70;
const PARTICLE_COUNT_MOBILE = 28;
const CONNECTION_DISTANCE = 130;
const DRIFT_SPEED = 0.12;
const TARGET_FPS = 30; // Slow drift is indistinguishable at 30; halves power use.
const MAX_DPR = 1.5; // Cap retina density — particles are dots, extra DPR is wasted.

const NODE_COLOR = "rgba(176, 164, 224, 0.55)"; // accent-secondary, faded
const LINK_COLOR = "149, 168, 240"; // accent rgb, alpha varies per-pair

/**
 * Drifting particle field rendered to a fixed-position 2D canvas behind
 * the page. ~70 nodes on desktop, ~28 on mobile, with faint connections
 * for nearby pairs.
 *
 * Performance discipline:
 *   - Throttled to 30 FPS via timestamp gating (any human eye reads this
 *     as smooth at this drift speed; 60 FPS would double power use for
 *     no visible benefit).
 *   - Devicepixel ratio capped at 1.5 (we draw 1-2px dots; further
 *     density is just bandwidth).
 *   - `requestAnimationFrame` is cancelled when the tab is hidden.
 *   - `useReducedMotion` swaps the canvas for a static radial gradient.
 *
 * The canvas is `-z-10` and `pointer-events-none`, so it never interferes
 * with the page chrome or any future interactive overlays.
 */
export function ParticleField() {
  const reduced = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (reduced) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    const count = isMobile ? PARTICLE_COUNT_MOBILE : PARTICLE_COUNT_DESKTOP;

    let particles: Particle[] = [];
    let rafId: number | null = null;
    let lastFrame = 0;
    const frameInterval = 1000 / TARGET_FPS;
    const maxDistSq = CONNECTION_DISTANCE * CONNECTION_DISTANCE;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * DRIFT_SPEED,
        vy: (Math.random() - 0.5) * DRIFT_SPEED,
        size: Math.random() * 1.2 + 0.6,
      }));
    };

    const tick = (ts: number) => {
      rafId = requestAnimationFrame(tick);
      if (ts - lastFrame < frameInterval) return;
      lastFrame = ts;

      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      // Advance positions with toroidal wrap.
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x += w;
        else if (p.x > w) p.x -= w;
        if (p.y < 0) p.y += h;
        else if (p.y > h) p.y -= h;
      }

      // Connections (faint, alpha falls with squared distance).
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < maxDistSq) {
            const alpha = (1 - distSq / maxDistSq) * 0.1;
            ctx.strokeStyle = `rgba(${LINK_COLOR}, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // Nodes.
      ctx.fillStyle = NODE_COLOR;
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const onVisibility = () => {
      if (document.hidden && rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      } else if (!document.hidden && rafId === null) {
        rafId = requestAnimationFrame(tick);
      }
    };

    resize();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);
    rafId = requestAnimationFrame(tick);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [reduced]);

  if (reduced) {
    return (
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse at 20% 0%, rgba(149, 168, 240, 0.06), transparent 55%), radial-gradient(ellipse at 80% 100%, rgba(176, 164, 224, 0.05), transparent 55%)",
        }}
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10"
    />
  );
}
