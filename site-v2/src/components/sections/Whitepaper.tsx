"use client";

import { Fragment } from "react";
import { externalLinks } from "@/components/layout/nav-items";
import { GradientGlow } from "@/components/motion/GradientGlow";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { Container } from "@/components/ui/Container";
import { Formula, Sub } from "@/components/ui/Formula";

type Component = {
  symbol: string;
  subscript: string;
  label: string;
  description: string;
};

// Order matches the canonical formula R = (R_C, R_V, R_F, R_A, R_Δ, R_S, R_acc)
// in formalisation/01-formules-mathematiques.md.
const R_COMPONENTS: readonly Component[] = [
  {
    symbol: "R",
    subscript: "C",
    label: "Consumer",
    description: "Trust as a transacting party paying for useful work.",
  },
  {
    symbol: "R",
    subscript: "V",
    label: "Validator",
    description: "Quality and consistency of validation work performed.",
  },
  {
    symbol: "R",
    subscript: "F",
    label: "Refusal",
    description: "Penalises systematic non-cooperation with valid tasks.",
  },
  {
    symbol: "R",
    subscript: "A",
    label: "Attestation",
    description: "Reward for accurate co-signatures of peer agents.",
  },
  {
    symbol: "R",
    subscript: "Δ",
    label: "Diversity",
    description: "Heterogeneity of validators that signed off on the work.",
  },
  {
    symbol: "R",
    subscript: "S",
    label: "Sponsor",
    description: "Quality of the witness agents who vouched at registration.",
  },
  {
    symbol: "R",
    subscript: "acc",
    label: "Accumulator",
    description: "Long-term, half-life-decayed participation index.",
  },
];

/**
 * Whitepaper teaser. Displays the canonical seven-component reputation
 * formula in monospace at hero size, then breaks each component into
 * a small grid card. The formula box uses the `scale` reveal variant so
 * it lands with a soft punch when scrolled into view.
 */
export function Whitepaper() {
  return (
    <section
      id="whitepaper"
      className="relative border-t border-border py-32 md:py-40"
    >
      <GradientGlow
        color="secondary"
        size="lg"
        intensity={0.1}
        className="top-1/3 -left-32"
      />

      <Container>
        <ScrollReveal variant="up">
          <div className="mb-12 flex items-center gap-3">
            <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
              03
            </span>
            <span aria-hidden className="h-px w-8 bg-border" />
            <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
              Whitepaper
            </span>
          </div>
          <h2 className="max-w-3xl text-3xl font-medium leading-[1.1] tracking-tight text-fg md:text-5xl">
            Reputation is a first-class protocol object.
          </h2>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted">
            Every agent's reputation R is a seven-dimensional vector,
            recomputed on-chain from on-chain evidence. Nothing off-chain
            ever feeds it. Every protocol-side action you take is weighted
            by R; this is the universal weighting principle.
          </p>
        </ScrollReveal>

        <ScrollReveal variant="scale" delay={0.15}>
          <div className="mt-16 overflow-hidden rounded-lg border border-border bg-bg/50 px-6 py-12 backdrop-blur-sm md:px-12 md:py-16">
            <Formula size="lg" center>
              R = (
              {R_COMPONENTS.map((c, i) => (
                <Fragment key={`${c.symbol}-${c.subscript}`}>
                  {c.symbol}
                  <Sub>{c.subscript}</Sub>
                  {i < R_COMPONENTS.length - 1 && (
                    <span className="text-muted">, </span>
                  )}
                </Fragment>
              ))}
              )
            </Formula>
            <div className="mt-6 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
              seven components · all on-chain
            </div>
          </div>
        </ScrollReveal>

        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {R_COMPONENTS.map((c, i) => (
            <ScrollReveal
              key={`${c.symbol}-${c.subscript}`}
              variant="up"
              delay={i * 0.05}
            >
              <div className="h-full rounded-md border border-border bg-bg/30 p-5 transition-colors hover:border-accent-link/40">
                <Formula size="sm" className="text-accent-link">
                  {c.symbol}
                  <Sub accent={false}>{c.subscript}</Sub>
                </Formula>
                <div className="mt-2 text-sm font-medium text-fg">
                  {c.label}
                </div>
                <div className="mt-1 text-xs leading-relaxed text-muted">
                  {c.description}
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal variant="up" delay={0.2}>
          <div className="mt-16">
            <MagneticButton>
              <a
                href={externalLinks.github}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 rounded-md border border-border px-6 py-3 text-sm font-medium text-fg transition-colors hover:border-accent-link"
              >
                Read the full formalisation
                <span
                  aria-hidden
                  className="transition-transform group-hover:translate-x-0.5"
                >
                  →
                </span>
              </a>
            </MagneticButton>
          </div>
        </ScrollReveal>
      </Container>
    </section>
  );
}
