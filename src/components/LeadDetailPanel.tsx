import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X, ExternalLink, Loader2, Phone, UserPlus, Sparkles } from "lucide-react";
import {
  getCurrentUser,
  leadsApi,
  STATUS_LABEL,
  STATUS_OPTIONS,
  type Lead,
  type LeadStatusApi,
  type LeadTimelineItem,
} from "@/lib/api";
import { ScorePill } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";

export function LeadDetailPanel({
  lead,
  onClose,
}: {
  lead: Lead | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const me = getCurrentUser();
  const open = !!lead;
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    setNote("");
  }, [lead?.id]);

  const timelineQ = useQuery({
    queryKey: ["leads", "timeline", lead?.id],
    queryFn: () => leadsApi.timeline(lead!.id),
    enabled: !!lead?.id,
  });

  const invalidateLead = () => {
    qc.invalidateQueries({ queryKey: ["leads", "timeline", lead?.id] });
    qc.invalidateQueries({ queryKey: ["leads"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const statusMut = useMutation({
    mutationFn: (status: LeadStatusApi) =>
      leadsApi.updateStatus(lead!.id, status),
    onSuccess: invalidateLead,
  });

  const assignMut = useMutation({
    mutationFn: () => leadsApi.assign(lead!.id, me?.name ?? me?.id),
    onSuccess: invalidateLead,
  });

  const noteMut = useMutation({
    mutationFn: () => leadsApi.addNote(lead!.id, note.trim(), me?.name),
    onSuccess: () => {
      setNote("");
      invalidateLead();
    },
  });

  if (!lead) return null;

  const lp: Lead = timelineQ.data?.lead ?? lead;
  const timeline: LeadTimelineItem[] = timelineQ.data?.timeline ?? [];

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="absolute right-0 top-0 h-full w-full sm:w-[520px] bg-background border-l border-border shadow-xl flex flex-col animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top: profile */}
        <div className="px-5 py-4 border-b border-border">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-semibold text-lg leading-tight truncate">{lp.name}</h3>
              <div className="mt-1 flex items-center gap-2 flex-wrap">
                <ScorePill score={lp.score ?? 0} />
                {(lp as any).ai_score_label && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 text-primary px-2 py-0.5 text-xs font-medium">
                    <Sparkles className="h-3 w-3" /> {(lp as any).ai_score_label}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-md p-1.5 hover:bg-muted text-muted-foreground"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <Field label="Phone">
              {lp.phone ? (
                <a href={`tel:${lp.phone}`} className="text-info inline-flex items-center gap-1 hover:underline">
                  <Phone className="h-3 w-3" /> {lp.phone}
                </a>
              ) : (
                "—"
              )}
            </Field>
            <Field label="Area">{lp.area ?? "—"}</Field>
            <Field label="Type">{lp.lead_type}</Field>
            <Field label="Assigned">{lp.assigned_to ?? "Unassigned"}</Field>
            <Field label="Website">
              {lp.website ? (
                <a
                  href={lp.website.startsWith("http") ? lp.website : `https://${lp.website}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-info inline-flex items-center gap-1 hover:underline truncate"
                >
                  {lp.website} <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                "—"
              )}
            </Field>
            {(lp as any).follow_up_date && (
              <Field label="Follow-up">
                {new Date((lp as any).follow_up_date).toLocaleDateString()}
              </Field>
            )}
          </div>

          <div className="mt-4 flex items-center gap-2">
            <select
              value={lp.status}
              disabled={statusMut.isPending}
              onChange={(e) => statusMut.mutate(e.target.value as LeadStatusApi)}
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm flex-1"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{STATUS_LABEL[s]}</option>
              ))}
            </select>
            <Button
              size="sm"
              variant="outline"
              onClick={() => assignMut.mutate()}
              disabled={assignMut.isPending}
            >
              {assignMut.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4 mr-1" />
              )}
              Assign to me
            </Button>
          </div>
        </div>

        {/* Middle: add note */}
        <div className="px-5 py-4 border-b border-border space-y-2">
          <div className="text-sm font-medium">Add a note</div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What happened on this call?"
            rows={3}
            className="w-full rounded-lg border border-input bg-background p-3 text-sm resize-none"
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={() => noteMut.mutate()}
              disabled={!note.trim() || noteMut.isPending}
            >
              {noteMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              Save Note
            </Button>
          </div>
        </div>

        {/* Bottom: timeline */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="text-sm font-medium mb-3">Activity</div>
          {timelineQ.isLoading ? (
            <div className="text-sm text-muted-foreground">Loading timeline…</div>
          ) : timeline.length === 0 ? (
            <div className="text-sm text-muted-foreground italic">
              No activity yet — be the first to log a call
            </div>
          ) : (
            <ol className="space-y-3">
              {timeline.map((t, i) => (
                <TimelineItem key={i} item={t} />
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-sm mt-0.5 truncate">{children}</div>
    </div>
  );
}

function TimelineItem({ item }: { item: LeadTimelineItem }) {
  const ts = item.timestamp || item.created_at;
  const when = ts ? new Date(ts).toLocaleString() : "";

  if (item.type === "event") {
    let text: React.ReactNode = null;
    if (item.event_type === "status_change") {
      text = (
        <>
          <span className="font-medium">{item.changed_by ?? "Someone"}</span>{" "}
          moved from{" "}
          <span className="font-medium">{item.from_value ?? "—"}</span>{" "}
          → <span className="font-medium">{item.to_value ?? "—"}</span>
        </>
      );
    } else if (item.event_type === "assigned") {
      text = (
        <>
          Lead assigned to <span className="font-medium">{item.to_value ?? "—"}</span>
        </>
      );
    } else {
      text = <span className="text-muted-foreground">{item.event_type}</span>;
    }
    return (
      <li className="text-sm">
        <div>{text}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{when}</div>
      </li>
    );
  }

  // note
  return (
    <li className="rounded-lg border border-border bg-card p-3 shadow-sm">
      <div className="text-sm whitespace-pre-wrap">{item.note}</div>
      {(item.ai_score_label || item.ai_score_reason) && (
        <div className="mt-2 flex items-start gap-2">
          {item.ai_score_label && (
            <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 text-primary px-2 py-0.5 text-[11px] font-medium">
              <Sparkles className="h-3 w-3" /> {item.ai_score_label}
            </span>
          )}
          {item.ai_score_reason && (
            <span className="text-xs text-muted-foreground">{item.ai_score_reason}</span>
          )}
        </div>
      )}
      <div className="mt-2 text-[11px] text-muted-foreground">
        {item.created_by ?? "—"} · {when}
      </div>
    </li>
  );
}
