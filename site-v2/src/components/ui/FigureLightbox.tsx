"use client";

import { X } from "lucide-react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "motion/react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { useLenis } from "@/components/providers/SmoothScroll";

type Props = {
  src: string;
  alt: string;
  caption: string;
  /** Intrinsic pixel dimensions of the source image (aspect-ratio only). */
  width: number;
  height: number;
  /** Apply the `invert(1) hue-rotate(180deg)` filter that wraps matplotlib
   * light-background plots into the dark palette. */
  invert?: boolean;
};

const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

/**
 * Click-to-enlarge figure. Thumbnail renders inline as a button; activation
 * opens a full-viewport overlay with the same image at viewport scale.
 *
 * Closes on: explicit close button, click on backdrop, Escape keypress.
 * While open, page scroll is paused via Lenis (with `body.overflow=hidden`
 * as a reduced-motion / no-Lenis fallback) and a keyboard listener catches
 * Escape.
 *
 * Animations gate on `useReducedMotion` — reduced-motion users get an
 * instant show/hide with no spring or fade.
 */
export function FigureLightbox({
  src,
  alt,
  caption,
  width,
  height,
  invert = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const reduced = useReducedMotion();
  const lenis = useLenis();

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    lenis?.stop();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);

    return () => {
      lenis?.start();
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, lenis]);

  const invertStyle = invert
    ? { filter: "invert(1) hue-rotate(180deg)" as const }
    : undefined;

  const overlayDuration = reduced ? 0 : 0.2;
  const figureDuration = reduced ? 0 : 0.25;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Enlarge figure: ${caption}`}
        className="group block w-full cursor-zoom-in rounded-lg border border-border bg-bg/30 p-3 text-left transition-colors hover:border-accent-link/50"
      >
        <div className="overflow-hidden rounded-md" style={invertStyle}>
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            className="h-auto w-full transition-transform duration-300 group-hover:scale-[1.02]"
            unoptimized
          />
        </div>
        <figcaption className="mt-3 px-2 pb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
          {caption}
        </figcaption>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="lightbox-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: overlayDuration }}
            onClick={close}
            role="dialog"
            aria-modal="true"
            aria-label={caption}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-bg/95 p-4 backdrop-blur-md md:p-12"
          >
            <button
              type="button"
              onClick={close}
              aria-label="Close enlarged figure"
              className="absolute top-4 right-4 z-10 rounded-md border border-border bg-bg/60 p-2 text-fg transition-colors hover:border-accent-link hover:text-accent-link md:top-6 md:right-6"
            >
              <X className="h-5 w-5" />
            </button>

            <motion.figure
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: figureDuration, ease: EASE_OUT_EXPO }}
              onClick={(event) => event.stopPropagation()}
              className="flex max-h-[90vh] max-w-[95vw] flex-col items-center"
            >
              <div
                className="overflow-hidden rounded-lg border border-border"
                style={invertStyle}
              >
                <Image
                  src={src}
                  alt={alt}
                  width={width}
                  height={height}
                  sizes="(max-width: 768px) 95vw, 80vw"
                  className="h-auto max-h-[80vh] w-auto max-w-[90vw]"
                  unoptimized
                />
              </div>
              <figcaption className="mt-4 text-center font-mono text-xs uppercase tracking-[0.18em] text-muted">
                {caption}
              </figcaption>
            </motion.figure>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
