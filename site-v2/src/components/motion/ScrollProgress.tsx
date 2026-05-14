"use client";

import { motion, useReducedMotion, useScroll, useSpring } from "motion/react";

/**
 * 1-pixel horizontal progress bar tucked just under the sticky header.
 * Scale-x-origins from the left, smoothed by a spring so the bar
 * doesn't jitter on small scroll deltas. It's deliberately neutral most
 * of the time and only colours up once the user starts engaging with
 * the page — a low-key wayfinding cue rather than decoration.
 */
export function ScrollProgress() {
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    mass: 0.1,
  });

  if (reduced) return null;

  return (
    <motion.div
      aria-hidden
      className="fixed top-16 left-0 right-0 h-px origin-left z-40"
      style={{
        scaleX,
        background:
          "linear-gradient(90deg, var(--color-accent-link), var(--color-accent-secondary))",
        opacity: 0.6,
      }}
    />
  );
}
