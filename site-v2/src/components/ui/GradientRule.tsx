type Props = {
  className?: string;
};

/**
 * Hairline blue → lavender gradient referencing the MonAI logo gradient.
 * Used sparingly (once under the hero, once above the footer) as the
 * single place the brand colour escapes the neutral palette into the
 * page chrome. Anything else stays neutral.
 *
 * Built as an arbitrary-value `linear-gradient` so it stays correct
 * regardless of Tailwind 4's `bg-linear-to-r` rename history.
 */
export function GradientRule({ className = "" }: Props) {
  return (
    <div
      aria-hidden
      className={`h-px w-full opacity-50 bg-[linear-gradient(90deg,transparent_0%,var(--color-accent-link)_30%,var(--color-accent-secondary)_70%,transparent_100%)] ${className}`}
    />
  );
}
