"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "motion/react";
import { useEffect, useState } from "react";

/**
 * Additive desktop cursor: a small accent dot tracking the pointer 1:1
 * plus a larger ring lagging behind via a spring. We do NOT hide the
 * native cursor — this is a complement, not a replacement, so accessibility
 * affordances (text caret over inputs, etc.) remain intact.
 *
 * The component renders nothing on:
 *   - reduced-motion devices,
 *   - touch / coarse-pointer devices (no hover capability).
 *
 * It also hides itself briefly on first mount until the first mousemove
 * so a fresh page load doesn't show the cursor stuck at the top-left.
 */
export function CustomCursor() {
  const reduced = useReducedMotion();
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const ringX = useSpring(x, { stiffness: 200, damping: 22, mass: 0.4 });
  const ringY = useSpring(y, { stiffness: 200, damping: 22, mass: 0.4 });

  useEffect(() => {
    if (reduced) return;
    if (window.matchMedia("(hover: none)").matches) return;
    setEnabled(true);

    const onMove = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      if (!visible) setVisible(true);
    };
    const onLeave = () => setVisible(false);
    const onEnter = () => setVisible(true);

    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);
    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
    };
  }, [reduced, x, y, visible]);

  if (!enabled) return null;

  return (
    <>
      <motion.div
        aria-hidden
        className="pointer-events-none fixed top-0 left-0 z-[100] hidden md:block"
        style={{ x, y, translateX: "-50%", translateY: "-50%" }}
        animate={{ opacity: visible ? 1 : 0 }}
        transition={{ duration: 0.15 }}
      >
        <div className="h-1.5 w-1.5 rounded-full bg-accent" />
      </motion.div>
      <motion.div
        aria-hidden
        className="pointer-events-none fixed top-0 left-0 z-[99] hidden md:block mix-blend-screen"
        style={{
          x: ringX,
          y: ringY,
          translateX: "-50%",
          translateY: "-50%",
        }}
        animate={{ opacity: visible ? 1 : 0 }}
        transition={{ duration: 0.15 }}
      >
        <div className="h-8 w-8 rounded-full border border-accent-link/40" />
      </motion.div>
    </>
  );
}
