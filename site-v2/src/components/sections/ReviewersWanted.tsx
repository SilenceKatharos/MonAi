"use client";

import { externalLinks } from "@/components/layout/nav-items";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { Container } from "@/components/ui/Container";
import { GithubIcon } from "@/components/ui/icons/GithubIcon";

/**
 * Closing call-out, sized as a single compact block (not a full section
 * — no ordinal label, no big H2). It exists for one job: turn a reader
 * who just finished the Simulator section's honest verdicts into a
 * GitHub visitor who opens an issue or starts a review.
 *
 * Two CTAs:
 *   - Primary (accent): repo on GitHub
 *   - Secondary (bordered): direct "open an issue" link, so peer
 *     reviewers don't have to figure out the contribution path.
 */
export function ReviewersWanted() {
  return (
    <section className="relative border-t border-border py-24 md:py-32">
      <Container>
        <ScrollReveal variant="up">
          <div className="mx-auto max-w-2xl rounded-lg border border-border bg-bg/40 p-8 backdrop-blur-sm md:p-12">
            <div className="font-mono text-xs uppercase tracking-[0.18em] text-accent-link">
              Reviewers wanted
            </div>
            <h2 className="mt-4 text-2xl font-medium leading-[1.15] tracking-tight text-fg md:text-3xl">
              Critique us before we ship.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted md:text-base">
              MonAI is conceptual-design open. We are recruiting peer
              reviewers on the formalisation, the simulator and the threat
              model. The most useful contribution right now is a careful
              read and a sharp objection — not code.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <MagneticButton>
                <a
                  href={externalLinks.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 rounded-md bg-accent px-6 py-3 text-sm font-medium text-bg transition-opacity hover:opacity-90"
                >
                  <GithubIcon className="h-4 w-4" />
                  View on GitHub
                </a>
              </MagneticButton>
              <MagneticButton>
                <a
                  href={`${externalLinks.github}/issues/new`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 rounded-md border border-border px-6 py-3 text-sm font-medium text-fg transition-colors hover:border-accent-link hover:bg-border/40"
                >
                  Open an RFC issue
                  <span
                    aria-hidden
                    className="transition-transform group-hover:translate-x-0.5"
                  >
                    →
                  </span>
                </a>
              </MagneticButton>
            </div>
          </div>
        </ScrollReveal>
      </Container>
    </section>
  );
}
