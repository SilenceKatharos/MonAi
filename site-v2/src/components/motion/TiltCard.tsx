"use client";

import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "motion/react";
import { useRef, type MouseEvent, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  /** Maximum tilt amplitude in degrees, applied to both axes. */
  maxTilt?: number;
  /** Reveal a soft accent glow that follows the cursor over the card. */
  glow?: boolean;
};

/**
 * Card wrapper that tilts in 3D toward the cursor and optionally reveals
 * a soft radial glow at the cursor position. Reads as "alive" without
 * being noisy — the spring keeps motion gentle and returns to neutral
 * smoothly when the cursor leaves.
 *
 * Notes:
 *   - `transformPerspective: 1000` puts the vanishing point far enough
 *     that even max tilt stays plausible-looking.
 *   - Glow uses a CSS variable updated from JS — cheap, GPU-friendly.
 *   - Reduced-motion users get a plain wrapper, no tilt, no glow.
 */
export function TiltCard({
  children,
  className,
  maxTilt = 6,
  glow = true,
}: Props) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const glowX = useMotionValue(50);
  const glowY = useMotionValue(50);

  const sX = useSpring(rotateX, { stiffness: 220, damping: 22, mass: 0.5 });
  const sY = useSpring(rotateY, { stiffness: 220, damping: 22, mass: 0.5 });

  const background = useMotionTemplate`radial-gradient(circle at ${glowX}% ${glowY}%, var(--color-accent-link) 0%, transparent 50%)`;

  const handleMove = (e: MouseEvent<HTMLDivElement>) => {
    if (reduced || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    rotateY.set(px * maxTilt * 2);
    rotateX.set(-py * maxTilt * 2);
    glowX.set(((e.clientX - rect.left) / rect.width) * 100);
    glowY.set(((e.clientY - rect.top) / rect.height) * 100);
  };

  const handleLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      className={`group relative ${className ?? ""}`}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{
        rotateX: sX,
        rotateY: sY,
        transformPerspective: 1000,
        transformStyle: "preserve-3d",
      }}
    >
      {glow && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-30"
          style={{ background }}
        />
      )}
      {children}
    </motion.div>
  );
}
