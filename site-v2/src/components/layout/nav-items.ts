// Single source of truth for primary navigation. Used by the desktop nav
// in the header, the mobile overlay menu, and the footer. Keeping nav
// entries here (rather than inline in each component) makes it trivial
// to add or reorder a section without touching three files.
//
// Kind is inferred from `href`: `#x` is a same-page anchor (driven by
// Lenis through SmoothLink), `/x` is a real route navigation (Next Link).

export type NavItem = {
  label: string;
  href: string; // `#section-id` for anchors, `/path` for routes
};

export const navItems: NavItem[] = [
  { label: "Problem", href: "#problem" },
  { label: "Protocol", href: "#protocol" },
  { label: "Principles", href: "#principles" },
  { label: "Whitepaper", href: "#whitepaper" },
  { label: "Security", href: "/security" },
];

// External links surfaced in header / footer / hero. Centralised so the
// repo URL can be swapped in one place when the project goes public.
export const externalLinks = {
  github: "https://github.com/SilenceKatharos/monai",
} as const;
