"use client";

import { Minus, Plus } from "lucide-react";
import { useState } from "react";
import type { Attack } from "@/data/attacks";

type Props = {
  attack: Attack;
};

/**
 * Single attack card on the `/security` page. Compact header (number,
 * "simulated" flag if applicable, name, one-line description) with a
 * click-to-expand defenses list and residual-risk footer.
 *
 * Expand is done via `max-height` + opacity CSS transitions (not a
 * motion library). For ~10 cards on a page this is cheaper than
 * mounting per-card motion components, and the easing is fine.
 */
export function AttackCard({ attack }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`group h-full rounded-lg border bg-bg/30 backdrop-blur-sm transition-colors ${
        attack.simulated ? "border-accent-link/30" : "border-border"
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-start gap-4 p-6 text-left"
      >
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-xs uppercase tracking-[0.18em] text-accent-link">
              {attack.index}
            </span>
            {attack.simulated && (
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-success">
                · simulated
              </span>
            )}
          </div>
          <h3 className="mt-3 text-base font-medium text-fg">{attack.name}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {attack.description}
          </p>
        </div>
        <span className="mt-1 text-muted transition-colors group-hover:text-fg">
          {open ? (
            <Minus className="h-5 w-5" />
          ) : (
            <Plus className="h-5 w-5" />
          )}
        </span>
      </button>

      <div
        className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-out ${
          open ? "max-h-[1200px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="border-t border-border px-6 py-5">
          <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            Defense layers
          </div>
          <ol className="space-y-4">
            {attack.defenses.map((d, i) => (
              <li key={d.label} className="flex gap-4">
                <span className="font-mono text-xs text-accent-link">
                  L{i + 1}
                </span>
                <div className="flex-1">
                  <div className="text-sm font-medium text-fg">{d.label}</div>
                  <div className="mt-1 text-xs leading-relaxed text-muted">
                    {d.description}
                  </div>
                </div>
              </li>
            ))}
          </ol>
          {attack.residual && (
            <div className="mt-6 border-t border-border/50 pt-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-warning/80">
                Residual risk
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted">
                {attack.residual}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
