import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  X,
  ExternalLink,
  Loader2,
  Phone,
  Mail,
  MapPin,
  Globe,
  UserPlus,
  Sparkles,
  Pencil,
  Check,
  Calendar,
  Clock,
  Star,
  User,
  Tag,
  MessageSquarePlus,
  Activity,
} from "lucide-react";
import {
  getCurrentUser,
  leadsApi,
  STATUS_LABEL,
  STATUS_OPTIONS,
  type AiNoteResult,
  type Lead,
  type LeadNote,
  type LeadStatusApi,
  type LeadTimelineItem,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { LeadEmailSection } from "@/components/LeadEmailSection";

/* ─── helpers ──────────────────────────────────────────────── */

function relativeTime(iso?: string | null) {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const diff = Math.round((Date.now() - t) / 1000);
  if (diff < 45) return "just now";
  if (diff < 90) return "1 min ago";
  if (diff < 3600) return `${Math.round(diff / 60)} min ago`;
  if (diff < 7200) return "1 hour ago";
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
  if (diff < 172800) return "yesterday";
  if (diff < 2592000) return `${Math.round(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

const AI_LABEL_META: Record<string, { cls: string; dot: string; label: string }> = {
  LOW_HANGING_FRUIT: {
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
    label: "Low Hanging Fruit",
  },
  WARM_PROSPECT: {
    cls: "bg-sky-50 text-sky-700 border-sky-200",
    dot: "bg-sky-500",
    label: "Warm Prospect",
  },
  EXECUTIVE_LEAD: {
    cls: "bg-violet-50 text-violet-700 border-violet-200",
    dot: "bg-violet-500",
    label: "Executive Lead",
  },
  NURTURE: {
    cls: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-400",
    label: "Nurture",
  },
  NOT_QUALIFIED: {
    cls: "bg-zinc-100 text-zinc-500 border-zinc-200",
    dot: "bg-zinc-400",
    label: "Not Qualified",
  },
};

function aiMeta(label?: string | null) {
  if (!label) return AI_LABEL_META.NURTURE;
  return AI_LABEL_META[label] ?? {
    cls: "bg-primary/10 text-primary border-primary/20",
    dot: "bg-primary",
    label,
  };
}

const STATUS_DOT: Record<string, string> = {
  new: "bg-zinc-400",
  called: "bg-sky-500",
  contacted: "bg-sky-500", // legacy alias
  demo_booked: "bg-violet-500",
  won: "bg-emerald-500",
  lost: "bg-rose-400",
  not_interested: "bg-zinc-300",
};

/* ─── main component ────────────────────────────────────────── */

export function LeadDetailPanel({
  lead,
  onClose,
  defaultTab = "overview",
  defaultEmailFlow,
}: {
  lead: Lead | null;
  onClose: () => void;
  defaultTab?: "overview" | "activity" | "email";
  defaultEmailFlow?: "cold" | "followup";
}) {
  const qc = useQueryClient();
  const [me, setMe] = useState<import("@/lib/api").AuthUser | null>(null);
  useEffect(() => { setMe(getCurrentUser()); }, []);

  const open = !!lead;
  const [note, setNote] = useState("");
  const [aiResult, setAiResult] = useState<AiNoteResult | null>(null);
  const [showAllTimeline, setShowAllTimeline] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "activity" | "email">(defaultTab);

  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [open, onClose]);

  useEffect(() => {
    setNote("");
    setAiResult(null);
    setShowAllTimeline(false);
    setActiveTab(defaultTab);
  }, [lead?.id, defaultTab]);

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
    mutationFn: (status: LeadStatusApi) => leadsApi.updateStatus(lead!.id, status),
    onSuccess: invalidateLead,
  });
  const assignMut = useMutation({
    mutationFn: () => leadsApi.assign(lead!.id),
    onSuccess: (data) => {
      toast.success("Lead assigned to you");
      invalidateLead();
      qc.invalidateQueries({ queryKey: ["leads", "mine"] });
    },
    onError: (err: any) => toast.error(err?.message ?? "Failed to assign lead"),
  });
  const noteMut = useMutation({
    mutationFn: () => leadsApi.addNote(lead!.id, note.trim(), me?.name),
    onSuccess: (data) => { setNote(""); setAiResult(data ?? null); invalidateLead(); },
  });
  const contactMut = useMutation({
    mutationFn: (payload: { contact_person?: string | null; contact_person_role?: string | null }) =>
      leadsApi.updateContact(lead!.id, payload),
    onSuccess: invalidateLead,
  });

  if (!lead) return null;

  const lp: Lead = { ...(lead as Lead), ...(timelineQ.data?.lead ?? {}), ...(detailQ.data ?? {}) };
  const timeline: LeadTimelineItem[] = timelineQ.data?.timeline ?? [];
  const visibleTimeline = showAllTimeline || timeline.length <= 6 ? timeline : timeline.slice(0, 6);
  const hiddenCount = timeline.length - visibleTimeline.length;
  const notesRaw = notesQ.data as any;
  const notes: LeadNote[] = Array.isArray(notesRaw)
    ? notesRaw
    : (notesRaw?.data ?? notesRaw?.notes ?? []);

  const score = lp.score ?? (lp as any).ai_score ?? 0;
  const scoreLabel = (lp as any).ai_score_label as string | undefined;
  const meta = aiMeta(scoreLabel);
  const scoreColor =
    score >= 80 ? "text-emerald-600" : score >= 60 ? "text-amber-600" : "text-zinc-500";
  const avatarBg =
    score >= 80 ? "from-emerald-500 to-teal-600" :
    score >= 60 ? "from-amber-400 to-orange-500" :
    "from-zinc-400 to-zinc-500";

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end" onClick={onClose}>
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />

      {/* panel */}
      <div
        className="relative flex flex-col w-full md:w-[780px] lg:w-[860px] h-full bg-background shadow-2xl animate-in slide-in-from-right duration-250 ease-out"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Hero header ── */}
        <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 pt-5 pb-6 shrink-0">
          {/* close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 rounded-full p-1.5 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-start gap-4">
            {/* initials avatar */}
            <div className={`shrink-0 h-14 w-14 rounded-2xl bg-gradient-to-br ${avatarBg} flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
              {initials(lp.name)}
            </div>

            <div className="min-w-0 flex-1 pr-8">
              <h2 className="text-xl font-semibold text-white leading-tight truncate">{lp.name}</h2>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                {/* lead type */}
                <span className="inline-flex items-center gap-1 rounded-md bg-white/10 text-white/80 px-2 py-0.5 text-xs font-medium capitalize">
                  <Tag className="h-3 w-3" />
                  {lp.lead_type}
                </span>
                {/* area */}
                {lp.area && (
                  <span className="inline-flex items-center gap-1 text-white/60 text-xs">
                    <MapPin className="h-3 w-3" /> {lp.area}
                  </span>
                )}
                {/* ai label */}
                {scoreLabel && (
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${meta.cls}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                    {meta.label}
                  </span>
                )}
              </div>

              {/* score bar */}
              <div className="mt-3 flex items-center gap-3">
                <span className={`text-2xl font-bold tabular-nums ${scoreColor.replace("text-", "text-")} text-white`}>
                  {score}
                </span>
                <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      score >= 80 ? "bg-emerald-400" : score >= 60 ? "bg-amber-400" : "bg-zinc-400"
                    }`}
                    style={{ width: `${Math.min(100, score)}%` }}
                  />
                </div>
                <span className="text-xs text-white/40 tabular-nums">/ 100</span>
              </div>
            </div>
          </div>

          {/* action row */}
          <div className="mt-4 flex items-center gap-2">
            <select
              value={lp.status}
              disabled={statusMut.isPending}
              onChange={(e) => statusMut.mutate(e.target.value as LeadStatusApi)}
              className="h-9 flex-1 rounded-lg border border-white/20 bg-white/10 text-white text-sm px-3 focus:outline-none focus:ring-1 focus:ring-white/30"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s} className="text-foreground bg-background">
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>

            {lp.phone && (
              <a href={`tel:${lp.phone}`}>
                <Button size="sm" variant="ghost"
                  className="h-9 border border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white">
                  <Phone className="h-4 w-4 mr-1.5" /> Call
                </Button>
              </a>
            )}

            <Button
              size="sm"
              variant="ghost"
              onClick={() => assignMut.mutate()}
              disabled={assignMut.isPending}
              className="h-9 border border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
            >
              {assignMut.isPending
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <><UserPlus className="h-4 w-4 mr-1.5" /> Assign to me</>}
            </Button>
          </div>
        </div>

        {/* ── Tab bar ── */}
        <div className="flex border-b border-border bg-muted/30 shrink-0">
            {(["overview", "activity", "email"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "overview"
                ? <><User className="h-4 w-4" /> Overview</>
                : tab === "activity"
                ? <><Activity className="h-4 w-4" /> Activity</>
                : <><Mail className="h-4 w-4" /> Email</>}
            </button>
          ))}
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto">

          {/* ══ OVERVIEW TAB ══ */}
          {activeTab === "overview" && (
            <div className="p-6 space-y-6">

              {/* Contact details */}
              <section>
                <SectionHeader>Contact details</SectionHeader>
                <div className="grid grid-cols-2 gap-3">
                  <InfoChip icon={<Phone className="h-3.5 w-3.5" />} label="Phone">
                    {lp.phone
                      ? <a href={`tel:${lp.phone}`} className="text-primary hover:underline">{lp.phone}</a>
                      : <Dash />}
                  </InfoChip>
                  <InfoChip icon={<Mail className="h-3.5 w-3.5" />} label="Email">
                    {lp.email
                      ? <a href={`mailto:${lp.email}`} className="text-primary hover:underline truncate">{lp.email}</a>
                      : <Dash />}
                  </InfoChip>
                  <InfoChip icon={<MapPin className="h-3.5 w-3.5" />} label="Area">
                    {lp.area ?? <Dash />}
                  </InfoChip>
                  <InfoChip icon={<Globe className="h-3.5 w-3.5" />} label="Website">
                    {lp.website
                      ? <a
                          href={lp.website.startsWith("http") ? lp.website : `https://${lp.website}`}
                          target="_blank" rel="noreferrer"
                          className="text-primary hover:underline inline-flex items-center gap-1 truncate"
                        >
                          {lp.website.replace(/^https?:\/\//, "")} <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      : <Dash />}
                  </InfoChip>
                  <InfoChip icon={<User className="h-3.5 w-3.5" />} label="Assigned to">
                    {lp.assigned_to
                      ? <span className="font-medium">{lp.assigned_to}</span>
                      : <span className="text-muted-foreground italic text-xs">Unassigned</span>}
                  </InfoChip>
                  {lp.follow_up_date && (
                    <InfoChip icon={<Calendar className="h-3.5 w-3.5" />} label="Follow-up">
                      {new Date(lp.follow_up_date).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                    </InfoChip>
                  )}
                  {lp.last_contacted && (
                    <InfoChip icon={<Clock className="h-3.5 w-3.5" />} label="Last contacted">
                      {new Date(lp.last_contacted).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}
                      {lp.contact_attempts != null && (
                        <span className="ml-1 text-muted-foreground">· {lp.contact_attempts} attempts</span>
                      )}
                    </InfoChip>
                  )}
                  {lp.google_rating != null && (
                    <InfoChip icon={<Star className="h-3.5 w-3.5 text-amber-500" />} label="Google rating">
                      <span className="font-semibold">{lp.google_rating}</span>
                      {lp.review_count != null && (
                        <span className="ml-1 text-muted-foreground">({lp.review_count} reviews)</span>
                      )}
                    </InfoChip>
                  )}
                </div>
              </section>

              {/* Contact person */}
              <section>
                <SectionHeader>Contact person</SectionHeader>
                <div className="grid grid-cols-2 gap-3">
                  <InlineEditChip
                    label="Name"
                    value={lp.contact_person ?? ""}
                    placeholder="Add contact name"
                    saving={contactMut.isPending}
                    onSave={(v) => contactMut.mutate({ contact_person: v || null })}
                  />
                  <InlineEditChip
                    label="Role"
                    value={lp.contact_person_role ?? ""}
                    placeholder="Add their role"
                    saving={contactMut.isPending}
                    onSave={(v) => contactMut.mutate({ contact_person_role: v || null })}
                  />
                </div>
              </section>

              {/* AI insight */}
              {(scoreLabel || lp.ai_score_reason) && (
                <section>
                  <SectionHeader>AI insight</SectionHeader>
                  <div className={`rounded-xl border p-4 ${meta.cls}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4" />
                      <span className="font-semibold text-sm">{meta.label}</span>
                      {score > 0 && (
                        <span className="ml-auto text-xs font-bold tabular-nums opacity-70">Score {score}</span>
                      )}
                    </div>
                    {lp.ai_score_reason && (
                      <p className="text-sm leading-relaxed opacity-90">{lp.ai_score_reason}</p>
                    )}
                  </div>
                </section>
              )}

              {/* Log a note */}
              <section>
                <SectionHeader icon={<MessageSquarePlus className="h-4 w-4" />}>Log a note</SectionHeader>
                <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="What happened on this call? The AI will re-score the lead after you save."
                    rows={4}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={() => noteMut.mutate()}
                      disabled={!note.trim() || noteMut.isPending}
                    >
                      {noteMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
                      Save note
                    </Button>
                  </div>

                  {/* AI result after saving */}
                  {aiResult && (
                    <div className={`rounded-lg border p-3 animate-in fade-in slide-in-from-top-1 duration-300 ${aiMeta(aiResult.ai_score_label).cls}`}>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold">
                          <Sparkles className="h-3.5 w-3.5" />
                          {aiMeta(aiResult.ai_score_label).label}
                        </span>
                        {aiResult.ai_score != null && (
                          <span className="text-xs tabular-nums font-bold">Score {aiResult.ai_score}</span>
                        )}
                      </div>
                      {aiResult.ai_score_reason && (
                        <p className="text-xs leading-relaxed opacity-90">{aiResult.ai_score_reason}</p>
                      )}
                      {aiResult.follow_up_date && (
                        <p className="mt-1.5 text-xs font-medium">
                          Follow up by {new Date(aiResult.follow_up_date).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}
                        </p>
                      )}
                      {aiResult.signals && aiResult.signals.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {aiResult.signals.map((s, i) => (
                            <span key={i} className="inline-flex items-center rounded bg-black/5 px-1.5 py-0.5 text-[10px] font-medium">
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </section>

              {/* Notes history */}
              {notes.length > 0 && (
                <section>
                  <SectionHeader>Notes ({notes.length})</SectionHeader>
                  <div className="space-y-3">
                    {notes.map((n, i) => (
                      <NoteCard key={n.id ?? i} note={n} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}

          {/* ══ ACTIVITY TAB ══ */}
          {activeTab === "activity" && (
            <div className="p-6">
              <SectionHeader icon={<Activity className="h-4 w-4" />}>Timeline</SectionHeader>

              {timelineQ.isLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-8">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading activity…
                </div>
              ) : timeline.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                  <Activity className="h-10 w-10 mb-3 opacity-20" />
                  <p className="text-sm">No activity yet</p>
                  <p className="text-xs mt-1 opacity-70">Log a note on the Overview tab to start</p>
                </div>
              ) : (
                <>
                  <ol className="space-y-1">
                    {visibleTimeline.map((t, i) => (
                      <TimelineItem key={i} item={t} last={i === visibleTimeline.length - 1 && hiddenCount === 0} />
                    ))}
                  </ol>
                  {hiddenCount > 0 && (
                    <button
                      onClick={() => setShowAllTimeline(true)}
                      className="mt-4 text-xs text-primary hover:underline font-medium flex items-center gap-1"
                    >
                      Show {hiddenCount} older event{hiddenCount !== 1 ? "s" : ""}
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          {/* ══ EMAIL TAB ══ */}
          {activeTab === "email" && (
            <div className="px-6 py-5">
              <LeadEmailSection lead={lp} autoFlow={defaultEmailFlow} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── small UI pieces ───────────────────────────────────────── */

function SectionHeader({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {icon && <span className="text-muted-foreground">{icon}</span>}
      <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{children}</h4>
    </div>
  );
}

function Dash() {
  return <span className="text-muted-foreground/50">—</span>;
}

function InfoChip({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 px-4 py-3 min-w-0">
      <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-sm font-medium truncate">{children}</div>
    </div>
  );
}

function InlineEditChip({
  label,
  value,
  placeholder,
  saving,
  onSave,
}: {
  label: string;
  value: string;
  placeholder: string;
  saving: boolean;
  onSave: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  useEffect(() => { setDraft(value); }, [value]);

  const commit = () => {
    if (draft.trim() !== (value ?? "").trim()) onSave(draft.trim());
    setEditing(false);
  };

  return (
    <div className="rounded-xl border border-border bg-muted/20 px-4 py-3 min-w-0">
      <div className="flex items-center justify-between text-muted-foreground mb-1">
        <span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span>
        {!editing && (
          <button onClick={() => setEditing(true)} className="opacity-0 group-hover:opacity-100 hover:text-primary">
            <Pencil className="h-3 w-3" />
          </button>
        )}
      </div>
      {editing ? (
        <div className="flex items-center gap-1.5">
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") { setDraft(value); setEditing(false); }
            }}
            className="h-7 flex-1 rounded border border-input bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
          <button
            onClick={commit}
            disabled={saving}
            className="rounded p-1 text-emerald-600 hover:bg-muted"
            aria-label="Save"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          </button>
        </div>
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="group flex items-center gap-1.5 text-sm font-medium text-left w-full hover:text-primary"
        >
          <span className={value ? "" : "text-muted-foreground italic font-normal text-xs"}>
            {value || placeholder}
          </span>
          <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-50 shrink-0" />
        </button>
      )}
    </div>
  );
}

function NoteCard({ note: n }: { note: LeadNote }) {
  const meta = aiMeta(n.ai_score_label);
  return (
    <div className="rounded-xl border border-border bg-card p-4 relative">
      {n.ai_score_label && (
        <span className={`absolute top-3 right-3 inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${meta.cls}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
          {meta.label}
        </span>
      )}
      <p className="text-sm leading-relaxed whitespace-pre-wrap pr-28">{n.note}</p>
      {n.ai_score_reason && (
        <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{n.ai_score_reason}</p>
      )}
      <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
        <span className="font-medium text-foreground/70">{n.created_by ?? "Unknown"}</span>
        <span>·</span>
        <span>{relativeTime(n.created_at)}</span>
      </div>
    </div>
  );
}

function TimelineItem({ item, last }: { item: LeadTimelineItem; last: boolean }) {
  const ts = item.timestamp || item.created_at;

  const isNote = item.type !== "event";
  const isAssigned = item.type === "event" && item.event_type === "assigned";

  const dotColor = isAssigned
    ? "bg-violet-500 ring-violet-200"
    : isNote
    ? "bg-sky-500 ring-sky-200"
    : "bg-emerald-500 ring-emerald-200";

  return (
    <li className="relative flex gap-4 pb-6">
      {/* vertical line */}
      {!last && (
        <div className="absolute left-[11px] top-5 bottom-0 w-px bg-border" />
      )}

      {/* dot */}
      <div className={`mt-1 shrink-0 h-[22px] w-[22px] rounded-full ${dotColor} ring-4 flex items-center justify-center`}>
        {isNote ? (
          <MessageSquarePlus className="h-3 w-3 text-white" />
        ) : isAssigned ? (
          <UserPlus className="h-3 w-3 text-white" />
        ) : (
          <Activity className="h-3 w-3 text-white" />
        )}
      </div>

      {/* content */}
      <div className="flex-1 min-w-0 pt-0.5">
        {isAssigned ? (
          <p className="text-sm">
            Lead assigned to{" "}
            <span className="font-semibold">{item.to_value ?? "—"}</span>
          </p>
        ) : !isNote ? (
          <p className="text-sm">
            <span className="font-medium">{item.changed_by ?? "Someone"}</span>
            {" moved "}
            <span className="font-semibold">{item.from_value ?? "—"}</span>
            {" → "}
            <span className="font-semibold">{item.to_value ?? "—"}</span>
          </p>
        ) : (
          <div className="rounded-xl border border-border bg-card p-3.5">
            {item.ai_score_label && (
              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold mb-2 ${aiMeta(item.ai_score_label).cls}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${aiMeta(item.ai_score_label).dot}`} />
                {aiMeta(item.ai_score_label).label}
              </span>
            )}
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{item.note}</p>
            {item.ai_score_reason && (
              <p className="mt-1.5 text-xs text-muted-foreground">{item.ai_score_reason}</p>
            )}
            {item.signals && item.signals.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {item.signals.map((s, i) => (
                  <span key={i} className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-1.5 text-[11px] text-muted-foreground">
          {!isNote && item.changed_by && (
            <span className="font-medium text-foreground/60 mr-1">{item.changed_by} ·</span>
          )}
          {relativeTime(ts)}
        </div>
      </div>
    </li>
  );
}
