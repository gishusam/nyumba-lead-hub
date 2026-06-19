import type { LeadStatus } from "@/data/mock";
import { STATUS_LABEL, type LeadStatusApi } from "@/lib/api";

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

export function StatusBadgeApi({ status }: { status: LeadStatusApi }) {
  const label = STATUS_LABEL[status] ?? status;
  return <StatusBadge status={label as LeadStatus} />;
}

export function ScorePill({ score }: { score: number | null | undefined }) {
  const s = score ?? 0;
  const cls =
    s >= 80
      ? "bg-success/15 text-success"
      : s >= 50
        ? "bg-warning/20 text-warning-foreground"
        : "bg-muted text-muted-foreground";
  const label = s >= 80 ? "Hot" : s >= 50 ? "Warm" : "Cold";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold ${cls}`}>
      <span className="tabular-nums">{s}</span>
      <span className="opacity-70">·</span>
      <span>{label}</span>
    </span>
  );
}
