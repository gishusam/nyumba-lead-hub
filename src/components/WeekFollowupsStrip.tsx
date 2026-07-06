import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Phone } from "lucide-react";
import { reportsApi, leadsApi, type Lead } from "@/lib/api";
import { AiScoreBadge } from "@/components/AiScoreBadge";
import { LeadDetailPanel } from "@/components/LeadDetailPanel";

function columnColor(count: number, days: number) {
  if (count === 0) return "bg-muted/40 text-muted-foreground border-border";
  if (days === 0) return "bg-destructive/10 text-destructive border-destructive/30";
  if (days <= 2) return "bg-warning/15 text-warning-foreground border-warning/30";
  return "bg-success/10 text-success border-success/30";
}

export function WeekFollowupsStrip() {
  const q = useQuery({
    queryKey: ["reports", "weekly", "followups"],
    queryFn: reportsApi.weekly,
  });
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);

  const days = q.data?.follow_up_next_7_days ?? [];

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="px-5 py-3 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold">Follow-ups this week</h3>
        <span className="text-xs text-muted-foreground">Next 8 days</span>
      </div>

      {q.isLoading ? (
        <div className="p-6 text-sm text-muted-foreground">Loading follow-ups…</div>
      ) : days.length === 0 ? (
        <div className="p-6 text-sm text-muted-foreground">
          No follow-ups scheduled.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-2 p-3">
            {days.map((d, i) => {
              const active = activeIdx === i;
              return (
                <button
                  key={d.date}
                  onClick={() => setActiveIdx(active ? null : i)}
                  className={`rounded-lg border p-3 text-left transition-all ${columnColor(
                    d.count,
                    d.days_from_today,
                  )} ${active ? "ring-2 ring-primary" : "hover:brightness-105"}`}
                >
                  <div className="text-xs font-semibold uppercase tracking-wide">
                    {d.day_label}
                  </div>
                  <div className="text-[10px] opacity-70">
                    {new Date(d.date).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                  <div className="mt-2 text-xl font-semibold tabular-nums">
                    {d.count}
                  </div>
                </button>
              );
            })}
          </div>

          {activeIdx != null && days[activeIdx] && (
            <div className="border-t border-border p-4 space-y-2">
              <div className="text-sm font-medium">
                {days[activeIdx].day_label} — {days[activeIdx].count} follow-up
                {days[activeIdx].count === 1 ? "" : "s"}
              </div>
              {days[activeIdx].leads.length === 0 ? (
                <div className="text-sm text-muted-foreground italic">
                  Nothing scheduled.
                </div>
              ) : (
                <ul className="divide-y divide-border rounded-lg border border-border overflow-hidden">
                  {days[activeIdx].leads.map((l) => (
                    <li
                      key={l.id}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-muted/40 cursor-pointer"
                      onClick={() => setActiveLead({ ...(l as any), lead_type: l.lead_type ?? "apartment", status: (l.status as any) ?? "new" })}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{l.name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {l.area ?? "—"}
                        </div>
                      </div>
                      {l.phone && (
                        <a
                          href={`tel:${l.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-info inline-flex items-center gap-1 text-xs hover:underline"
                        >
                          <Phone className="h-3 w-3" /> {l.phone}
                        </a>
                      )}
                      <AiScoreBadge
                        label={l.ai_score_label as any}
                        score={l.ai_score}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}

      <LeadDetailPanel lead={activeLead} onClose={() => setActiveLead(null)} />
    </div>
  );
}

// Silence unused import warning; leadsApi may be used in future extensions.
export const _ = leadsApi;
