import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  X,
  ExternalLink,
  Loader2,
  Phone,
  UserPlus,
  Sparkles,
  ArrowRight,
  Pencil,
  User as UserIcon,
} from "lucide-react";
import {
  getCurrentUser,
  leadsApi,
  STATUS_LABEL,
  STATUS_OPTIONS,
  type AiNoteResult,
  type Lead,
  type LeadStatusApi,
  type LeadTimelineItem,
} from "@/lib/api";
import { ScorePill } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";

function relativeTime(iso?: string | null) {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const diff = Math.round((Date.now() - t) / 1000);
  if (diff < 45) return "just now";
  if (diff < 90) return "1 minute ago";
  if (diff < 3600) return `${Math.round(diff / 60)} minutes ago`;
  if (diff < 7200) return "1 hour ago";
  if (diff < 86400) return `${Math.round(diff / 3600)} hours ago`;
  if (diff < 172800) return "1 day ago";
  if (diff < 2592000) return `${Math.round(diff / 86400)} days ago`;
  return new Date(iso).toLocaleDateString();
}

const AI_LABEL_STYLES: Record<string, string> = {
  LOW_HANGING_FRUIT: "bg-success/15 text-success border-success/30",
  WARM_PROSPECT: "bg-info/10 text-info border-info/20",
  EXECUTIVE_LEAD: "bg-primary/10 text-primary border-primary/20",
  NURTURE: "bg-warning/15 text-warning-foreground border-warning/30",
  NOT_QUALIFIED: "bg-muted text-muted-foreground border-border",
};

function aiLabelClasses(label?: string | null) {
  if (!label) return AI_LABEL_STYLES.NURTURE;
  return AI_LABEL_STYLES[label] ?? "bg-primary/10 text-primary border-primary/20";
}

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
  const [aiResult, setAiResult] = useState<AiNoteResult | null>(null);

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
    setAiResult(null);
  }, [lead?.id]);

  const timelineQ = useQuery({
    queryKey: ["leads", "timeline", lead?.id],
    queryFn: () => leadsApi.timeline(lead!.id),
    enabled: !!lead?.id,
  });

  const detailQ = useQuery({
    queryKey: ["leads", "detail", lead?.id],
    queryFn: () => leadsApi.get(lead!.id),
    enabled: !!lead?.id,
  });

  const notesQ = useQuery({
    queryKey: ["leads", "notes", lead?.id],
    queryFn: () => leadsApi.notes(lead!.id),
    enabled: !!lead?.id,
  });

  const invalidateLead = () => {
    qc.invalidateQueries({ queryKey: ["leads", "timeline", lead?.id] });
    qc.invalidateQueries({ queryKey: ["leads", "detail", lead?.id] });
    qc.invalidateQueries({ queryKey: ["leads", "notes", lead?.id] });
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
    onSuccess: (data) => {
      setNote("");
      setAiResult(data ?? null);
      invalidateLead();
    },
  });

  if (!lead) return null;

  const lp: Lead = { ...(lead as Lead), ...(timelineQ.data?.lead ?? {}), ...(detailQ.data ?? {}) };
  const timeline: LeadTimelineItem[] = timelineQ.data?.timeline ?? [];
  const notesRaw = notesQ.data as any;
  const notes: import("@/lib/api").LeadNote[] = Array.isArray(notesRaw)
    ? notesRaw
    : (notesRaw?.data ?? notesRaw?.notes ?? []);


  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="absolute right-0 top-0 h-full w-full sm:w-[560px] bg-background border-l border-border shadow-xl flex flex-col animate-in slide-in-from-right duration-200"
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
            <Field label="Email">{lp.email ?? "—"}</Field>
            {lp.follow_up_date && (
              <Field label="Follow-up">
                {new Date(lp.follow_up_date).toLocaleDateString()}
              </Field>
            )}
            {lp.last_contacted && (
              <Field label="Last contacted">
                {new Date(lp.last_contacted).toLocaleDateString()}
                {lp.contact_attempts != null && (
                  <span className="text-muted-foreground"> · {lp.contact_attempts} attempts</span>
                )}
              </Field>
            )}
            {lp.google_rating != null && (
              <Field label="Google rating">
                ★ {lp.google_rating}
                {lp.review_count != null && (
                  <span className="text-muted-foreground"> ({lp.review_count} reviews)</span>
                )}
              </Field>
            )}
          </div>

          {lp.ai_score_reason && (
            <div className="mt-3 rounded-lg bg-muted/40 border border-border p-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1 text-foreground font-medium mr-1">
                <Sparkles className="h-3 w-3 text-primary" /> AI:
              </span>
              {lp.ai_score_reason}
            </div>
          )}


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

          {aiResult && (
            <div className="rounded-xl border border-border bg-card p-3 shadow-sm animate-in fade-in slide-in-from-top-1 duration-300">
              <div className="flex items-start justify-between gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-sm font-semibold ${aiLabelClasses(
                    aiResult.ai_score_label,
                  )}`}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {aiResult.ai_score_label ?? "SCORED"}
                </span>
                {aiResult.ai_score != null && (
                  <span className="text-xs tabular-nums text-muted-foreground">
                    Score {aiResult.ai_score}
                  </span>
                )}
              </div>
              {aiResult.ai_score_reason && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {aiResult.ai_score_reason}
                </p>
              )}
              {aiResult.follow_up_date && (
                <p className="mt-2 text-xs font-medium">
                  Follow up by{" "}
                  {new Date(aiResult.follow_up_date).toLocaleDateString()}
                </p>
              )}
              {aiResult.signals && aiResult.signals.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {aiResult.signals.map((s, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center rounded-md bg-muted text-muted-foreground px-2 py-0.5 text-[11px]"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {notes.length > 0 && (
            <div className="pt-3 space-y-2">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Notes history
              </div>
              <ul className="space-y-2">
                {notes.map((n, i) => (
                  <li
                    key={n.id ?? i}
                    className="rounded-lg border border-border bg-card p-3 relative"
                  >
                    {n.ai_score_label && (
                      <span
                        className={`absolute top-2 right-2 inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold ${aiLabelClasses(
                          n.ai_score_label,
                        )}`}
                      >
                        <Sparkles className="h-3 w-3" />
                        {n.ai_score_label}
                      </span>
                    )}
                    <div className="text-sm whitespace-pre-wrap pr-24">{n.note}</div>
                    {n.ai_score_reason && (
                      <div className="mt-1.5 text-xs text-muted-foreground">
                        {n.ai_score_reason}
                      </div>
                    )}
                    <div className="mt-2 text-[11px] text-muted-foreground">
                      {n.created_by ?? "—"} · {relativeTime(n.created_at)}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
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
            <ol className="relative pl-8 space-y-4 before:content-[''] before:absolute before:left-3 before:top-1 before:bottom-1 before:w-0.5 before:bg-success/40">
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

function TimelineIcon({
  variant,
}: {
  variant: "status" | "note" | "assigned";
}) {
  const style =
    variant === "status"
      ? "bg-success text-white"
      : variant === "note"
        ? "bg-info text-white"
        : "bg-primary text-white";
  const Icon =
    variant === "status" ? ArrowRight : variant === "note" ? Pencil : UserIcon;
  return (
    <span
      className={`absolute -left-8 top-0 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-background ${style}`}
    >
      <Icon className="h-3 w-3" />
    </span>
  );
}

function TimelineItem({ item }: { item: LeadTimelineItem }) {
  const ts = item.timestamp || item.created_at;
  const when = relativeTime(ts);

  if (item.type === "event") {
    if (item.event_type === "assigned") {
      return (
        <li className="relative text-sm">
          <TimelineIcon variant="assigned" />
          <div>
            Lead assigned to <span className="font-semibold">{item.to_value ?? "—"}</span>
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">{when}</div>
        </li>
      );
    }
    // status_change or fallback
    return (
      <li className="relative text-sm">
        <TimelineIcon variant="status" />
        <div>
          <span className="font-medium">{item.changed_by ?? "Someone"}</span>{" "}
          moved{" "}
          <span className="font-semibold">{item.from_value ?? "—"}</span>
          {" → "}
          <span className="font-semibold">{item.to_value ?? "—"}</span>
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">{when}</div>
      </li>
    );
  }

  // note
  return (
    <li className="relative">
      <TimelineIcon variant="note" />
      <div className="rounded-lg border border-border bg-card p-3 shadow-sm relative">
        {item.ai_score_label && (
          <span
            className={`absolute top-2 right-2 inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold ${aiLabelClasses(
              item.ai_score_label,
            )}`}
          >
            <Sparkles className="h-3 w-3" />
            {item.ai_score_label}
          </span>
        )}
        <div className="text-sm whitespace-pre-wrap pr-24">{item.note}</div>
        {item.ai_score_reason && (
          <div className="mt-1.5 text-xs text-muted-foreground">
            {item.ai_score_reason}
          </div>
        )}
        {item.signals && item.signals.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {item.signals.map((s, i) => (
              <span
                key={i}
                className="inline-flex items-center rounded-md bg-muted text-muted-foreground px-1.5 py-0.5 text-[10px]"
              >
                {s}
              </span>
            ))}
          </div>
        )}
        <div className="mt-2 text-[11px] text-muted-foreground">
          {item.created_by ?? "—"} · {when}
        </div>
      </div>
    </li>
  );
}
