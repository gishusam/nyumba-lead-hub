import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Mail, Phone } from "lucide-react";
import { reportsApi, type Lead } from "@/lib/api";
import { AiScoreBadge } from "@/components/AiScoreBadge";
import { LeadDetailPanel } from "@/components/LeadDetailPanel";
import { Button } from "@/components/ui/button";

function columnColor(count: number, days: number) {
  if (count === 0) return "bg-muted/40 text-muted-foreground border-border";
  if (days === 0) return "bg-destructive/10 text-destructive border-destructive/30";
  if (days <= 2) return "bg-warning/15 text-warning-foreground border-warning/30";
  return "bg-success/10 text-success border-success/30";
}

function relTime(iso?: string | null) {
  if (!iso) return "—";
  const diff = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.round(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

type PanelConfig = {
  lead: Lead;
  defaultTab?: "overview" | "activity" | "email";
  defaultEmailFlow?: "cold" | "followup";
};

export function WeekFollowupsStrip() {
  const q = useQuery({
    queryKey: ["reports", "weekly", "followups"],
    queryFn: reportsApi.weekly,
  });
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [panelConfig, setPanelConfig] = useState<PanelConfig | null>(null);
  const stripRef = useRef<HTMLDivElement>(null);

  const days = q.data?.follow_up_next_7_days ?? [];
  const todayIdx = days.findIndex((d) => d.days_from_today === 0);
  const todayCount = todayIdx >= 0 ? days[todayIdx]?.count ?? 0 : 0;

  const openPanel = (
    raw: (typeof days)[0]["leads"][0],
    defaultTab?: "overview" | "activity" | "email",
    defaultEmailFlow?: "cold" | "followup",
  ) => {
    setPanelConfig({
      lead: {
        ...(raw as any),
        lead_type: raw.lead_type ?? "apartment",
        status: (raw.status as any) ?? "new",
      } as Lead,
      defaultTab,
      defaultEmailFlow,
    });
  };

  const handleViewToday = () => {
    if (todayIdx >= 0) {
      setActiveIdx(todayIdx);
      setTimeout(() => stripRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    }
  };

  return (
    <>
      {/* Due-today alert banner */}
      {!q.isLoading && todayCount > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-3">
          <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
          <p className="flex-1 text-sm font-medium text-destructive">
            {todayCount} follow-up{todayCount === 1 ? "" : "s"} due today
          </p>
          <button
            onClick={handleViewToday}
            className="text-xs font-semibold text-destructive underline underline-offset-2 hover:no-underline"
          >
            View all
          </button>
        </div>
      )}

      <div ref={stripRef} className="rounded-xl border border-border bg-card shadow-sm">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold">Follow-ups this week</h3>
          <span className="text-xs text-muted-foreground">Next 8 days</span>
        </div>

        {q.isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading follow-ups…</div>
        ) : days.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">No follow-ups scheduled.</div>
        ) : (
          <>
            {/* Day column grid */}
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
                    <div className="mt-2 text-xl font-semibold tabular-nums">{d.count}</div>
                  </button>
                );
              })}
            </div>

            {/* Expanded day panel */}
            {activeIdx != null && days[activeIdx] && (
              <div className="border-t border-border p-4 space-y-3">
                <div className="text-sm font-medium">
                  {days[activeIdx].day_label} —{" "}
                  {days[activeIdx].count} follow-up
                  {days[activeIdx].count === 1 ? "" : "s"}
                </div>

                {days[activeIdx].leads.length === 0 ? (
                  <div className="text-sm text-muted-foreground italic">Nothing scheduled.</div>
                ) : (
                  <div className="rounded-xl border border-border overflow-hidden">
                    {/* Table header */}
                    <div className="hidden md:grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 px-4 py-2 bg-muted/40 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                      <span>Lead</span>
                      <span>Phone</span>
                      <span>AI Score</span>
                      <span>Last contacted</span>
                      <span className="text-right">Actions</span>
                    </div>

                    <ul className="divide-y divide-border">
                      {days[activeIdx].leads.map((l) => (
                        <li
                          key={l.id}
                          className="flex flex-col md:grid md:grid-cols-[1fr_auto_auto_auto_auto] md:items-center gap-2 md:gap-3 px-4 py-3 hover:bg-muted/30 cursor-pointer"
                          onClick={() => openPanel(l)}
                        >
                          {/* Name + area */}
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">{l.name}</div>
                            {l.area && (
                              <div className="text-xs text-muted-foreground truncate">{l.area}</div>
                            )}
                          </div>

                          {/* Phone */}
                          <div className="text-xs text-muted-foreground tabular-nums shrink-0">
                            {l.phone ?? "—"}
                          </div>

                          {/* AI score badge */}
                          <div className="shrink-0">
                            <AiScoreBadge
                              label={l.ai_score_label as any}
                              score={l.ai_score}
                            />
                          </div>

                          {/* Last contacted */}
                          <div className="text-xs text-muted-foreground shrink-0">
                            {(l as any).last_contacted
                              ? relTime((l as any).last_contacted)
                              : "—"}
                          </div>

                          {/* Actions */}
                          <div
                            className="flex items-center gap-1.5 shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {l.phone && (
                              <a href={`tel:${l.phone}`}>
                                <Button size="sm" variant="outline" className="h-7 gap-1 text-xs px-2">
                                  <Phone className="h-3 w-3" />
                                  Call
                                </Button>
                              </a>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 gap-1 text-xs px-2 text-violet-700 border-violet-300 hover:bg-violet-50"
                              onClick={() => openPanel(l, "email", "followup")}
                            >
                              <Mail className="h-3 w-3" />
                              Send Follow-up
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <LeadDetailPanel
        lead={panelConfig?.lead ?? null}
        onClose={() => setPanelConfig(null)}
        defaultTab={panelConfig?.defaultTab ?? "overview"}
        defaultEmailFlow={panelConfig?.defaultEmailFlow}
      />
    </>
  );
}
