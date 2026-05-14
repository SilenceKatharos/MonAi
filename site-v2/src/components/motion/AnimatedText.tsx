"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import { Fragment } from "react";

const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

const container: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.05, delayChildren: 0 },
  },
};

const word: Variants = {
  hidden: { y: "100%" },
  visible: {
    y: 0,
    transition: { duration: 0.7, ease: EASE_OUT_EXPO },
  },
};

type Props = {
  text: string;
  className?: string;
  /** Trigger on mount (hero) vs on scroll into view (sections). */
  trigger?: "mount" | "view";
  /** Extra seconds before the stagger begins. */
  delay?: number;
};

/**
 * Title-grade text reveal. Each word lives inside its own clipping
 * mask and rises from below into place; the masks themselves keep
 * descenders from leaking out during the animation.
 *
 * Spaces between words are real text nodes (not flex gaps) so line
 * breaks happen naturally exactly where they would in plain HTML.
 */
export function AnimatedText({
  text,
  className,
  trigger = "view",
  delay = 0,
}: Props) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <span className={className}>{text}</span>;
  }

  const words = text.split(" ");
  const triggerProps =
    trigger === "mount"
      ? { initial: "hidden", animate: "visible" as const }
      : {
          initial: "hidden",
          whileInView: "visible" as const,
          viewport: { once: true, margin: "-15%" },
        };

  return (
    <motion.span
      className={className}
      variants={{
        ...container,
        visible: {
          ...container.visible,
          transition: {
            staggerChildren: 0.05,
            delayChildren: delay,
          },
        },
      }}
      {...triggerProps}
      style={{ display: "inline-block" }}
    >
      {words.map((w, i) => (
        <Fragment key={`${w}-${i}`}>
          <span
            style={{
              display: "inline-block",
              overflow: "hidden",
              verticalAlign: "bottom",
              lineHeight: "1.05em",
            }}
          >
            <motion.span
              variants={word}
              style={{ display: "inline-block", willChange: "transform" }}
            >
              {w}
            </motion.span>
          </span>
          {i < words.length - 1 && " "}
        </Fragment>
      ))}
    </motion.span>
  );
}
