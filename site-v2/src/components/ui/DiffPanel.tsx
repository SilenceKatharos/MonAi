type Row = { label: string; value: string };

type Side = {
  label: string;
  rows: Row[];
  /** Highlight this side with an accent-link border and softer accent tint. */
  accent?: boolean;
};

type Props = {
  left: Side;
  right: Side;
  className?: string;
};

/**
 * Two-column comparison ("before / after", "honest / cherry-picker",
 * "under load / saturation"). Each side is a column of label-value rows
 * in mono. One side can be marked `accent` to indicate the "kept" or
 * "winning" option — used sparingly, never on both sides at once.
 */
export function DiffPanel({ left, right, className = "" }: Props) {
  return (
    <div className={`grid grid-cols-1 gap-4 md:grid-cols-2 ${className}`}>
      {[left, right].map((side) => (
        <div
          key={side.label}
          className={`rounded-lg border p-6 backdrop-blur-sm ${
            side.accent
              ? "border-accent-link/40 bg-accent-link/[0.04]"
              : "border-border bg-bg/30"
          }`}
        >
          <div
            className={`font-mono text-xs uppercase tracking-[0.18em] ${
              side.accent ? "text-accent-link" : "text-muted"
            }`}
          >
            {side.label}
          </div>
          <dl className="mt-5 space-y-3">
            {side.rows.map((row) => (
              <div
                key={row.label}
                className="flex items-baseline justify-between gap-4 border-t border-border/40 pt-3 first:border-t-0 first:pt-0"
              >
                <dt className="text-xs text-muted">{row.label}</dt>
                <dd
                  className={`font-mono text-sm ${
                    side.accent ? "text-fg" : "text-muted"
                  }`}
                >
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}
