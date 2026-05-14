"use client";

import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { TiltCard } from "@/components/motion/TiltCard";
import { Container } from "@/components/ui/Container";

type Principle = {
  index: string;
  title: string;
  description: string;
};

const PRINCIPLES: readonly Principle[] = [
  {
    index: "01",
    title: "No founder allocation",
    description:
      "Zero pre-mine. No tokens reserved for a team, foundation, treasury or any insider. Issuance starts at the genesis block, unweighted.",
  },
  {
    index: "02",
    title: "No admin key",
    description:
      "No pause function. No upgradable proxy on the core. No privileged emitter. No multisig with shutdown power. Ever.",
  },
  {
    index: "03",
    title: "Immutable core",
    description:
      "Consensus, issuance, contracts and reputation calculation can only change through voluntary hard fork — never through a vote.",
  },
  {
    index: "04",
    title: "Zero protocol fees",
    description:
      "Validators are paid in fresh issuance, scaled by usefulness M(f, d). The protocol does not tax transactions to reward anyone.",
  },
  {
    index: "05",
    title: "Universal R weighting",
    description:
      "Every action — vote, validation, complaint, attestation — is weighted by an agent's reputation R. No equal-weight surface ever.",
  },
  {
    index: "06",
    title: "Permissive open-source",
    description:
      "Reference implementation under an MIT-compatible licence. Fork it, audit it, run your own client, never ask permission.",
  },
];

/**
 * The non-negotiables. Six principles, two rows on desktop. Each lives
 * in a tilt card with a numeric label so the section reads like a
 * manifesto rather than a feature dump. Reveal-on-scroll with a small
 * stagger keeps the whole grid from arriving at once.
 */
export function Principles() {
  return (
    <section
      id="principles"
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
              Principles
            </span>
          </div>
          <h2 className="max-w-3xl text-3xl font-medium leading-[1.1] tracking-tight text-fg md:text-5xl">
            Six non-negotiables, engraved at mainnet.
          </h2>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted">
            These are not roadmap items, target states or aspirations. They
            are the conditions under which the protocol is launched. Any
            future proposal that breaks one of them must be explicitly
            rejected before being implemented.
          </p>
        </ScrollReveal>

        <div className="mt-20 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {PRINCIPLES.map((p, i) => (
            <ScrollReveal key={p.index} variant="up" delay={i * 0.06}>
              <TiltCard
                maxTilt={4}
                className="group h-full rounded-lg border border-border bg-bg/40 p-6 backdrop-blur-sm transition-colors hover:border-accent-link/40"
              >
                <div className="font-mono text-xs tracking-[0.18em] text-accent-link">
                  {p.index}
                </div>
                <h3 className="mt-4 text-base font-medium tracking-tight text-fg">
                  {p.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {p.description}
                </p>
              </TiltCard>
            </ScrollReveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
