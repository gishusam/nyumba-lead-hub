import { useEffect, useState, type ReactNode } from "react";
import { Paperclip, X, XCircle } from "lucide-react";
import type { CampaignDraftState } from "./types";
import { NewsletterComposer } from "./newsletter/NewsletterComposer";
import { emailSettingsApi } from "../../lib/api";
import {
  applyCommunicationTemplate,
  mapEmailSettingsToCommunicationTemplates,
  type CommunicationTemplate,
} from "./communication-templates";
import {
  formatCampaignAttachmentSize,
  validateCampaignAttachmentFile,
} from "./campaign-attachments";

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring";

export function CampaignComposer({
  state,
  onChange,
}: {
  state: CampaignDraftState;
  onChange: (state: CampaignDraftState) => void;
}) {
  const [templates, setTemplates] = useState<CommunicationTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesError, setTemplatesError] = useState("");
  const [fileError, setFileError] = useState("");

  useEffect(() => {
    if (state.campaignType === "newsletter") {
      return;
    }

    let cancelled = false;

    setTemplatesLoading(true);
    setTemplatesError("");

    emailSettingsApi
      .get()
      .then((settings) => {
        if (cancelled) return;

        setTemplates(
          mapEmailSettingsToCommunicationTemplates(settings),
        );
      })
      .catch(() => {
        if (cancelled) return;

        setTemplatesError(
          "Templates could not be loaded. You can still write the message manually.",
        );
      })
      .finally(() => {
        if (!cancelled) {
          setTemplatesLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [state.campaignType]);

  if (state.campaignType === "newsletter") {
    return <NewsletterComposer state={state} onChange={onChange} />;
  }

  const insertToken = (token: string) =>
    onChange({
      ...state,
      body: `${state.body}${state.body ? " " : ""}${token}`,
    });

  const selectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);

    if (!templateId) {
      return;
    }

    const template = templates.find(
      (item) => item.id === templateId,
    );

    if (!template) {
      return;
    }

    const applied = applyCommunicationTemplate(
      {
        subject: state.subject,
        body: state.body,
      },
      template,
    );

    onChange({
      ...state,
      ...applied,
    });
  };

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold">Compose campaign</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Write one message. The preview personalises it for each recipient.
      </p>

      <div className="mt-6 grid gap-5">
        <div className="rounded-lg border border-border bg-muted/20 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0 flex-1">
              <label
                htmlFor="campaign-template"
                className="text-sm font-medium"
              >
                Message template
              </label>

              <p className="mt-1 text-xs text-muted-foreground">
                Start from an approved Nyumba Zetu message, then customise it for this campaign.
              </p>
            </div>

            <select
              id="campaign-template"
              className={`${inputClass} sm:max-w-xs`}
              value={selectedTemplateId}
              disabled={templatesLoading}
              onChange={(event) =>
                selectTemplate(event.target.value)
              }
            >
              <option value="">
                {templatesLoading
                  ? "Loading templates..."
                  : "Start from scratch"}
              </option>

              {templates.map((template) => (
                <option
                  key={template.id}
                  value={template.id}
                >
                  {template.label}
                </option>
              ))}
            </select>
          </div>

          {selectedTemplateId ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Template copied. Changes below apply only to this campaign.
            </p>
          ) : null}

          {templatesError ? (
            <p className="mt-3 text-xs text-destructive">
              {templatesError}
            </p>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Sender name">
            <input
              className={inputClass}
              value={state.senderName}
              onChange={(event) =>
                onChange({
                  ...state,
                  senderName: event.target.value,
                })
              }
            />
          </Field>

          <Field label="Sender email">
            <input
              className={inputClass}
              type="email"
              placeholder="sales@nyumbazetu.com"
              value={state.senderEmail}
              onChange={(event) =>
                onChange({
                  ...state,
                  senderEmail: event.target.value,
                })
              }
            />
          </Field>
        </div>

        <Field label="Subject">
          <input
            className={inputClass}
            value={state.subject}
            onChange={(event) =>
              onChange({
                ...state,
                subject: event.target.value,
              })
            }
          />
        </Field>

        <Field label="Message">
          <div className="mb-2 flex flex-wrap gap-2">
            {[
              "{contact_name}",
              "{company_name}",
              "{area}",
            ].map((token) => (
              <button
                key={token}
                type="button"
                onClick={() => insertToken(token)}
                className="rounded-full border border-border bg-muted/30 px-2.5 py-1 text-xs font-medium hover:border-primary/30 hover:text-primary"
              >
                {token}
              </button>
            ))}
          </div>

          <textarea
            className={`${inputClass} min-h-56 resize-y leading-6`}
            value={state.body}
            onChange={(event) =>
              onChange({
                ...state,
                body: event.target.value,
              })
            }
          />
        </Field>

        <div className="grid gap-2">
          <div>
            <div className="text-sm font-medium">
              Attachment
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                Optional · PDF, DOC or image · max 5 MB
              </span>
            </div>
          </div>

          {state.attachment ? (
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2.5">
              <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />

              <span className="min-w-0 flex-1 truncate text-sm">
                {state.attachment.name}
              </span>

              <span className="shrink-0 text-xs text-muted-foreground">
                {formatCampaignAttachmentSize(
                  state.attachment.size,
                )}
              </span>

              <button
                type="button"
                aria-label="Remove attachment"
                onClick={() => {
                  setFileError("");
                  onChange({
                    ...state,
                    attachment: null,
                  });
                }}
                className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border bg-muted/10 px-3 py-3 text-sm text-muted-foreground transition-colors hover:border-primary/30 hover:bg-muted/30 hover:text-foreground">
              <Paperclip className="h-4 w-4 shrink-0" />
              <span>Attach file</span>

              <input
                type="file"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.gif,.webp"
                className="sr-only"
                onChange={(event) => {
                  const file =
                    event.target.files?.[0];

                  if (!file) {
                    return;
                  }

                  const error =
                    validateCampaignAttachmentFile(file);

                  if (error) {
                    setFileError(error);
                    event.currentTarget.value = "";
                    return;
                  }

                  setFileError("");

                  onChange({
                    ...state,
                    attachment: file,
                  });
                }}
              />
            </label>
          )}

          {fileError ? (
            <p className="flex items-center gap-1 text-xs text-destructive">
              <XCircle className="h-3.5 w-3.5 shrink-0" />
              {fileError}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}
