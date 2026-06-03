import type { LeadStatus } from "@/data/mock";

const styles: Record<LeadStatus, string> = {
  New: "bg-info/10 text-info border-info/20",
  Called: "bg-warning/15 text-warning-foreground border-warning/30",
  "Demo Booked": "bg-primary/10 text-primary border-primary/20",
  Won: "bg-success/15 text-success border-success/30",
  Lost: "bg-destructive/10 text-destructive border-destructive/20",
};

export function StatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {status}
    </span>
  );
}

export function ScorePill({ score }: { score: number }) {
  const cls =
    score >= 80
      ? "bg-success/15 text-success"
      : score >= 50
        ? "bg-warning/20 text-warning-foreground"
        : "bg-muted text-muted-foreground";
  const label = score >= 80 ? "Hot" : score >= 50 ? "Warm" : "Cold";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold ${cls}`}>
      <span className="tabular-nums">{score}</span>
      <span className="opacity-70">·</span>
      <span>{label}</span>
    </span>
  );
}
