"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  /** Fraction of the cursor displacement the element follows. 0.3 = subtle. */
  strength?: number;
  /** Px radius around the centre within which the magnet activates. */
  radius?: number;
};

/**
 * Wraps any element in a small `motion.div` that magnetically follows the
 * cursor when it comes within `radius` pixels of the element's centre.
 * Movement is smoothed by a critically-damped spring so the element never
 * snaps or oscillates.
 *
 * Implementation notes:
 *   - The wrapper is `inline-block` so it doesn't expand to fill its
 *     parent; sizing is driven by the child.
 *   - Listeners attach to `window` rather than the element itself, so the
 *     element starts reacting before the cursor enters its hitbox — that
 *     "anticipation" is what makes the effect feel premium rather than
 *     gimmicky.
 *   - Reduced-motion users get a plain wrapper with zero listeners.
 */
export function MagneticButton({
  children,
  className,
  strength = 0.3,
  radius = 120,
}: Props) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 200, damping: 18, mass: 0.15 });
  const springY = useSpring(y, { stiffness: 200, damping: 18, mass: 0.15 });

  useEffect(() => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      if (Math.hypot(dx, dy) < radius) {
        x.set(dx * strength);
        y.set(dy * strength);
      } else {
        x.set(0);
        y.set(0);
      }
    };

    const onLeave = () => {
      x.set(0);
      y.set(0);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, [reduced, x, y, strength, radius]);

  if (reduced) {
    return <div className={`inline-block ${className ?? ""}`}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      className={`inline-block ${className ?? ""}`}
      style={{ x: springX, y: springY }}
    >
      {children}
    </motion.div>
  );
}
