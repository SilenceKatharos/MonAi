"use client";

import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react";
import { useLenis } from "@/components/providers/SmoothScroll";

// Compensates for the sticky header (h-16 = 64px). When anchor scrolling,
// we want the target section's top edge to land below the header rather
// than under it.
const HEADER_OFFSET = -64;

type Props = {
  /** Same-page anchor (`#id`) or `#top` to scroll to the very top. */
  href: string;
  children: ReactNode;
  /** Optional side-effect fired before scrolling (e.g. close mobile menu). */
  onNavigate?: () => void;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "onClick">;

/**
 * Anchor link that routes through Lenis when smooth scroll is available,
 * and falls back to the native `scrollIntoView` for reduced-motion users.
 * Centralising this here keeps the offset, the null-check and the
 * special-cased `#top` behaviour in one place.
 */
export function SmoothLink({ href, children, onNavigate, ...rest }: Props) {
  const lenis = useLenis();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.defaultPrevented) return;
    if (!href.startsWith("#")) return; // external — let it through

    event.preventDefault();
    onNavigate?.();

    if (href === "#top") {
      if (lenis) lenis.scrollTo(0);
      else window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (lenis) {
      lenis.scrollTo(href, { offset: HEADER_OFFSET });
    } else {
      document
        .querySelector(href)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <a href={href} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}
