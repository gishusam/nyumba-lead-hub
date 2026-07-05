import type { AiScoreLabel } from "@/lib/api";

export const AI_SCORE_OPTIONS: { value: AiScoreLabel; label: string }[] = [
  { value: "LOW_HANGING_FRUIT", label: "Low Hanging Fruit" },
  { value: "WARM_PROSPECT", label: "Warm Prospect" },
  { value: "EXECUTIVE_LEAD", label: "Executive Lead" },
  { value: "NURTURE", label: "Nurture" },
  { value: "NOT_QUALIFIED", label: "Not Qualified" },
];

const styles: Record<string, string> = {
  LOW_HANGING_FRUIT: "bg-success/15 text-success border-success/30",
  WARM_PROSPECT: "bg-info/10 text-info border-info/20",
  EXECUTIVE_LEAD: "bg-primary/10 text-primary border-primary/20",
  NURTURE: "bg-warning/15 text-warning-foreground border-warning/30",
  NOT_QUALIFIED: "bg-muted text-muted-foreground border-border",
};

const labels: Record<string, string> = Object.fromEntries(
  AI_SCORE_OPTIONS.map((o) => [o.value, o.label]),
);

export function AiScoreBadge({
  label,
  score,
}: {
  label?: string | null;
  score?: number | null;
}) {
  if (!label) {
    return (
      <span className="tabular-nums text-sm text-muted-foreground">
        {score ?? "—"}
      </span>
    );
  }
  const cls = styles[label] ?? "bg-muted text-muted-foreground border-border";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}
    >
      {labels[label] ?? label}
    </span>
  );
}
