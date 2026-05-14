type Status = "ok" | "fail" | "neutral";

const statusGlyph: Record<Status, string | null> = {
  ok: "✓",
  fail: "✗",
  neutral: null,
};

const statusColour: Record<Status, string> = {
  ok: "text-success",
  fail: "text-error",
  neutral: "text-muted",
};

type Props = {
  label: string;
  value: string | number;
  /** Visual verdict; controls the trailing glyph and its colour. */
  status?: Status;
  className?: string;
};

/**
 * Bordered stat chip with a mono label and a mono value. Used for things
 * like `H/C = 3.19 ✗`, `w_h = 5`, `10⁻⁹ MonAI minimum unit`. Status
 * defaults to `neutral` (no glyph) so it can stand alone as a fact card
 * when a verdict isn't meaningful.
 */
export function MetricChip({
  label,
  value,
  status = "neutral",
  className = "",
}: Props) {
  const glyph = statusGlyph[status];
  return (
    <div
      className={`inline-flex flex-col gap-1 rounded-md border border-border bg-bg/40 px-4 py-3 backdrop-blur-sm ${className}`}
    >
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
        {label}
      </span>
      <span className="font-mono text-lg font-medium text-fg">
        {value}
        {glyph && <span className={`ml-2 ${statusColour[status]}`}>{glyph}</span>}
      </span>
    </div>
  );
}
