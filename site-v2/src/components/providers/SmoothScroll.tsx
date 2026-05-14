'use client';

import Lenis from 'lenis';
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

/**
 * Holds the active Lenis instance, or `null` when smooth scroll is
 * disabled (the user opted into prefers-reduced-motion) or before the
 * provider has mounted. Consumers must null-check before calling
 * methods like `.scrollTo()`.
 */
const LenisContext = createContext<Lenis | null>(null);

/** Read the active Lenis instance from anywhere in the tree. */
export function useLenis(): Lenis | null {
  return useContext(LenisContext);
}

type Props = { children: ReactNode };

/**
 * App-wide smooth-scroll provider. Wraps children with a single Lenis
 * instance, driven by one requestAnimationFrame loop. Honours the user's
 * prefers-reduced-motion preference both at mount and reactively — toggling
 * the OS setting takes effect without a page reload.
 *
 * Note on options:
 *   - `smoothTouch` was renamed to `syncTouch` in Lenis ≥ 1.1. Keeping it
 *     `false` lets iOS/Android keep their native scroll inertia, which
 *     avoids fighting OS-level swipe gestures and is what users expect
 *     on mobile.
 */
export default function SmoothScroll({ children }: Props) {
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    let instance: Lenis | null = null;

    const enable = () => {
      if (instance) return;
      instance = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // easeOutExpo
        smoothWheel: true,
        syncTouch: false,
        wheelMultiplier: 1,
        touchMultiplier: 2,
      });

      const raf = (time: number) => {
        instance?.raf(time);
        rafIdRef.current = requestAnimationFrame(raf);
      };
      rafIdRef.current = requestAnimationFrame(raf);
      setLenis(instance);
    };

    const disable = () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      if (instance) {
        instance.destroy();
        instance = null;
      }
      setLenis(null);
    };

    if (!media.matches) enable();

    const onPreferenceChange = (event: MediaQueryListEvent) => {
      if (event.matches) disable();
      else enable();
    };
    media.addEventListener('change', onPreferenceChange);

    return () => {
      media.removeEventListener('change', onPreferenceChange);
      disable();
    };
  }, []);

  return (
    <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>
  );
}
