import { Check, Clock3, Mail, Newspaper, Send, Sparkles, Users } from "lucide-react";
import { useMemo, useState } from "react";

import {
  approvedSenders,
  newsletterTemplates,
  personalizePreview,
  previewRecipientCount,
  recipientSources,
  type RecipientSource,
  type SendMode,
} from "./communications-product";

type NewsletterTemplateId =
  (typeof newsletterTemplates)[number]["id"];

export function NewsletterWorkspace() {
  const previewMode = import.meta.env.DEV;
  const [templateId, setTemplateId] = useState<NewsletterTemplateId>(newsletterTemplates[0].id);
  const activeTemplate =
    newsletterTemplates.find((item) => item.id === templateId) ?? newsletterTemplates[0];

  const [eyebrow, setEyebrow] = useState<string>(activeTemplate.eyebrow);
  const [headline, setHeadline] = useState<string>(activeTemplate.headline);
  const [body, setBody] = useState<string>(activeTemplate.body);
  const [cta, setCta] = useState<string>(activeTemplate.cta);
  const [senderId, setSenderId] = useState("newsletter");
  const [recipientSource, setRecipientSource] = useState<RecipientSource>("saved");
  const [sendMode, setSendMode] = useState<SendMode>("now");
  const [scheduledAt, setScheduledAt] = useState("");

  const recipientCount = previewRecipientCount(recipientSource, previewMode);
  const canPreviewSend = useMemo(
    () =>
      Boolean(
        headline.trim() &&
        body.trim() &&
        cta.trim() &&
        senderId &&
        recipientCount > 0 &&
        (sendMode === "now" || scheduledAt),
      ),
    [body, cta, headline, recipientCount, scheduledAt, sendMode, senderId],
  );

  const chooseTemplate = (id: string) => {
    const next = newsletterTemplates.find((item) => item.id === id);
    if (!next) return;
    setTemplateId(next.id);
    setEyebrow(next.eyebrow);
    setHeadline(next.headline);
    setBody(next.body);
    setCta(next.cta);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Create newsletter</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Start from a polished template, then edit every part freely.
        </p>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Choose a template</h3>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {newsletterTemplates.map((template) => {
            const selected = template.id === templateId;
            return (
              <button
                key={template.id}
                type="button"
                onClick={() => chooseTemplate(template.id)}
                className={`overflow-hidden rounded-2xl border text-left transition ${
                  selected
                    ? "border-primary ring-2 ring-primary/10"
                    : "border-border hover:border-primary/30"
                }`}
              >
                <div className={`${heroClass(template.id)} h-24 p-4 text-white`}>
                  <p className="text-[10px] font-semibold tracking-[0.22em] text-white/70">
                    {template.eyebrow}
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm font-semibold">{template.headline}</p>
                </div>
                <div className="flex items-start justify-between gap-3 p-4">
                  <div>
                    <h4 className="font-semibold">{template.name}</h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Edit the headline, copy, call-to-action, sender, and audience.
                    </p>
                  </div>
                  {selected ? (
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,0.85fr)_minmax(24rem,1.15fr)]">
        <div className="space-y-5">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="font-semibold">Newsletter content</h3>
            <div className="mt-5 grid gap-4">
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

              <Field label="Eyebrow">
                <input
                  value={eyebrow}
                  onChange={(event) => setEyebrow(event.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Headline">
                <input
                  value={headline}
                  onChange={(event) => setHeadline(event.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Body">
                <textarea
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  rows={7}
                  className={`${inputClass} resize-y leading-6`}
                />
              </Field>
              <Field label="Call-to-action">
                <input
                  value={cta}
                  onChange={(event) => setCta(event.target.value)}
                  className={inputClass}
                />
              </Field>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">Audience and delivery</h3>
            </div>

            <div className="mt-5 grid gap-3">
              {recipientSources.map((source) => (
                <button
                  key={source.id}
                  type="button"
                  onClick={() => setRecipientSource(source.id)}
                  className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${
                    recipientSource === source.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                      recipientSource === source.id
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border"
                    }`}
                  >
                    {recipientSource === source.id ? <Check className="h-3 w-3" /> : null}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">{source.label}</span>
                    <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                      {source.description}
                    </span>
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-4 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-950">
              <span className="font-semibold">{recipientCount.toLocaleString()} recipients</span>
              <span className="ml-2 text-emerald-800">
                after duplicates, unsubscribes, bounces, and suppression.
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
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

            <button
              type="button"
              disabled={!canPreviewSend || !previewMode}
              onClick={() => window.alert("Newsletter preview complete. No email was sent.")}
              className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Newspaper className="h-4 w-4" />
              {previewMode
                ? `Preview newsletter to ${recipientCount.toLocaleString()}`
                : "Sending API not connected"}
            </button>
          </div>
        </div>

        <NewsletterPreview
          templateId={templateId}
          eyebrow={eyebrow}
          headline={headline}
          body={body}
          cta={cta}
          senderId={senderId}
        />
      </section>
    </div>
  );
}

function NewsletterPreview({
  templateId,
  eyebrow,
  headline,
  body,
  cta,
  senderId,
}: {
  templateId: string;
  eyebrow: string;
  headline: string;
  body: string;
  cta: string;
  senderId: string;
}) {
  const sender = approvedSenders.find((item) => item.id === senderId) ?? approvedSenders[0];

  return (
    <aside className="xl:sticky xl:top-6 xl:self-start">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <Mail className="h-4 w-4 text-primary" />
        Live newsletter preview
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-slate-100 p-4 shadow-sm sm:p-7">
        <div className="mx-auto max-w-2xl overflow-hidden rounded-xl bg-white shadow-xl">
          <div className={`${heroClass(templateId)} px-6 py-10 text-white sm:px-10`}>
            <p className="text-xs font-semibold tracking-[0.24em] text-white/70">
              {eyebrow || "NEWSLETTER"}
            </p>
            <h3 className="mt-4 text-3xl font-semibold leading-tight">
              {personalizePreview(headline) || "Your newsletter headline"}
            </h3>
          </div>
          <div className="px-6 py-8 sm:px-10">
            <p className="text-sm text-slate-500">
              From {sender.label} &lt;{sender.email}&gt;
            </p>
            <p className="mt-6 whitespace-pre-wrap text-base leading-7 text-slate-700">
              {personalizePreview(body)}
            </p>
            <button
              type="button"
              className="mt-7 inline-flex min-h-11 items-center justify-center rounded-lg bg-slate-950 px-5 text-sm font-semibold text-white"
            >
              {cta || "Learn more"}
            </button>
          </div>
          <div className="border-t border-slate-200 bg-slate-50 px-6 py-5 text-center text-xs leading-5 text-slate-500 sm:px-10">
            You received this email from Nyumba Zetu.
            <br />
            <span className="underline">Unsubscribe</span> or update your email preferences.
          </div>
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

function heroClass(templateId: string): string {
  if (templateId === "property-update") {
    return "bg-gradient-to-br from-emerald-700 to-emerald-950";
  }
  if (templateId === "market-brief") {
    return "bg-gradient-to-br from-slate-700 to-slate-950";
  }
  return "bg-gradient-to-br from-blue-700 to-violet-900";
}

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10";
