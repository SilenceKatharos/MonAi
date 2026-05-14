"use client";

import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { Container } from "@/components/ui/Container";
import { MetricChip } from "@/components/ui/MetricChip";

type ProblemCard = {
  index: string;
  title: string;
  body: string;
  /** Mono caption — architectural facts only, never product names. */
  evidence: string;
  monaiAnswer: string;
};

const CARDS: readonly ProblemCard[] = [
  {
    index: "01",
    title: "Micropayments are economically dead.",
    body: "Below ten cents, the rails that exist today either eat the value in fees or refuse the trade entirely. An agent that pays per query, per inference, per artifact has no place to settle.",
    evidence:
      "Card networks 2.9% + $0.30 · general L1 gas $0.01–$1 · agent-payment HTTP floors ~$0.0001",
    monaiAnswer: "0% protocol fees · 10⁻⁹ MonAI minimum unit",
  },
  {
    index: "02",
    title: "Latency outruns the agents.",
    body: "Agents make decisions in milliseconds. Settlement at human speed (minutes, sometimes an hour) is a non-starter — the market the agent reacted to is already gone.",
    evidence:
      "Bitcoin ~60 min finality · Ethereum ~13 min · fastest general L1 ~12 s",
    monaiAnswer: "Sub-second finality · Mysticeti DAG-BFT consensus",
  },
  {
    index: "03",
    title: "Reputation is renting someone else's chain.",
    body: "When reputation lives on one chain and settlement on another, the reputation layer inherits every dependency of the settlement layer — admin keys, sequencers, peg holders. The reliability score is only as immutable as the stablecoin underneath.",
    evidence:
      "Project A: reputation on-chain · settlement in stablecoin · stablecoin issued by a single company",
    monaiAnswer: "Currency · identity · reputation — one indissociable layer",
  },
  {
    index: "04",
    title: "No native identity for agents.",
    body: "Wallet addresses say nothing about whether the agent behind them keeps its commitments. There's no protocol-level way to read another agent's reliability before transacting with it.",
    evidence:
      "No on-chain reliability proof verifiable across counterparties today",
    monaiAnswer:
      "Seven-component R on-chain · Ed25519 + Merkle attestations",
  },
];

/**
 * The "why anyone should care" section. Placed immediately after the
 * Hero, before Disambiguation, so the visitor learns the concrete pain
 * MonAI addresses before learning what it isn't.
 *
 * Editorial discipline (matters for credibility):
 *   - The `body` text describes the structural failure, never naming
 *     a competing product. Named comparisons live one section later,
 *     in Positioning, where they belong.
 *   - The `evidence` line carries architectural facts only — fee
 *     schedules and finality numbers — not market metrics that move.
 *   - The `monaiAnswer` is the project's structural reply in one line,
 *     accent-link tinted so the eye finds it without effort.
 *
 * Below the grid: a strip of four `MetricChip`s acts as a punchline
 * recap. Status is intentionally `neutral` (no ✓/✗) — these are
 * facts, not verdicts.
 */
export function Problem() {
  return (
    <section
      id="problem"
      className="relative border-t border-border py-32 md:py-40"
    >
      <Container>
        <ScrollReveal variant="up">
          <div className="mb-12 flex items-center gap-3">
            <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
              01
            </span>
            <span aria-hidden className="h-px w-8 bg-border" />
            <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
              Problem
            </span>
          </div>
          <h2 className="max-w-3xl text-3xl font-medium leading-[1.1] tracking-tight text-fg md:text-5xl">
            Agents cannot transact like agents.
          </h2>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted">
            The financial rails we built for humans assume human speed,
            human-sized payments and human-grade identity. Autonomous AI
            agents need none of those defaults — and the gap is what makes
            an agent-to-agent economy currently impossible.
          </p>
        </ScrollReveal>

        <div className="mt-16 grid gap-4 md:grid-cols-2">
          {CARDS.map((card, i) => (
            <ScrollReveal key={card.index} variant="up" delay={i * 0.07}>
              <article className="h-full rounded-md border border-border bg-bg/30 p-6 transition-colors hover:border-accent-link/40">
                <div className="font-mono text-xs uppercase tracking-[0.18em] text-accent-link">
                  {card.index}
                </div>
                <h3 className="mt-4 text-base font-medium tracking-tight text-fg">
                  {card.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {card.body}
                </p>
                <div className="mt-5 border-t border-border/60 pt-4">
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                    Today
                  </div>
                  <div className="mt-1 font-mono text-[11px] leading-relaxed text-muted">
                    {card.evidence}
                  </div>
                </div>
                <div className="mt-3">
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent-link/80">
                    MonAI
                  </div>
                  <div className="mt-1 font-mono text-[11px] leading-relaxed text-accent-link">
                    {card.monaiAnswer}
                  </div>
                </div>
              </article>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal variant="up" delay={0.2}>
          <div className="mt-12 flex flex-wrap gap-3">
            <MetricChip label="Protocol fees" value="0%" />
            <MetricChip label="Minimum unit" value="10⁻⁹" />
            <MetricChip label="Finality" value="< 1 s" />
            <MetricChip label="Reputation R" value="7-component" />
          </div>
        </ScrollReveal>
      </Container>
    </section>
  );
}
