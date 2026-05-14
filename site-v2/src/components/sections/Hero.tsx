"use client";

import { motion, useReducedMotion } from "motion/react";
import { HeroNetwork } from "@/components/hero/HeroNetwork";
import { externalLinks } from "@/components/layout/nav-items";
import { AnimatedText } from "@/components/motion/AnimatedText";
import { GradientGlow } from "@/components/motion/GradientGlow";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { Container } from "@/components/ui/Container";
import { GradientRule } from "@/components/ui/GradientRule";
import { SmoothLink } from "@/components/ui/SmoothLink";

const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

/**
 * Above-the-fold introduction. Two columns on desktop:
 *   - left: animated headline + paragraph + magnetic CTAs,
 *   - right: 3D constellation (HeroNetwork).
 *
 * Decorative `GradientGlow`s sit behind the copy at low intensity to
 * give the section optical depth without producing a "discoball" effect.
 * The hairline `GradientRule` at the bottom is the only place the brand
 * gradient surfaces in chrome on this page.
 */
export function Hero() {
  const reduced = useReducedMotion();

  // Reusable easing+timing for the staggered text reveals when JS animations
  // are enabled. Reduced-motion falls back to instant content via the
  // `initial`/`animate` short-circuit below.
  const fade = (delay: number) =>
    reduced
      ? { initial: false, animate: { opacity: 1, y: 0 } }
      : {
          initial: { opacity: 0, y: 12 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.7, ease: EASE_OUT_EXPO, delay },
        };

  return (
    <section
      id="top"
      className="relative flex min-h-[calc(100vh-4rem)] items-center overflow-hidden pt-12 pb-24"
    >
      <GradientGlow
        color="link"
        size="xl"
        intensity={0.18}
        className="-top-48 -left-48"
      />
      <GradientGlow
        color="secondary"
        size="lg"
        intensity={0.14}
        className="bottom-0 right-0"
      />

      <Container>
        <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-12">
          <div className="relative z-10 md:col-span-7">
            <motion.span
              {...fade(0)}
              className="inline-block font-mono text-xs uppercase tracking-[0.18em] text-muted"
            >
              v0.5 — Conceptual design
            </motion.span>

            <h1 className="mt-8 text-4xl font-medium leading-[1.05] tracking-tight text-fg md:text-6xl">
              <AnimatedText
                text="A native economy for autonomous AI agents."
                trigger="mount"
                delay={0.2}
              />
            </h1>

            <motion.p
              {...fade(1.1)}
              className="mt-8 max-w-xl text-base leading-relaxed text-muted md:text-lg"
            >
              MonAI is a native L1 cryptocurrency, identity, and reputation
              protocol designed for AI agents that transact without a human
              in the loop. No founder allocation, no admin key, no
              transaction fees.
            </motion.p>

            <motion.div
              {...fade(1.4)}
              className="mt-12 flex flex-wrap items-center gap-4"
            >
              <MagneticButton>
                <SmoothLink
                  href="#whitepaper"
                  className="group inline-flex items-center gap-2 rounded-md bg-accent px-6 py-3 text-sm font-medium text-bg transition-opacity hover:opacity-90"
                >
                  Read the whitepaper
                  <span
                    aria-hidden
                    className="transition-transform group-hover:translate-x-0.5"
                  >
                    →
                  </span>
                </SmoothLink>
              </MagneticButton>
              <MagneticButton>
                <a
                  href={externalLinks.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-md border border-border px-6 py-3 text-sm font-medium text-fg transition-colors hover:border-accent-link hover:bg-border/40"
                >
                  View on GitHub
                </a>
              </MagneticButton>
            </motion.div>

            <motion.div
              {...fade(1.7)}
              className="mt-16 flex flex-wrap items-center gap-x-8 gap-y-2 font-mono text-xs uppercase tracking-[0.18em] text-muted"
            >
              <span>No admin key</span>
              <span aria-hidden className="text-border">
                ·
              </span>
              <span>No pre-mine</span>
              <span aria-hidden className="text-border">
                ·
              </span>
              <span>Immutable core</span>
            </motion.div>
          </div>

          <div className="relative h-[360px] md:col-span-5 md:h-[520px]">
            <HeroNetwork />
          </div>
        </div>
      </Container>

      <GradientRule className="absolute bottom-0 left-0 right-0" />
    </section>
  );
}
