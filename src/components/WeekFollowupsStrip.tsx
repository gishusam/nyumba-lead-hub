import { useRef, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  AlertTriangle,
  Mail,
  Send,
  Loader2,
  X,
  ArrowLeft,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { reportsApi, emailApi, type Lead, type EmailPreviewResponse } from "@/lib/api";
import { AiScoreBadge } from "@/components/AiScoreBadge";
import { Button } from "@/components/ui/button";

/* ─── color helpers ──────────────────────────────────────────── */

function columnColor(count: number, dayLabel: string) {
  if (count === 0) return "bg-muted/40 text-muted-foreground border-border";
  if (dayLabel === "Today") return "bg-destructive/10 text-destructive border-destructive/30";
  if (dayLabel === "Tomorrow") return "bg-warning/15 text-warning-foreground border-warning/30";
  return "bg-success/10 text-success border-success/30";
}

function badgeColor(dayLabel: string) {
  if (dayLabel === "Today") return "bg-destructive text-destructive-foreground";
  if (dayLabel === "Tomorrow") return "bg-warning text-warning-foreground";
  return "bg-success text-success-foreground";
}

/* ─── types ──────────────────────────────────────────────────── */

type DayLead = {
  id: string;
  name: string;
  phone?: string | null;
  area?: string | null;
  lead_type?: string;
  ai_score?: number | null;
  ai_score_label?: string | null;
  status?: string;
};

type FollowUpTarget = {
  id: string;
  name: string;
};

/* ─── lightweight follow-up email dialog ─────────────────────── */

function FollowUpEmailDialog({
  target,
  onClose,
}: {
  target: FollowUpTarget;
  onClose: () => void;
}) {
  const [preview, setPreview] = useState<EmailPreviewResponse | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [manualEmail, setManualEmail] = useState("");

  const previewMut = useMutation({
    mutationFn: () =>
      emailApi.preview(target.id, { email_type: "followup" }),
    onSuccess: (data) => {
      setPreview(data);
      setSubject(data.subject ?? "");
      setBody(data.body ?? "");
      setManualEmail(data.to_email ?? "");
    },
    onError: (err: any) =>
      toast.error(err?.message ?? "Failed to generate follow-up preview"),
  });

  const sendMut = useMutation({
    mutationFn: () => {
      if (!preview) throw new Error("No preview loaded");
      return emailApi.send(target.id, {
        email_id: preview.email_id,
        final_subject: subject,
        final_body: body,
        to_email: !preview.has_email ? (manualEmail || null) : null,
      });
    },
    onSuccess: (data) => {
      const dateStr = data.follow_up_date
        ? new Date(data.follow_up_date).toLocaleDateString("en-KE", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : null;
      toast.success(
        dateStr
          ? `Follow-up sent — next follow-up set for ${dateStr}`
          : "Follow-up email sent",
      );
      onClose();
    },
    onError: (err: any) =>
      toast.error(err?.message ?? "Failed to send follow-up email"),
  });

  // Auto-fetch preview on mount
  useState(() => { previewMut.mutate(); });

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl bg-background rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
          {preview && (
            <button
              onClick={() => setPreview(null)}
              className="rounded-lg p-1.5 hover:bg-muted text-muted-foreground"
              aria-label="Back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <div className="flex items-center gap-2 flex-1">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
              <RefreshCw className="h-3.5 w-3.5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm leading-none">Send Follow-up</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {target.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-muted text-muted-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          {previewMut.isPending && (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p className="text-sm">Generating AI follow-up…</p>
            </div>
          )}

          {previewMut.isError && !preview && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 flex items-start gap-2 text-sm text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Failed to generate preview</p>
                <p className="text-xs mt-0.5 opacity-80">
                  {(previewMut.error as any)?.message ?? "Unknown error"}
                </p>
                <button
                  onClick={() => previewMut.mutate()}
                  className="mt-2 text-xs underline underline-offset-2 font-medium"
                >
                  Try again
                </button>
              </div>
            </div>
          )}

          {preview && (
            <>
              {/* No email warning */}
              {!preview.has_email && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 space-y-2.5">
                  <div className="flex items-center gap-2 text-sm font-medium text-amber-800">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
                    No email address on file
                  </div>
                  <div>
                    <label className="text-xs text-amber-700">Recipient email</label>
                    <input
                      type="email"
                      value={manualEmail}
                      onChange={(e) => setManualEmail(e.target.value)}
                      placeholder="recipient@example.com"
                      className="mt-1.5 h-9 w-full rounded-lg border border-amber-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                    />
                  </div>
                </div>
              )}

              {/* Subject */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="h-9 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {/* Body */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Body
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={11}
                  className="w-full rounded-xl border border-input bg-background p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 leading-relaxed"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 px-5 py-4 border-t border-border bg-muted/20">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-muted-foreground">
            Cancel
          </Button>
          {!preview ? (
            <Button
              size="sm"
              onClick={() => previewMut.mutate()}
              disabled={previewMut.isPending}
              className="gap-2 min-w-[130px]"
            >
              {previewMut.isPending ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating…</>
              ) : (
                <><Mail className="h-3.5 w-3.5" /> Preview email</>
              )}
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => sendMut.mutate()}
              disabled={
                sendMut.isPending ||
                !body.trim() ||
                (!preview.has_email && !manualEmail.trim())
              }
              className="gap-2 min-w-[130px] bg-violet-600 hover:bg-violet-700"
            >
              {sendMut.isPending ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending…</>
              ) : (
                <><Send className="h-3.5 w-3.5" /> Confirm &amp; Send</>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── main strip ─────────────────────────────────────────────── */

export function WeekFollowupsStrip() {
  const q = useQuery({
    queryKey: ["reports", "weekly", "followups"],
    queryFn: reportsApi.weekly,
    staleTime: 5 * 60 * 1000,
  });

  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [followUpTarget, setFollowUpTarget] = useState<FollowUpTarget | null>(null);
  const stripRef = useRef<HTMLDivElement>(null);

  const days = q.data?.follow_up_next_7_days ?? [];
  const todayDay = days.find((d) => d.day_label === "Today");
  const todayCount = todayDay?.count ?? 0;

  const handleViewToday = () => {
    const idx = days.findIndex((d) => d.day_label === "Today");
    if (idx >= 0) {
      setActiveIdx(idx);
      setTimeout(
        () => stripRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
        50,
      );
    }
  };

  return (
    <>
      {/* Due-today alert banner */}
      {!q.isLoading && todayCount > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-3">
          <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
          <p className="flex-1 text-sm font-medium text-destructive">
            🔔 {todayCount} follow-up{todayCount === 1 ? "" : "s"} due today
          </p>
          <button
            onClick={handleViewToday}
            className="text-xs font-semibold text-destructive underline underline-offset-2 hover:no-underline"
          >
            View all
          </button>
        </div>
      )}

      {/* Week strip */}
      <div ref={stripRef} className="rounded-xl border border-border bg-card shadow-sm">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold">This Week's Follow-ups</h3>
          <span className="text-xs text-muted-foreground">Next 8 days</span>
        </div>

        {q.isLoading ? (
          <div className="grid grid-cols-4 md:grid-cols-8 gap-2 p-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-border bg-muted/20 p-3 h-[80px] animate-pulse" />
            ))}
          </div>
        ) : days.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground italic">
            No follow-ups scheduled this week.
          </div>
        ) : (
          <>
            {/* Day columns */}
            <div className="grid grid-cols-4 md:grid-cols-8 gap-2 p-3">
              {days.map((d, i) => {
                const active = activeIdx === i;
                const isEmpty = d.count === 0;
                return (
                  <button
                    key={d.date}
                    onClick={() => setActiveIdx(active ? null : i)}
                    disabled={isEmpty}
                    className={`rounded-lg border p-3 text-left transition-all ${
                      isEmpty ? "cursor-default opacity-40" : "hover:brightness-95 cursor-pointer"
                    } ${columnColor(d.count, d.day_label)} ${
                      active ? "ring-2 ring-primary ring-offset-1" : ""
                    }`}
                  >
                    <div className="text-xs font-semibold uppercase tracking-wide truncate">
                      {d.day_label}
                    </div>
                    <div className="text-[10px] opacity-70 mt-0.5">
                      {new Date(d.date).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                    {d.count > 0 ? (
                      <span
                        className={`mt-2 inline-flex items-center justify-center rounded-full h-6 w-6 text-xs font-bold ${badgeColor(
                          d.day_label,
                        )}`}
                      >
                        {d.count}
                      </span>
                    ) : (
                      <div className="mt-2 text-xl font-semibold tabular-nums opacity-40">0</div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Expanded leads table */}
            {activeIdx != null && days[activeIdx] && (
              <div className="border-t border-border">
                <div className="px-5 py-3 flex items-center justify-between">
                  <p className="text-sm font-medium">
                    {days[activeIdx].day_label} —{" "}
                    <span className="text-muted-foreground">
                      {days[activeIdx].count} follow-up
                      {days[activeIdx].count === 1 ? "" : "s"}
                    </span>
                  </p>
                  <button
                    onClick={() => setActiveIdx(null)}
                    className="rounded-lg p-1.5 hover:bg-muted text-muted-foreground"
                    aria-label="Collapse"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {days[activeIdx].leads.length === 0 ? (
                  <div className="px-5 pb-5 text-sm text-muted-foreground italic">
                    Nothing scheduled.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/40 text-muted-foreground">
                        <tr className="text-left text-xs uppercase tracking-wide">
                          <th className="px-5 py-2.5 font-medium">Name</th>
                          <th className="px-4 py-2.5 font-medium">Area</th>
                          <th className="px-4 py-2.5 font-medium">Phone</th>
                          <th className="px-4 py-2.5 font-medium">AI Score</th>
                          <th className="px-4 py-2.5 font-medium text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {(days[activeIdx].leads as DayLead[]).map((l) => (
                          <tr
                            key={l.id}
                            className="hover:bg-muted/20 transition-colors"
                          >
                            <td className="px-5 py-3 font-medium truncate max-w-[180px]">
                              {l.name}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground truncate max-w-[120px]">
                              {l.area ?? "—"}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground tabular-nums">
                              {l.phone ? (
                                <a
                                  href={`tel:${l.phone}`}
                                  className="hover:text-primary hover:underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {l.phone}
                                </a>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <AiScoreBadge
                                label={l.ai_score_label as any}
                                score={l.ai_score}
                              />
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 gap-1.5 text-xs px-2.5 text-violet-700 border-violet-300 hover:bg-violet-50 hover:border-violet-400"
                                onClick={() =>
                                  setFollowUpTarget({ id: l.id, name: l.name })
                                }
                              >
                                <Mail className="h-3 w-3" />
                                Send Follow-up
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Inline follow-up email dialog */}
      {followUpTarget && (
        <FollowUpEmailDialog
          target={followUpTarget}
          onClose={() => setFollowUpTarget(null)}
        />
      )}
    </>
  );
}
