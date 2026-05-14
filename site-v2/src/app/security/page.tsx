import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { GradientGlow } from "@/components/motion/GradientGlow";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { AttackCard } from "@/components/security/AttackCard";
import { Container } from "@/components/ui/Container";
import { GradientRule } from "@/components/ui/GradientRule";
import { ATTACKS } from "@/data/attacks";

export const metadata: Metadata = {
  title: "Security — MonAI",
  description:
    "Threat model and stacked defenses across ten catalogued attacks against the MonAI protocol.",
};

/**
 * Security sub-page. The full threat model from
 * `securite/05-modele-de-menace-et-defenses.md` rendered as a grid of
 * expandable attack cards plus a closing "defensive posture" recap.
 *
 * Routing: this is `/security` under the App Router. It inherits the
 * root `layout.tsx` (Header, ParticleField, ScrollProgress, Footer,
 * CustomCursor) — there is no per-route layout because the chrome is
 * the same as the landing.
 */
export default function SecurityPage() {
  return (
    <>
      <section className="relative overflow-hidden pt-32 pb-12">
        <GradientGlow
          color="link"
          size="xl"
          intensity={0.12}
          className="-top-32 -right-32"
        />
        <Container>
          <ScrollReveal variant="up">
            <Link
              href="/"
              className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-muted transition-colors hover:text-fg"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to home
            </Link>
            <div className="mt-12 flex items-center gap-3">
              <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
                Sub-page
              </span>
              <span aria-hidden className="h-px w-8 bg-border" />
              <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
                Security
              </span>
            </div>
            <h1 className="mt-8 max-w-4xl text-4xl font-medium leading-[1.05] tracking-tight text-fg md:text-6xl">
              Ten attacks, ten stacked defenses.
            </h1>
            <p className="mt-8 max-w-2xl text-base leading-relaxed text-muted md:text-lg">
              MonAI does not aim for absolute security — only{" "}
              <em className="not-italic text-fg">
                economically rational security
              </em>
              : making any attack more costly than its expected reward, in
              the vast majority of cases. Below: every attack we anticipated,
              every defense layer we designed against it, and the residual
              risks we openly declare.
            </p>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">
              Cards outlined in accent are attacks already exercised against
              the multi-agent simulator. The rest are paper analysis — the
              spec freeze is the next phase gate.
            </p>
          </ScrollReveal>
        </Container>
        <GradientRule className="absolute bottom-0 left-0 right-0" />
      </section>

      <section className="py-16 md:py-24">
        <Container>
          <div className="grid items-start gap-4 md:grid-cols-2 lg:grid-cols-3">
            {ATTACKS.map((attack, i) => (
              <ScrollReveal key={attack.index} variant="up" delay={i * 0.04}>
                <AttackCard attack={attack} />
              </ScrollReveal>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-t border-border py-24 md:py-32">
        <Container>
          <ScrollReveal variant="up">
            <div className="mb-8 flex items-center gap-3">
              <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
                Defensive posture
              </span>
            </div>
            <h2 className="max-w-3xl text-2xl font-medium leading-[1.1] tracking-tight text-fg md:text-4xl">
              Stack the layers. Make cheating more expensive than working.
            </h2>
            <ul className="mt-10 grid gap-4 md:grid-cols-2">
              <li className="rounded-md border border-border bg-bg/30 p-5">
                <div className="font-mono text-xs uppercase tracking-[0.18em] text-accent-link">
                  Stacked layers
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  No single defense holds. Rate-limiting, sponsorship cost,
                  validator diversity, probabilistic selection — bypassing
                  one hits the next.
                </p>
              </li>
              <li className="rounded-md border border-border bg-bg/30 p-5">
                <div className="font-mono text-xs uppercase tracking-[0.18em] text-accent-link">
                  Economic asymmetry
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  Honest work must be cheaper than cheating. Rational
                  actors choose honesty by calculation, not virtue.
                </p>
              </li>
              <li className="rounded-md border border-border bg-bg/30 p-5">
                <div className="font-mono text-xs uppercase tracking-[0.18em] text-accent-link">
                  Anti-fragile scale
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  Some defenses (honeypot pool dilution, validator diversity)
                  strengthen as the network grows. We bet on size, not on
                  early secrecy.
                </p>
              </li>
              <li className="rounded-md border border-border bg-bg/30 p-5">
                <div className="font-mono text-xs uppercase tracking-[0.18em] text-accent-link">
                  Total transparency
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  No security by obscurity. Every mechanism is in the
                  public spec and the open-source reference code.
                </p>
              </li>
            </ul>
          </ScrollReveal>
        </Container>
      </section>
    </>
  );
}
