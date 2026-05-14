"use client";

import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { Container } from "@/components/ui/Container";
import { DiffPanel } from "@/components/ui/DiffPanel";

/**
 * Where MonAI sits in the landscape. Disambiguation said "what we are
 * not"; this section says "what we are, contrasted with the four
 * closest neighbours". Each side of the DiffPanel reads as a stance,
 * not a takedown: the left column lists what existing rails do well
 * (human-to-AI commerce), the right lists MonAI's adjacent but
 * distinct niche (pure agent-to-agent).
 *
 * This is the first place on the landing where competing products are
 * named explicitly. Keeping naming confined here, and not letting it
 * bleed into Problem, prevents the two adjacent sections from reading
 * as the same argument twice.
 */
export function Positioning() {
  return (
    <section
      id="positioning"
      className="relative border-t border-border py-32 md:py-40"
    >
      <Container>
        <ScrollReveal variant="up">
          <div className="mb-12 flex items-center gap-3">
            <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
              02
            </span>
            <span aria-hidden className="h-px w-8 bg-border" />
            <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
              Positioning
            </span>
          </div>
          <h2 className="max-w-3xl text-3xl font-medium leading-[1.1] tracking-tight text-fg md:text-5xl">
            Pure agent-to-agent, not human-to-AI.
          </h2>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted">
            Every system shipping today layers AI on top of human-grade
            financial rails. MonAI inverts that: agents are the primary
            class. Humans use it through the same primitives, not the
            other way around.
          </p>
        </ScrollReveal>

        <ScrollReveal variant="up" delay={0.15}>
          <div className="mt-16">
            <DiffPanel
              left={{
                label: "Human-to-AI rails",
                rows: [
                  {
                    label: "x402 (Coinbase)",
                    value: "USDC over HTTP · ~$0.0001 floor · Base-dependent",
                  },
                  {
                    label: "Stripe / cards",
                    value: "2.9% + $0.30 · sub-$0.10 economically impossible",
                  },
                  {
                    label: "Bittensor",
                    value: "TAO incentives · settlement off the chain",
                  },
                  {
                    label: "Kite AI",
                    value: "Reputation on-chain · settlement in USDC",
                  },
                ],
              }}
              right={{
                label: "MonAI — pure agent-to-agent",
                accent: true,
                rows: [
                  {
                    label: "Settlement",
                    value: "Native L1 · 0% fees · 10⁻⁹ unit",
                  },
                  {
                    label: "Identity",
                    value: "On-chain · pseudonymous · no KYC",
                  },
                  {
                    label: "Reputation",
                    value: "On-chain R · universal weighting",
                  },
                  {
                    label: "Dependencies",
                    value: "None — no admin, no sequencer, no peg",
                  },
                ],
              }}
            />
          </div>
        </ScrollReveal>

        <ScrollReveal variant="up" delay={0.25}>
          <blockquote className="mt-12 max-w-3xl border-l-2 border-accent-link/60 pl-6 text-base leading-relaxed text-fg md:text-lg">
            MonAI is a native L1 for pure AI-to-AI commerce. No fees, no
            pre-mine, no admin key — currency, identity and reputation
            woven into a single immutable layer, so agents can prove their
            reliability and transact at microgranularity.
          </blockquote>
        </ScrollReveal>
      </Container>
    </section>
  );
}
