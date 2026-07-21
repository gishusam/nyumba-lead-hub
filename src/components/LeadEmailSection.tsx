import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Mail,
  Send,
  ChevronDown,
  ChevronRight,
  Loader2,
  AlertTriangle,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  emailApi,
  type EmailPreviewResponse,
  type Lead,
  type LeadEmail,
  type TemplateName,
} from "@/lib/api";
import { Button } from "@/components/ui/button";

const TEMPLATE_OPTIONS: { value: TemplateName; label: string }[] = [
  { value: "template_1", label: "Template 1" },
  { value: "template_2", label: "Template 2" },
  { value: "template_3", label: "Template 3" },
];

type Flow = "cold" | "followup" | null;

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function EmailTypeBadge({ type }: { type: string }) {
  const label = type === "cold" ? "Cold" : "Follow-up";
  const cls =
    type === "cold"
      ? "bg-info/10 text-info border-info/20"
      : "bg-primary/10 text-primary border-primary/20";
  return (
    <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${cls}`}>
      {label}
    </span>
  );
}

function StatusBadge({ status }: { status?: string | null }) {
  if (!status) return null;
  const cls =
    status === "sent"
      ? "bg-success/15 text-success border-success/30"
      : status === "failed"
        ? "bg-destructive/10 text-destructive border-destructive/20"
        : "bg-muted text-muted-foreground border-border";
  return (
    <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium capitalize ${cls}`}>
      {status}
    </span>
  );
}

export function LeadEmailSection({ lead }: { lead: Lead }) {
  const qc = useQueryClient();

  // Flow state
  const [flow, setFlow] = useState<Flow>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateName>("template_1");

  // Preview dialog state
  const [preview, setPreview] = useState<EmailPreviewResponse | null>(null);
  const [editSubject, setEditSubject] = useState("");
  const [editBody, setEditBody] = useState("");
  const [manualEmail, setManualEmail] = useState("");

  // History expansion
  const [expandedIds, setExpandedIds] = useState<Set<string | number>>(new Set());

  const canSendCold = lead.status === "new" || lead.status === "called";
  const canSendFollowup = !!lead.last_contacted;

  // Email history
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

  // Preview mutation
  const previewMut = useMutation({
    mutationFn: async (f: "cold" | "followup") => {
      const payload =
        f === "cold"
          ? { email_type: "cold" as const, template_name: selectedTemplate }
          : { email_type: "followup" as const };
      return emailApi.preview(lead.id, payload);
    },
    onSuccess: (data) => {
      setPreview(data);
      setEditSubject(data.subject ?? "");
      setEditBody(data.body ?? "");
      setManualEmail(data.to_email ?? "");
    },
  });

  // Send mutation
  const sendMut = useMutation({
    mutationFn: () => {
      if (!preview) throw new Error("No preview");
      return emailApi.send(lead.id, {
        email_id: preview.email_id,
        final_subject: editSubject,
        final_body: editBody,
        to_email: !preview.has_email ? (manualEmail || null) : null,
      });
    },
    onSuccess: (data) => {
      const dateStr = data.follow_up_date
        ? new Date(data.follow_up_date).toLocaleDateString(undefined, {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : null;
      toast.success(
        dateStr
          ? `Email logged — follow-up set for ${dateStr}`
          : "Email sent successfully",
      );
      closeDialog();
      invalidate();
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Failed to send email");
    },
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
  };

  const handlePreview = () => {
    if (!flow) return;
    previewMut.mutate(flow);
  };

  const toggleExpand = (id: string | number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="px-5 py-4 border-b border-border space-y-3">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <Mail className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Email</span>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        {canSendCold && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => openFlow("cold")}
            className="gap-1.5"
          >
            <Send className="h-3.5 w-3.5" />
            Send Cold Email
          </Button>
        )}
        {canSendFollowup && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => openFlow("followup")}
            className="gap-1.5"
          >
            <Mail className="h-3.5 w-3.5" />
            Send Follow-up
          </Button>
        )}
        {!canSendCold && !canSendFollowup && (
          <p className="text-xs text-muted-foreground italic">
            No email actions available for this lead's current status.
          </p>
        )}
      </div>

      {/* Email history */}
      {emailsQ.isLoading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" /> Loading email history…
        </div>
      ) : emails.length > 0 ? (
        <div className="space-y-1">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
            Email history
          </div>
          <ul className="space-y-1">
            {emails.map((em) => {
              const id = em.id;
              const ts = em.sent_at ?? em.created_at;
              const isOpen = expandedIds.has(id);
              return (
                <li key={id} className="rounded-lg border border-border bg-card overflow-hidden">
                  <button
                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted/50 transition-colors"
                    onClick={() => toggleExpand(id)}
                  >
                    {isOpen ? (
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    )}
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatDate(ts)}
                    </span>
                    <EmailTypeBadge type={em.email_type} />
                    {em.sent_by && (
                      <span className="text-xs text-muted-foreground truncate flex-1">
                        {em.sent_by}
                      </span>
                    )}
                    <StatusBadge status={em.status} />
                  </button>
                  {isOpen && (
                    <div className="px-3 pb-3 space-y-1.5 border-t border-border/50 pt-2">
                      {em.subject && (
                        <div>
                          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                            Subject
                          </span>
                          <p className="text-sm font-medium">{em.subject}</p>
                        </div>
                      )}
                      {em.body && (
                        <div>
                          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                            Body
                          </span>
                          <p className="text-xs text-muted-foreground whitespace-pre-wrap mt-0.5">
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
        </div>
      ) : null}

      {/* Flow dialog / overlay */}
      {flow && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          onClick={closeDialog}
        >
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="relative z-10 w-full max-w-lg bg-background rounded-xl border border-border shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Dialog header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="font-semibold text-base">
                {flow === "cold" ? "Send Cold Email" : "Send Follow-up"}
              </h3>
              <button
                onClick={closeDialog}
                className="rounded-md p-1.5 hover:bg-muted text-muted-foreground"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {!preview ? (
                /* Step 1: template selector (cold only) + fetch preview */
                <>
                  {flow === "cold" && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Select template</label>
                      <div className="flex gap-2">
                        {TEMPLATE_OPTIONS.map((t) => (
                          <button
                            key={t.value}
                            onClick={() => setSelectedTemplate(t.value)}
                            className={`flex-1 rounded-lg border px-3 py-2 text-sm transition-colors ${
                              selectedTemplate === t.value
                                ? "border-primary bg-primary/10 text-primary font-medium"
                                : "border-border hover:bg-muted"
                            }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {flow === "followup" && (
                    <p className="text-sm text-muted-foreground">
                      A follow-up email will be generated based on this lead's history.
                    </p>
                  )}

                  {previewMut.isError && (
                    <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
                      {(previewMut.error as any)?.message ?? "Failed to generate preview"}
                    </div>
                  )}
                </>
              ) : (
                /* Step 2: editable preview */
                <>
                  {/* No-email warning + manual input */}
                  {!preview.has_email && (
                    <div className="rounded-lg bg-warning/10 border border-warning/30 px-3 py-2.5 space-y-2">
                      <div className="flex items-center gap-1.5 text-sm text-warning-foreground font-medium">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        No email found for this lead
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">
                          Enter email address to send to
                        </label>
                        <input
                          type="email"
                          value={manualEmail}
                          onChange={(e) => setManualEmail(e.target.value)}
                          placeholder="recipient@example.com"
                          className="mt-1 h-8 w-full rounded-md border border-input bg-background px-2.5 text-sm"
                        />
                      </div>
                    </div>
                  )}

                  {/* Subject */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={editSubject}
                      onChange={(e) => setEditSubject(e.target.value)}
                      className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
                    />
                  </div>

                  {/* Body */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Body
                    </label>
                    <textarea
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                      rows={10}
                      className="w-full rounded-lg border border-input bg-background p-3 text-sm resize-none"
                    />
                  </div>

                  {sendMut.isError && (
                    <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
                      {(sendMut.error as any)?.message ?? "Failed to send email"}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Dialog footer */}
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border">
              <Button variant="outline" size="sm" onClick={closeDialog}>
                Cancel
              </Button>
              {!preview ? (
                <Button
                  size="sm"
                  onClick={handlePreview}
                  disabled={previewMut.isPending}
                  className="gap-1.5"
                >
                  {previewMut.isPending && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  )}
                  Preview Email
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => sendMut.mutate()}
                  disabled={
                    sendMut.isPending ||
                    !editBody.trim() ||
                    (!preview.has_email && !manualEmail.trim())
                  }
                  className="gap-1.5"
                >
                  {sendMut.isPending && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  )}
                  Confirm &amp; Send
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
