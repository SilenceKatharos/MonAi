import { Container } from "@/components/ui/Container";

type Props = {
  id: string;
  /** Two-digit ordinal (e.g. "01", "02") rendered as a mono-font label. */
  index: string;
  title: string;
  description?: string;
};

/**
 * Stand-in section used until each real section gets its own component.
 * Keeps the visual scaffolding (academic-style ordinal label, a thin
 * connector rule, a generous title) so the page already conveys its
 * rhythm and density while we test scroll + sticky-header behaviour.
 *
 * Height: `min-h-screen` rather than `h-screen` so real content can
 * grow past one viewport without breaking the layout later.
 */
export function SectionPlaceholder({ id, index, title, description }: Props) {
  return (
    <section id={id} className="min-h-screen border-t border-border py-32">
      <Container>
        <div className="mb-10 flex items-center gap-3">
          <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
            {index}
          </span>
          <span className="h-px w-8 bg-border" aria-hidden />
          <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
            {title}
          </span>
        </div>
        <h2 className="max-w-2xl text-3xl font-medium tracking-tight text-fg md:text-4xl">
          {title}
        </h2>
        {description && (
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted">
            {description}
          </p>
        )}
      </Container>
    </section>
  );
}
