import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Mail,
  Send,
  ChevronDown,
  Loader2,
  AlertTriangle,
  X,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Inbox,
  RefreshCw,
  Paperclip,
} from "lucide-react";
import { toast } from "sonner";
import {
  emailApi,
  type EmailPreviewResponse,
  type Lead,
  type LeadEmail,
  type TemplateName,
} from "@/lib/api";

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

function fmtFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
import { Button } from "@/components/ui/button";

const TEMPLATE_OPTIONS: { value: TemplateName; label: string; desc: string }[] = [
  { value: "template_1", label: "Template 1", desc: "Introduce your platform & value prop" },
  { value: "template_2", label: "Template 2", desc: "Focus on ROI & cost savings" },
  { value: "template_3", label: "Template 3", desc: "Social proof & case studies" },
];

type Flow = "cold" | "followup" | null;

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}

function EmailTypePill({ type }: { type: string }) {
  const isCold = type === "cold";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide ${
        isCold
          ? "bg-sky-100 text-sky-700"
          : "bg-violet-100 text-violet-700"
      }`}
    >
      {isCold ? <Send className="h-2.5 w-2.5" /> : <RefreshCw className="h-2.5 w-2.5" />}
      {isCold ? "Cold" : "Follow-up"}
    </span>
  );
}

function StatusPill({ status }: { status?: string | null }) {
  if (!status) return null;
  if (status === "sent")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-[10px] font-semibold">
        <CheckCircle2 className="h-2.5 w-2.5" /> Sent
      </span>
    );
  if (status === "failed")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 text-rose-700 px-2 py-0.5 text-[10px] font-semibold">
        <XCircle className="h-2.5 w-2.5" /> Failed
      </span>
    );
  return (
    <span className="inline-flex items-center rounded-full bg-zinc-100 text-zinc-500 px-2 py-0.5 text-[10px] font-semibold capitalize">
      {status}
    </span>
  );
}

export function LeadEmailSection({ lead }: { lead: Lead }) {
  const qc = useQueryClient();

  const [flow, setFlow] = useState<Flow>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateName>("template_1");
  const [preview, setPreview] = useState<EmailPreviewResponse | null>(null);
  const [editSubject, setEditSubject] = useState("");
  const [editBody, setEditBody] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string | number>>(new Set());
  const [attachFile, setAttachFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const canSendCold = lead.status === "new" || lead.status === "called";
  const canSendFollowup = !!lead.last_contacted;

  const emailsQ = useQuery({
    queryKey: ["leads", "emails", lead.id],
    queryFn: async () => {
      const res = await emailApi.list(lead.id);
      return Array.isArray(res) ? res : (res as any).data ?? [];
    },
    enabled: !!lead.id,
  });
  const emails: LeadEmail[] = emailsQ.data ?? [];

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["leads", "emails", lead.id] });
    qc.invalidateQueries({ queryKey: ["leads", "detail", lead.id] });
    qc.invalidateQueries({ queryKey: ["leads", "timeline", lead.id] });
    qc.invalidateQueries({ queryKey: ["leads"] });
  };

  const previewMut = useMutation({
    mutationFn: async (f: "cold" | "followup") =>
      emailApi.preview(
        lead.id,
        f === "cold"
          ? { email_type: "cold", template_name: selectedTemplate }
          : { email_type: "followup" },
      ),
    onSuccess: (data) => {
      setPreview(data);
      setEditSubject(data.subject ?? "");
      setEditBody(data.body ?? "");
      setManualEmail(data.to_email ?? "");
    },
  });

  const sendMut = useMutation({
    mutationFn: () => {
      if (!preview) throw new Error("No preview");
      const payload = {
        email_id: preview.email_id,
        final_subject: editSubject,
        final_body: editBody,
        to_email: !preview.has_email ? (manualEmail || null) : null,
      };
      if (attachFile) return emailApi.sendWithFile(lead.id, payload, attachFile);
      return emailApi.send(lead.id, payload);
    },
    onSuccess: (data) => {
      const dateStr = data.follow_up_date
        ? new Date(data.follow_up_date).toLocaleDateString("en-KE", {
            day: "numeric", month: "short", year: "numeric",
          })
        : null;
      toast.success(dateStr ? `Email logged — follow-up set for ${dateStr}` : "Email sent");
      closeDialog();
      invalidate();
    },
    onError: (err: any) => toast.error(err?.message ?? "Failed to send email"),
  });

  const openFlow = (f: "cold" | "followup") => {
    setFlow(f);
    setPreview(null);
    setEditSubject("");
    setEditBody("");
    setManualEmail("");
  };

  const closeDialog = () => {
    setFlow(null);
    setPreview(null);
    setSelectedTemplate("template_1");
    setAttachFile(null);
    setFileError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    e.target.value = ""; // reset so same file can be re-selected
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      setFileError("File too large — maximum 5MB");
      return;
    }
    setFileError(null);
    setAttachFile(file);
  };

  const toggleExpand = (id: string | number) =>
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const step = !flow ? null : preview ? "compose" : "setup";

  return (
    <div className="space-y-6">

      {/* ── Action cards ── */}
      <div className="grid grid-cols-2 gap-3">
        {/* Cold email card */}
        <button
          onClick={() => openFlow("cold")}
          disabled={!canSendCold}
          className={`group relative flex flex-col items-start gap-3 rounded-2xl border p-4 text-left transition-all duration-150 ${
            canSendCold
              ? "border-sky-200 bg-gradient-to-br from-sky-50 to-white hover:border-sky-400 hover:shadow-md hover:shadow-sky-100 cursor-pointer"
              : "border-border bg-muted/30 opacity-50 cursor-not-allowed"
          }`}
        >
          <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${canSendCold ? "bg-sky-100 text-sky-600 group-hover:bg-sky-200" : "bg-muted text-muted-foreground"} transition-colors`}>
            <Send className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Cold Email</p>
            <p className="mt-0.5 text-xs text-muted-foreground leading-snug">
              {canSendCold ? "Start the conversation" : "Not available at this status"}
            </p>
          </div>
        </button>

        {/* Follow-up card */}
        <button
          onClick={() => openFlow("followup")}
          disabled={!canSendFollowup}
          className={`group relative flex flex-col items-start gap-3 rounded-2xl border p-4 text-left transition-all duration-150 ${
            canSendFollowup
              ? "border-violet-200 bg-gradient-to-br from-violet-50 to-white hover:border-violet-400 hover:shadow-md hover:shadow-violet-100 cursor-pointer"
              : "border-border bg-muted/30 opacity-50 cursor-not-allowed"
          }`}
        >
          <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${canSendFollowup ? "bg-violet-100 text-violet-600 group-hover:bg-violet-200" : "bg-muted text-muted-foreground"} transition-colors`}>
            <RefreshCw className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Follow-up</p>
            <p className="mt-0.5 text-xs text-muted-foreground leading-snug">
              {canSendFollowup
                ? `Last contacted ${formatDate(lead.last_contacted)}`
                : "Contact the lead first"}
            </p>
          </div>
        </button>
      </div>

      {/* ── Email history ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Sent emails
          </h4>
          {emailsQ.isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
        </div>

        {!emailsQ.isLoading && emails.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 py-10 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted mb-3">
              <Inbox className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">No emails sent yet</p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              Send a cold email or follow-up above
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {emails.map((em) => {
              const id = em.id;
              const ts = em.sent_at ?? em.created_at;
              const isOpen = expandedIds.has(id);
              return (
                <li key={id} className="rounded-2xl border border-border bg-card overflow-hidden transition-shadow hover:shadow-sm">
                  <button
                    className="w-full flex items-center gap-3 px-4 py-3 text-left"
                    onClick={() => toggleExpand(id)}
                  >
                    {/* icon */}
                    <div className={`shrink-0 flex h-8 w-8 items-center justify-center rounded-xl ${
                      em.email_type === "cold" ? "bg-sky-100 text-sky-600" : "bg-violet-100 text-violet-600"
                    }`}>
                      {em.email_type === "cold"
                        ? <Send className="h-3.5 w-3.5" />
                        : <RefreshCw className="h-3.5 w-3.5" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <EmailTypePill type={em.email_type} />
                        <StatusPill status={em.status} />
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {em.sent_by && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                            <User className="h-2.5 w-2.5" /> {em.sent_by}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Clock className="h-2.5 w-2.5" /> {formatDate(ts)}
                        </span>
                      </div>
                    </div>

                    <ChevronDown
                      className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 space-y-3 border-t border-border/50">
                      {em.subject && (
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">Subject</p>
                          <p className="text-sm font-medium">{em.subject}</p>
                        </div>
                      )}
                      {em.body && (
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">Body</p>
                          <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed bg-muted/30 rounded-xl p-3">
                            {em.body}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* ── Compose dialog ── */}
      {flow && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          onClick={closeDialog}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
          <div
            className="relative z-10 w-full max-w-xl bg-background rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Dialog header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
              {preview && (
                <button
                  onClick={() => setPreview(null)}
                  className="rounded-lg p-1.5 hover:bg-muted text-muted-foreground transition-colors"
                  aria-label="Back"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
              )}
              <div className="flex items-center gap-2 flex-1">
                <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${flow === "cold" ? "bg-sky-100 text-sky-600" : "bg-violet-100 text-violet-600"}`}>
                  {flow === "cold" ? <Send className="h-3.5 w-3.5" /> : <RefreshCw className="h-3.5 w-3.5" />}
                </div>
                <div>
                  <h3 className="font-semibold text-sm leading-none">
                    {flow === "cold" ? "Send Cold Email" : "Send Follow-up"}
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {step === "setup" ? "Step 1 of 2 — Configure" : "Step 2 of 2 — Review & send"}
                  </p>
                </div>
              </div>
              {/* step dots */}
              <div className="flex items-center gap-1.5 mr-2">
                <span className="h-1.5 w-4 rounded-full bg-primary" />
                <span className={`h-1.5 rounded-full transition-all duration-200 ${step === "compose" ? "w-4 bg-primary" : "w-1.5 bg-border"}`} />
              </div>
              <button
                onClick={closeDialog}
                className="rounded-lg p-1.5 hover:bg-muted text-muted-foreground transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
              {step === "setup" ? (
                <>
                  {flow === "cold" && (
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        Choose a template
                      </label>
                      <div className="space-y-2">
                        {TEMPLATE_OPTIONS.map((t) => {
                          const active = selectedTemplate === t.value;
                          return (
                            <button
                              key={t.value}
                              onClick={() => setSelectedTemplate(t.value)}
                              className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-100 ${
                                active
                                  ? "border-primary bg-primary/5 shadow-sm"
                                  : "border-border hover:border-muted-foreground/30 hover:bg-muted/30"
                              }`}
                            >
                              <div className={`h-4 w-4 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${active ? "border-primary bg-primary" : "border-muted-foreground/40"}`}>
                                {active && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                              </div>
                              <div>
                                <p className={`text-sm font-medium ${active ? "text-primary" : "text-foreground"}`}>{t.label}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{t.desc}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {flow === "followup" && (
                    <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4 flex items-start gap-3">
                      <RefreshCw className="h-4 w-4 text-violet-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-violet-900">AI-generated follow-up</p>
                        <p className="mt-1 text-xs text-violet-700 leading-relaxed">
                          We'll generate a personalised follow-up based on this lead's history and last interaction. You'll be able to review and edit before sending.
                        </p>
                      </div>
                    </div>
                  )}

                  {previewMut.isError && (
                    <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700 flex items-center gap-2">
                      <XCircle className="h-4 w-4 shrink-0" />
                      {(previewMut.error as any)?.message ?? "Failed to generate preview"}
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* No-email warning */}
                  {!preview!.has_email && (
                    <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 space-y-2.5">
                      <div className="flex items-center gap-2 text-sm font-medium text-amber-800">
                        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
                        No email address on file
                      </div>
                      <div>
                        <label className="text-xs text-amber-700">Enter recipient email</label>
                        <input
                          type="email"
                          value={manualEmail}
                          onChange={(e) => setManualEmail(e.target.value)}
                          placeholder="recipient@example.com"
                          className="mt-1.5 h-9 w-full rounded-lg border border-amber-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/40 placeholder:text-amber-400/70"
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
                      value={editSubject}
                      onChange={(e) => setEditSubject(e.target.value)}
                      className="h-9 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  {/* Body */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      Body
                    </label>
                    <textarea
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                      rows={11}
                      className="w-full rounded-xl border border-input bg-background p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 leading-relaxed"
                    />
                  </div>

                  {/* Attachment */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      Attachment <span className="normal-case font-normal text-muted-foreground/60">(optional · PDF, DOC, image · max 5 MB)</span>
                    </label>
                    {attachFile ? (
                      <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2">
                        <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="flex-1 text-sm truncate">{attachFile.name}</span>
                        <span className="text-xs text-muted-foreground shrink-0">{fmtFileSize(attachFile.size)}</span>
                        <button
                          onClick={() => { setAttachFile(null); setFileError(null); }}
                          className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          aria-label="Remove attachment"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border bg-muted/20 px-3 py-2 text-sm text-muted-foreground hover:border-muted-foreground/40 hover:bg-muted/40 transition-colors">
                        <Paperclip className="h-3.5 w-3.5 shrink-0" />
                        <span>Attach file</span>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.gif,.webp"
                          className="sr-only"
                          onChange={handleFileChange}
                        />
                      </label>
                    )}
                    {fileError && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <XCircle className="h-3 w-3 shrink-0" /> {fileError}
                      </p>
                    )}
                  </div>

                  {sendMut.isError && (
                    <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700 flex items-center gap-2">
                      <XCircle className="h-4 w-4 shrink-0" />
                      {(sendMut.error as any)?.message ?? "Failed to send email"}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Dialog footer */}
            <div className="flex items-center justify-between gap-2 px-5 py-4 border-t border-border bg-muted/20">
              <Button variant="ghost" size="sm" onClick={closeDialog} className="text-muted-foreground">
                Cancel
              </Button>
              {step === "setup" ? (
                <Button
                  size="sm"
                  onClick={() => previewMut.mutate(flow)}
                  disabled={previewMut.isPending}
                  className="gap-2 min-w-[130px]"
                >
                  {previewMut.isPending
                    ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating…</>
                    : <><Mail className="h-3.5 w-3.5" /> Preview email</>}
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => sendMut.mutate()}
                  disabled={
                    sendMut.isPending ||
                    !editBody.trim() ||
                    (!preview!.has_email && !manualEmail.trim())
                  }
                  className={`gap-2 min-w-[130px] ${flow === "cold" ? "bg-sky-600 hover:bg-sky-700" : "bg-violet-600 hover:bg-violet-700"}`}
                >
                  {sendMut.isPending
                    ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending…</>
                    : <><Send className="h-3.5 w-3.5" /> Confirm &amp; Send</>}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
