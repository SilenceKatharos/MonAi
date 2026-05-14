import type { ReactNode } from "react";

type Size = "sm" | "md" | "lg";

const sizeClasses: Record<Size, string> = {
  sm: "text-sm",
  md: "text-base md:text-lg",
  lg: "text-2xl md:text-4xl",
};

type FormulaProps = {
  children: ReactNode;
  size?: Size;
  /** Apply `text-center` to the formula block. */
  center?: boolean;
  className?: string;
};

/**
 * Mono-font container for a typeset formula. Use with `<Sub>` / `<Sup>`
 * for proper accent-coloured subscripts and superscripts.
 *
 * Why not LaTeX/MathJax: we render small inline pieces, never multiline
 * math, and we want strict palette control. Pulling in a TeX renderer
 * just for `R_C` would be bundle-overkill.
 */
export function Formula({
  children,
  size = "md",
  center = false,
  className = "",
}: FormulaProps) {
  return (
    <div
      className={`font-mono ${sizeClasses[size]} ${center ? "text-center" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

type SubSupProps = {
  children: ReactNode;
  /** When true (default), tint with `--color-accent-link`; otherwise inherit. */
  accent?: boolean;
};

/** Subscript. Accent-link tinted by default so identifiers like `R_C` read clearly. */
export function Sub({ children, accent = true }: SubSupProps) {
  return (
    <sub className={`text-[0.6em] ${accent ? "text-accent-link" : ""}`}>
      {children}
    </sub>
  );
}

/** Superscript. Inherits colour by default — supercripts are rarer and usually neutral. */
export function Sup({ children, accent = false }: SubSupProps) {
  return (
    <sup className={`text-[0.6em] ${accent ? "text-accent-link" : ""}`}>
      {children}
    </sup>
  );
}
