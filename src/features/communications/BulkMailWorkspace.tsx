import { Check, Clock3, ListChecks, Mail, Paperclip, Send, UploadCloud, Users } from "lucide-react";
import { useMemo, useState, type ChangeEvent } from "react";

import {
  ATTACHMENT_LIMIT_BYTES,
  DEFAULT_RECIPIENT_LIMIT,
  approvedSenders,
  formatFileSize,
  personalizePreview,
  previewRecipientCount,
  recipientSources,
  validateCommunicationDraft,
  type RecipientSource,
  type SendMode,
} from "./communications-product";

const sourceIcons = {
  leads: Users,
  upload: UploadCloud,
  saved: ListChecks,
} as const;

export function BulkMailWorkspace() {
  const previewMode = import.meta.env.DEV;
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [recipientSource, setRecipientSource] = useState<RecipientSource>("leads");
  const [senderId, setSenderId] = useState("sales");
  const [subject, setSubject] = useState("New property opportunities in {area}");
  const [body, setBody] = useState(
    "Hi {contact_name},\n\nWe have new property opportunities that may be relevant to {company_name}. Our team can share the current availability, pricing, and next steps.\n\nRegards,\n{rep_name}",
  );
  const [sendMode, setSendMode] = useState<SendMode>("now");
  const [scheduledAt, setScheduledAt] = useState("");
  const [attachmentBytes, setAttachmentBytes] = useState(0);
  const [attachmentNames, setAttachmentNames] = useState<string[]>([]);

  const recipientCount = previewRecipientCount(recipientSource, previewMode);
  const errors = useMemo(
    () =>
      validateCommunicationDraft({
        recipientSource,
        recipientCount,
        senderId,
        subject,
        body,
        sendMode,
        scheduledAt,
        attachmentBytes,
      }),
    [
      attachmentBytes,
      body,
      recipientCount,
      recipientSource,
      scheduledAt,
      sendMode,
      senderId,
      subject,
    ],
  );

  const onFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    setAttachmentNames(files.map((file) => file.name));
    setAttachmentBytes(files.reduce((sum, file) => sum + file.size, 0));
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Create bulk mail</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Send a separate personalised email to every selected recipient.
        </p>
      </div>

      <ol className="grid gap-2 sm:grid-cols-3">
        {["Recipients", "Compose", "Review & send"].map((label, index) => {
          const itemStep = (index + 1) as 1 | 2 | 3;
          const active = itemStep === step;
          const complete = itemStep < step;
          return (
            <li
              key={label}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
                active
                  ? "border-primary bg-primary/5"
                  : complete
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-border bg-card"
              }`}
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : complete
                      ? "bg-emerald-600 text-white"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {complete ? <Check className="h-4 w-4" /> : itemStep}
              </span>
              <span className="text-sm font-medium">{label}</span>
            </li>
          );
        })}
      </ol>

      {step === 1 ? (
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <h3 className="text-lg font-semibold">Choose your recipients</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Existing leads, uploaded contacts, and reusable mailing lists all use one safe review
            flow.
          </p>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {recipientSources.map((source) => {
              const Icon = sourceIcons[source.id];
              const selected = recipientSource === source.id;
              return (
                <button
                  key={source.id}
                  type="button"
                  onClick={() => setRecipientSource(source.id)}
                  className={`rounded-2xl border p-5 text-left transition ${
                    selected
                      ? "border-primary bg-primary/5 ring-2 ring-primary/10"
                      : "border-border hover:border-primary/30 hover:bg-muted/20"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                        selected
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    {selected ? (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    ) : null}
                  </div>
                  <h4 className="mt-4 font-semibold">{source.label}</h4>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {source.description}
                  </p>
                  <p className="mt-4 text-sm font-medium text-primary">
                    {recipientCount.toLocaleString()} preview recipients
                  </p>
                </button>
              );
            })}
          </div>

          <div className="mt-6 grid gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:grid-cols-3">
            <SafetyStat label="Selected" value={recipientCount.toLocaleString()} />
            <SafetyStat label="Duplicates" value="Removed" />
            <SafetyStat label="Unsubscribed & suppressed" value="Excluded" />
          </div>

          <div className="mt-6 flex justify-end">
            <PrimaryButton onClick={() => setStep(2)}>Continue to compose</PrimaryButton>
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(21rem,0.65fr)]">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <h3 className="text-lg font-semibold">Compose email</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Each recipient gets an individual message with their own personalisation.
            </p>

            <div className="mt-6 grid gap-5">
              <Field label="Approved sender">
                <select
                  value={senderId}
                  onChange={(event) => setSenderId(event.target.value)}
                  className={inputClass}
                >
                  {approvedSenders.map((sender) => (
                    <option key={sender.id} value={sender.id}>
                      {sender.label} — {sender.email}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Subject">
                <input
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  className={inputClass}
                />
              </Field>

              <Field label="Email content">
                <div className="mb-2 flex flex-wrap gap-2">
                  {["{contact_name}", "{company_name}", "{area}", "{rep_name}", "{rep_email}"].map(
                    (token) => (
                      <button
                        key={token}
                        type="button"
                        onClick={() => setBody((current) => `${current} ${token}`)}
                        className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs font-medium text-muted-foreground hover:border-primary/30 hover:text-primary"
                      >
                        {token}
                      </button>
                    ),
                  )}
                </div>
                <textarea
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  rows={11}
                  className={`${inputClass} resize-y leading-6`}
                />
              </Field>

              <Field label="Attachments">
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 p-4 hover:border-primary/40 hover:bg-primary/5">
                  <Paperclip className="h-5 w-5 text-muted-foreground" />
                  <span className="min-w-0 text-sm">
                    <span className="font-medium">Choose files</span>
                    <span className="ml-2 text-muted-foreground">
                      {attachmentNames.length
                        ? attachmentNames.join(", ")
                        : "PDF, Word, or spreadsheet · 10 MB max"}
                    </span>
                  </span>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                    onChange={onFiles}
                    className="sr-only"
                  />
                </label>
                <p
                  className={`mt-2 text-xs ${attachmentBytes > ATTACHMENT_LIMIT_BYTES ? "text-destructive" : "text-muted-foreground"}`}
                >
                  {formatFileSize(attachmentBytes)} of 10.0 MB
                </p>
              </Field>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
              <SecondaryButton onClick={() => setStep(1)}>Back</SecondaryButton>
              <PrimaryButton
                onClick={() => setStep(3)}
                disabled={
                  !subject.trim() || !body.trim() || attachmentBytes > ATTACHMENT_LIMIT_BYTES
                }
              >
                Review email
              </PrimaryButton>
            </div>
          </div>

          <EmailPreview subject={subject} body={body} senderId={senderId} />
        </section>
      ) : null}

      {step === 3 ? (
        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)]">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <h3 className="text-lg font-semibold">Review and confirm</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Nothing is sent until the final action.
            </p>

            <dl className="mt-6 grid gap-3 sm:grid-cols-2">
              <Summary label="Valid recipients" value={recipientCount.toLocaleString()} />
              <Summary label="Recipient limit" value={DEFAULT_RECIPIENT_LIMIT.toLocaleString()} />
              <Summary label="Delivery method" value="Individual emails" />
              <Summary
                label="Attachments"
                value={
                  attachmentNames.length
                    ? `${attachmentNames.length} · ${formatFileSize(attachmentBytes)}`
                    : "None"
                }
              />
            </dl>

            <div className="mt-6 rounded-xl border border-border p-4">
              <p className="text-sm font-semibold">Delivery time</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <ModeButton
                  active={sendMode === "now"}
                  icon={Send}
                  title="Send now"
                  onClick={() => setSendMode("now")}
                />
                <ModeButton
                  active={sendMode === "schedule"}
                  icon={Clock3}
                  title="Schedule"
                  onClick={() => setSendMode("schedule")}
                />
              </div>
              {sendMode === "schedule" ? (
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(event) => setScheduledAt(event.target.value)}
                  className={`${inputClass} mt-4`}
                />
              ) : null}
            </div>

            {errors.length ? (
              <div className="mt-5 rounded-xl border border-destructive/20 bg-destructive/5 p-4">
                <p className="text-sm font-semibold text-destructive">Resolve before sending</p>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  {errors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
              <SecondaryButton onClick={() => setStep(2)}>Back to edit</SecondaryButton>
              <PrimaryButton
                disabled={errors.length > 0 || !previewMode}
                onClick={() => window.alert("Preview complete. No email was sent.")}
              >
                {previewMode
                  ? `Preview send to ${recipientCount.toLocaleString()}`
                  : "Sending API not connected"}
              </PrimaryButton>
            </div>
          </div>

          <EmailPreview subject={subject} body={body} senderId={senderId} />
        </section>
      ) : null}
    </div>
  );
}

function EmailPreview({
  subject,
  body,
  senderId,
}: {
  subject: string;
  body: string;
  senderId: string;
}) {
  const sender = approvedSenders.find((item) => item.id === senderId) ?? approvedSenders[0];
  return (
    <aside className="rounded-2xl border border-border bg-muted/20 p-4 xl:sticky xl:top-6 xl:self-start">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <Mail className="h-4 w-4 text-primary" />
        Recipient preview
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <p className="text-xs text-slate-500">From</p>
          <p className="mt-0.5 text-sm font-medium text-slate-900">
            {sender.label} &lt;{sender.email}&gt;
          </p>
          <p className="mt-3 text-xs text-slate-500">Subject</p>
          <p className="mt-0.5 text-sm font-semibold text-slate-900">
            {personalizePreview(subject)}
          </p>
        </div>
        <div className="whitespace-pre-wrap px-5 py-6 text-sm leading-6 text-slate-700">
          {personalizePreview(body)}
        </div>
        <div className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500">
          Each recipient receives an individual message.
        </div>
      </div>
    </aside>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

function SafetyStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-emerald-800/70">{label}</p>
      <p className="mt-1 font-semibold text-emerald-950">{value}</p>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/35 p-4">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-semibold">{value}</dd>
    </div>
  );
}

function ModeButton({
  active,
  icon: Icon,
  title,
  onClick,
}: {
  active: boolean;
  icon: typeof Send;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${
        active
          ? "border-primary bg-primary/5 ring-2 ring-primary/10"
          : "border-border hover:border-primary/30"
      }`}
    >
      <Icon className={`h-5 w-5 ${active ? "text-primary" : "text-muted-foreground"}`} />
      <span className="text-sm font-semibold">{title}</span>
    </button>
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex min-h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function SecondaryButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-10 items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-medium transition hover:bg-muted"
    >
      {children}
    </button>
  );
}

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10";
