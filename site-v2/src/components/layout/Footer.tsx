import { Container } from "@/components/ui/Container";
import { GradientRule } from "@/components/ui/GradientRule";
import { GithubIcon } from "@/components/ui/icons/GithubIcon";
import { SmoothLink } from "@/components/ui/SmoothLink";
import { externalLinks } from "./nav-items";

/**
 * Minimalist footer. One row on desktop (copyright left, links right),
 * stacked on mobile. The version badge in mono font is the only piece
 * of brand "signature" — kept understated to stay consistent with the
 * academic tone of the rest of the page.
 */
export function Footer() {
  return (
    <footer className="mt-32">
      <GradientRule className="opacity-30" />
      <Container className="flex flex-col gap-6 py-10 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-muted">
          © {new Date().getFullYear()} MonAI — Open-source conceptual design.
        </p>
        <div className="flex flex-wrap items-center gap-6 text-sm">
          <SmoothLink
            href="#whitepaper"
            className="text-muted transition-colors hover:text-fg"
          >
            Whitepaper
          </SmoothLink>
          <a
            href={externalLinks.github}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-muted transition-colors hover:text-fg"
          >
            <GithubIcon className="h-4 w-4" />
            <span>GitHub</span>
          </a>
          <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
            v0.5 · Conceptual design
          </span>
        </div>
      </Container>
    </footer>
  );
}
