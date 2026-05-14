"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import type { ReactNode } from "react";

type Variant = "up" | "mask" | "scale" | "stagger";

const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

const variants: Record<Variant, Variants> = {
  up: {
    hidden: { y: 32, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.7, ease: EASE_OUT_EXPO },
    },
  },
  mask: {
    hidden: { clipPath: "inset(0 0 100% 0)", opacity: 0 },
    visible: {
      clipPath: "inset(0 0 0% 0)",
      opacity: 1,
      transition: { duration: 0.9, ease: EASE_OUT_EXPO },
    },
  },
  scale: {
    hidden: { scale: 0.94, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { duration: 0.7, ease: EASE_OUT_EXPO },
    },
  },
  stagger: {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.08, delayChildren: 0.1 },
    },
  },
};

type Props = {
  children: ReactNode;
  variant?: Variant;
  /** Extra delay in seconds before the reveal kicks in. */
  delay?: number;
  className?: string;
};

/**
 * Reveals its children when scrolled into view. Animates once, then stays
 * settled. For reduced-motion users it renders a plain `<div>` with the
 * same className so styling is unchanged.
 *
 * Variants:
 *   - `up`:      slide-up + fade (default, most reusable)
 *   - `mask`:    clip-path reveal from bottom to top (good for titles)
 *   - `scale`:   subtle scale-in (good for cards / formula boxes)
 *   - `stagger`: container; direct motion-children animate one after the other
 */
export function ScrollReveal({
  children,
  variant = "up",
  delay = 0,
  className,
}: Props) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  const baseVariants = variants[variant];
  const withDelay: Variants = baseVariants.visible
    ? {
        ...baseVariants,
        visible: {
          ...baseVariants.visible,
          transition: {
            ...(typeof baseVariants.visible === "object" &&
            "transition" in baseVariants.visible
              ? (baseVariants.visible.transition as object)
              : {}),
            delay,
          },
        },
      }
    : baseVariants;

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-15%" }}
      variants={withDelay}
      className={className}
    >
      {children}
    </motion.div>
  );
}
