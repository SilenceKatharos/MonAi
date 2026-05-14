"use client";

import { GradientGlow } from "@/components/motion/GradientGlow";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { TiltCard } from "@/components/motion/TiltCard";
import { Container } from "@/components/ui/Container";

type Layer = {
  index: string;
  title: string;
  description: string;
  signature: string; // Mono-font technical signature shown at card bottom.
};

const LAYERS: readonly Layer[] = [
  {
    index: "L0",
    title: "Settlement",
    description:
      "Hybrid PoUW + DAG-BFT consensus. Validators earn fresh issuance for useful work, not for burning electricity. Sub-second finality.",
    signature: "DAG-BFT · PoUW",
  },
  {
    index: "L1",
    title: "Identity",
    description:
      "Each agent holds a cryptographic identity card with a Merkle-anchored set of attestations. Pseudonymous by default, never KYC'd by the protocol.",
    signature: "Ed25519 · Merkle",
  },
  {
    index: "L2",
    title: "Reputation",
    description:
      "A seven-component score R is computed on-chain from on-chain evidence only. Every vote, validation and complaint is weighted by R.",
    signature: "R = (R_C, R_V, R_F, R_A, R_Δ, R_S, R_acc)",
  },
];

/**
 * "Three layers, designed together" — the structural pitch for MonAI as
 * a co-designed stack (settlement / identity / reputation) rather than
 * a generic L1 with bolted-on extras. Each layer ships as a tilt card
 * with a subtle accent glow on hover, all wrapped in scroll-reveal.
 */
export function Protocol() {
  return (
    <section
      id="protocol"
      className="relative border-t border-border py-32 md:py-40"
    >
      <GradientGlow
        color="link"
        size="lg"
        intensity={0.08}
        className="-top-32 right-0"
      />

      <Container>
        <ScrollReveal variant="up">
          <div className="mb-12 flex items-center gap-3">
            <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
              01
            </span>
            <span aria-hidden className="h-px w-8 bg-border" />
            <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
              Protocol
            </span>
          </div>
          <h2 className="max-w-3xl text-3xl font-medium leading-[1.1] tracking-tight text-fg md:text-5xl">
            Three layers, designed together.
          </h2>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted">
            MonAI bundles settlement, identity and reputation into a single
            base layer. Each is co-designed with the others — none can be
            bolted on as an afterthought without breaking the rest.
          </p>
        </ScrollReveal>

        <div className="mt-20 grid gap-6 md:grid-cols-3">
          {LAYERS.map((layer, i) => (
            <ScrollReveal key={layer.index} variant="up" delay={i * 0.1}>
              <TiltCard className="group h-full rounded-lg border border-border bg-bg/40 p-8 backdrop-blur-sm transition-colors hover:border-accent-link/50">
                <div className="font-mono text-xs uppercase tracking-[0.18em] text-accent-link">
                  Layer {layer.index}
                </div>
                <h3 className="mt-6 text-xl font-medium tracking-tight text-fg">
                  {layer.title}
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-muted">
                  {layer.description}
                </p>
                <div className="mt-10 border-t border-border/60 pt-4 font-mono text-[11px] tracking-wide text-muted">
                  {layer.signature}
                </div>
              </TiltCard>
            </ScrollReveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
