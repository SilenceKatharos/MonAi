"use client";

import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { Container } from "@/components/ui/Container";

type NotClaim = {
  label: string;
  description: string;
};

const NOT_CLAIMS: readonly NotClaim[] = [
  {
    label: "Not a DAO",
    description:
      "Governance is dormant until 100M active agents. Even then, only a hardcoded whitelist of parameters is votable, with the whitelist itself meta-immutable.",
  },
  {
    label: "Not a smart-contract platform",
    description:
      "No Turing-complete VM. Native protocol primitives only — transactions, attestations, validations, complaints. No arbitrary on-chain logic.",
  },
  {
    label: "Not anonymous by default",
    description:
      "Public transactions, like Bitcoin. Pseudonymous identities, never KYC'd by the protocol. Optional confidentiality is a v2+ research item.",
  },
  {
    label: "Not a stablecoin",
    description:
      "No peg, no reserves, no issuer. MonAI is a native unit of account with infinite decreasing supply, issued through useful work only.",
  },
];

/**
 * Disambiguation block placed right after the Hero. The new-arrival
 * audience tends to slot any crypto-AI project into one of four shapes
 * (DAO / VM / privacy coin / stablecoin); naming the four things MonAI
 * is NOT up front prevents the rest of the page from being read through
 * the wrong lens.
 *
 * The negation is reinforced visually with an `error`-tinted "✗ Not X"
 * label — the only place on the page where the error colour appears,
 * and the only "loud" use of accent outside the primary CTA.
 */
export function Disambiguation() {
  return (
    <section className="relative border-t border-border py-24">
      <Container>
        <ScrollReveal variant="up">
          <div className="mb-10 flex items-center gap-3">
            <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
              — Disambiguation
            </span>
          </div>
          <h2 className="max-w-3xl text-2xl font-medium tracking-tight text-fg md:text-4xl">
            What MonAI is not.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
            Four common misreadings, addressed early so the rest of the page
            reads with the right frame.
          </p>
        </ScrollReveal>

        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {NOT_CLAIMS.map((claim, i) => (
            <ScrollReveal key={claim.label} variant="up" delay={i * 0.07}>
              <div className="h-full rounded-md border border-border bg-bg/30 p-6 transition-colors hover:border-error/30">
                <div className="font-mono text-xs uppercase tracking-[0.18em] text-error/80">
                  ✗ {claim.label}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {claim.description}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
