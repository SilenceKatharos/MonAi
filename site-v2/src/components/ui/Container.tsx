import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

/**
 * Page-content gutter. Centralises max-width + horizontal padding so every
 * section, the header, and the footer all align to the same vertical
 * rhythm. Change the max-width here once if the layout grid evolves.
 */
export function Container({ children, className = "" }: Props) {
  return (
    <div className={`mx-auto w-full max-w-6xl px-6 ${className}`}>
      {children}
    </div>
  );
}
