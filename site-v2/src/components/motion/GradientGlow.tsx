type Color = "accent" | "link" | "secondary";
type Size = "sm" | "md" | "lg" | "xl";

const colorVars: Record<Color, string> = {
  accent: "var(--color-accent)",
  link: "var(--color-accent-link)",
  secondary: "var(--color-accent-secondary)",
};

const sizeClasses: Record<Size, string> = {
  sm: "w-[260px] h-[260px]",
  md: "w-[480px] h-[480px]",
  lg: "w-[720px] h-[720px]",
  xl: "w-[1000px] h-[1000px]",
};

type Props = {
  className?: string;
  color?: Color;
  size?: Size;
  /** 0 to 1. Defaults to 0.15 — already quite subtle. */
  intensity?: number;
};

/**
 * Decorative radial-gradient blob used to add depth behind hero copy and
 * section visuals. Purely visual, `aria-hidden`, `pointer-events-none`,
 * with a large blur so the orb feels diffuse rather than placed.
 *
 * Stays static even with prefers-reduced-motion since there's no
 * animation here — only positioning.
 */
export function GradientGlow({
  className = "",
  color = "accent",
  size = "md",
  intensity = 0.15,
}: Props) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute rounded-full ${sizeClasses[size]} ${className}`}
      style={{
        background: `radial-gradient(circle, ${colorVars[color]} 0%, transparent 70%)`,
        opacity: intensity,
        filter: "blur(80px)",
      }}
    />
  );
}
