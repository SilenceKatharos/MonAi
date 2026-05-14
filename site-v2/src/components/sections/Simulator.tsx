"use client";

import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { Container } from "@/components/ui/Container";
import { FigureLightbox } from "@/components/ui/FigureLightbox";
import { MetricChip } from "@/components/ui/MetricChip";

type Milestone = {
  round: string;
  headline: string;
  detail: string;
  /** Mark the round that produced the current spec defaults. */
  current?: boolean;
};

const MILESTONES: readonly Milestone[] = [
  {
    round: "v1",
    headline: "Five profiles tested.",
    detail:
      "Honest > sybil hierarchy emerges, but cherry-pickers earn close to honest agents.",
  },
  {
    round: "v2",
    headline: "R_acc as a component.",
    detail:
      "Diluted into the score sum — cherry-pickers still earn ~80% of honest reward.",
  },
  {
    round: "v3",
    headline: "R_acc as a multiplier.",
    detail:
      "Candidate B retained as defaults (f₀_max=0.85, k_sigmoid=40, γ=3.0).",
    current: true,
  },
  {
    round: "v4",
    headline: "Mempool + demand bonus.",
    detail:
      "P(t, task) grows on refusals. H/C climbs to 3.19 but plateaus below target.",
  },
];

type Figure = {
  src: string;
  alt: string;
  caption: string;
};

const FIGURES: readonly Figure[] = [
  {
    src: "/figures/f_hat_par_profil.png",
    alt: "Reliability f̂ trajectories over 2000 ticks across five agent profiles",
    caption: "Reliability f̂ over time · 5 profiles · 2000 ticks",
  },
  {
    src: "/figures/gains_par_profil.png",
    alt: "Cumulative gains per agent profile",
    caption: "Cumulative reward · 5 profiles",
  },
  {
    src: "/figures/R_par_profil.png",
    alt: "Aggregate reputation R over time per agent profile",
    caption: "Aggregate reputation R · 5 profiles",
  },
];

/**
 * The "honest verdict" section. The current Roadmap mentions
 * "H/C ≈ 3.19" in passing; this section unpacks the four calibration
 * rounds that led there, shows the three trajectories from the
 * legacy simulator output, and openly declares which targets passed
 * (✓) and which did not (✗).
 *
 * The matplotlib figures are light-on-light by default; we wrap them
 * in a bordered frame and apply `invert(1) hue-rotate(180deg)` so they
 * sit on the dark palette without being regenerated. This preserves
 * the line colours mostly correctly (blue stays blue, red stays red)
 * while inverting the white canvas to a near-black plot area.
 */
export function Simulator() {
  return (
    <section
      id="simulator"
      className="relative border-t border-border py-32 md:py-40"
    >
      <Container>
        <ScrollReveal variant="up">
          <div className="mb-12 flex items-center gap-3">
            <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
              04
            </span>
            <span aria-hidden className="h-px w-8 bg-border" />
            <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
              Simulator
            </span>
          </div>
          <h2 className="max-w-3xl text-3xl font-medium leading-[1.1] tracking-tight text-fg md:text-5xl">
            Four calibration rounds, one honest verdict.
          </h2>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted">
            Every parameter on the public spec has been beaten against a
            Python multi-agent simulator. The current defaults (Candidate B,
            v3) are what survived four rounds of adversarial calibration.
            The v4 round told us we're not done.
          </p>
        </ScrollReveal>

        <ScrollReveal variant="up" delay={0.1}>
          <ol className="mt-16 grid gap-4 md:grid-cols-4">
            {MILESTONES.map((m) => (
              <li
                key={m.round}
                className={`rounded-lg border p-6 ${
                  m.current
                    ? "border-accent/50 bg-accent/[0.04]"
                    : "border-border bg-bg/30"
                }`}
              >
                <div
                  className={`font-mono text-xs uppercase tracking-[0.18em] ${
                    m.current ? "text-accent" : "text-accent-link"
                  }`}
                >
                  {m.round}
                  {m.current && (
                    <span className="ml-2 normal-case text-[10px] text-muted">
                      · current defaults
                    </span>
                  )}
                </div>
                <h3 className="mt-4 text-sm font-medium text-fg">
                  {m.headline}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-muted">
                  {m.detail}
                </p>
              </li>
            ))}
          </ol>
        </ScrollReveal>

        <ScrollReveal variant="up" delay={0.2}>
          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {FIGURES.map((f) => (
              <FigureLightbox
                key={f.src}
                src={f.src}
                alt={f.alt}
                caption={f.caption}
                width={800}
                height={500}
                invert
              />
            ))}
          </div>
          <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            Click any figure to enlarge · Esc or click outside to close
          </p>
        </ScrollReveal>

        <ScrollReveal variant="up" delay={0.3}>
          <div className="mt-16">
            <div className="mb-6 font-mono text-xs uppercase tracking-[0.18em] text-muted">
              v4 — Target verdicts
            </div>
            <div className="flex flex-wrap gap-4">
              <MetricChip
                label="Honest / Mediocre"
                value="3.13"
                status="ok"
              />
              <MetricChip
                label="Honest / Cherry-picker"
                value="3.19"
                status="fail"
              />
              <MetricChip
                label="Mediocre / Cherry-picker"
                value="1.01"
                status="ok"
              />
              <MetricChip label="Honest / Sybil" value="1108" status="ok" />
            </div>
            <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted">
              The H/C ratio plateaus at 3.19, below the target of 5. The
              demand bonus narrows the gap but does not close it on its own;
              an additional anti-cherry-picking lever is under exploration
              for v5.
            </p>
          </div>
        </ScrollReveal>
      </Container>
    </section>
  );
}
