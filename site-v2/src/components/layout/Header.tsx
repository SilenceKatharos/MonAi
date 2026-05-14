"use client";

import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useLenis } from "@/components/providers/SmoothScroll";
import { Container } from "@/components/ui/Container";
import { GithubIcon } from "@/components/ui/icons/GithubIcon";
import { SmoothLink } from "@/components/ui/SmoothLink";
import { externalLinks, navItems, type NavItem } from "./nav-items";

/**
 * Sticky header with two visual states:
 *   - At the top of the page: fully transparent, no border, no blur.
 *   - After the first ~8px of scroll: 70%-opaque slate background with
 *     a subtle backdrop-blur and a hairline bottom border.
 *
 * Nav items can be same-page anchors (`#protocol`) or real routes
 * (`/security`). `NavLink` picks `SmoothLink` (Lenis-driven) for the
 * former and Next's `Link` for the latter.
 *
 * Breakpoint: the burger now activates below `lg` (1024px) rather than
 * `md`, because we have enough nav entries that tablet would otherwise
 * either wrap or overflow.
 */
export function Header() {
  const lenis = useLenis();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Track scroll position. A small threshold (8px) prevents the bar from
  // flickering on rubber-band micro-scrolls on macOS / iOS trackpads.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const openMenu = useCallback(() => {
    setMenuOpen(true);
    lenis?.stop();
    document.body.style.overflow = "hidden";
  }, [lenis]);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    lenis?.start();
    document.body.style.overflow = "";
  }, [lenis]);

  // Safety cleanup: if the component unmounts while the menu is open
  // (e.g. fast refresh), make sure we don't leave the page locked.
  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
      lenis?.start();
    };
  }, [lenis]);

  return (
    <>
      <header
        className={`sticky top-0 z-50 h-16 transition-colors duration-200 ${
          scrolled
            ? "border-b border-border/60 bg-bg/70 backdrop-blur-md"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <Container className="flex h-full items-center justify-between">
          <SmoothLink
            href="#top"
            className="flex items-center gap-3"
            aria-label="MonAI — back to top"
          >
            <Image
              src="/logo.png"
              alt=""
              width={40}
              height={40}
              priority
              className="h-9 w-9"
            />
            <span className="text-base font-medium tracking-tight text-fg">
              MonAI
            </span>
          </SmoothLink>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-7 lg:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                className="text-sm text-muted transition-colors hover:text-fg"
              />
            ))}
            <a
              href={externalLinks.github}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub repository"
              className="text-muted transition-colors hover:text-fg"
            >
              <GithubIcon className="h-5 w-5" />
            </a>
          </nav>

          {/* Burger (shown below lg) */}
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            onClick={openMenu}
            className="-mr-2 p-2 text-fg lg:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>
        </Container>
      </header>

      {/* Mobile / tablet overlay menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-60 flex flex-col bg-bg lg:hidden">
          <div className="flex h-16 items-center justify-between px-6">
            <span className="text-base font-medium tracking-tight text-fg">
              MonAI
            </span>
            <button
              type="button"
              aria-label="Close menu"
              onClick={closeMenu}
              className="-mr-2 p-2 text-fg"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex flex-1 flex-col items-center justify-center gap-8">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                onNavigate={closeMenu}
                className="text-2xl font-medium tracking-tight text-fg transition-colors hover:text-accent"
              />
            ))}
            <a
              href={externalLinks.github}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-base text-muted transition-colors hover:text-fg"
            >
              <GithubIcon className="h-5 w-5" />
              <span>GitHub</span>
            </a>
          </nav>
        </div>
      )}
    </>
  );
}

/**
 * Routes via `next/link` for `/path` entries, smooth-scrolls via
 * `SmoothLink` for `#anchor` entries. The two arms share the same
 * className so the desktop and overlay menus stay visually consistent.
 */
function NavLink({
  item,
  onNavigate,
  className,
}: {
  item: NavItem;
  onNavigate?: () => void;
  className: string;
}) {
  if (item.href.startsWith("#")) {
    return (
      <SmoothLink
        href={item.href}
        onNavigate={onNavigate}
        className={className}
      >
        {item.label}
      </SmoothLink>
    );
  }
  return (
    <Link href={item.href} onClick={onNavigate} className={className}>
      {item.label}
    </Link>
  );
}
