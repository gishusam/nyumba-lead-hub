import { useEffect, useState } from "react";
import { Loader2, Lock, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  emailSettingsApi,
  getCurrentUser,
} from "@/lib/api";
import { toast } from "sonner";

type TemplateState = {
  subject: string;
  body: string;
};

export function EmailTemplateSettings() {
  const user = getCurrentUser();

  const canManage =
    user?.can_manage_communication_templates === true;

  const [senderName, setSenderName] = useState("");
  const [cold, setCold] = useState<TemplateState>({
    subject: "",
    body: "",
  });
  const [followup, setFollowup] = useState<TemplateState>({
    subject: "",
    body: "",
  });
  const [placeholders, setPlaceholders] = useState<
    Record<string, string>
  >({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;

    emailSettingsApi
      .get()
      .then((settings) => {
        if (cancelled) return;

        setSenderName(settings.sender_name);

        setCold({
          subject: settings.template_cold.subject,
          body: settings.template_cold.body,
        });

        setFollowup({
          subject: settings.template_followup.subject,
          body: settings.template_followup.body,
        });

        setPlaceholders(settings.placeholders);
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError(
            "Shared email templates could not be loaded.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const save = async () => {
    if (!canManage) {
      return;
    }

    if (!cold.subject.trim() || !cold.body.trim()) {
      toast.error(
        "Cold Outreach subject and message are required.",
      );
      return;
    }

    if (
      !followup.subject.trim() ||
      !followup.body.trim()
    ) {
      toast.error(
        "Follow-up subject and message are required.",
      );
      return;
    }

    if (!cold.body.includes("{rep_name}")) {
      toast.error(
        "Cold Outreach message must include {rep_name}.",
      );
      return;
    }

    if (!followup.body.includes("{rep_name}")) {
      toast.error(
        "Follow-up message must include {rep_name}.",
      );
      return;
    }

    setSaving(true);

    try {
      await emailSettingsApi.update({
        sender_name: senderName.trim(),
        template_cold: cold,
        template_followup: followup,
      });

      toast.success("Shared email templates saved");
    } catch {
      toast.error(
        "Could not save shared email templates.",
      );
    } finally {
      setSaving(false);
    }
  };

  const insertPlaceholder = (
    template: "cold" | "followup",
    placeholder: string,
  ) => {
    if (!canManage) {
      return;
    }

    if (template === "cold") {
      setCold((current) => ({
        ...current,
        body: `${current.body}${current.body ? " " : ""}${placeholder}`,
      }));
      return;
    }

    setFollowup((current) => ({
      ...current,
      body: `${current.body}${current.body ? " " : ""}${placeholder}`,
    }));
  };

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">
            Shared email templates
          </h3>

          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Keep Cold Outreach and Follow-up communication
            consistent across the sales team.
          </p>
        </div>

        {!canManage && !loading ? (
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/30 px-2.5 py-1 text-xs font-medium text-muted-foreground">
            <Lock className="h-3.5 w-3.5" />
            View only
          </div>
        ) : null}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading shared templates…
        </div>
      ) : loadError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {loadError}
        </div>
      ) : (
        <>
          <div className="grid gap-2">
            <label className="text-sm font-medium">
              Sender name
            </label>

            <input
              value={senderName}
              readOnly={!canManage}
              onChange={(event) =>
                setSenderName(event.target.value)
              }
              className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm read-only:bg-muted/30 read-only:text-muted-foreground"
            />
          </div>

          <TemplateEditor
            title="Cold Outreach"
            description="Used when starting a new conversation with prospective clients."
            template={cold}
            canManage={canManage}
            placeholders={placeholders}
            onChange={setCold}
            onInsert={(placeholder) =>
              insertPlaceholder("cold", placeholder)
            }
          />

          <TemplateEditor
            title="Follow-up"
            description="Used when following up after previous contact."
            template={followup}
            canManage={canManage}
            placeholders={placeholders}
            onChange={setFollowup}
            onInsert={(placeholder) =>
              insertPlaceholder(
                "followup",
                placeholder,
              )
            }
          />

          {canManage ? (
            <div className="flex justify-end border-t border-border pt-4">
              <Button
                onClick={save}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}

                {saving
                  ? "Saving…"
                  : "Save shared templates"}
              </Button>
            </div>
          ) : (
            <p className="border-t border-border pt-4 text-xs text-muted-foreground">
              These templates are centrally managed.
              You can use them in campaigns but cannot edit
              the master versions.
            </p>
          )}
        </>
      )}
    </section>
  );
}

function TemplateEditor({
  title,
  description,
  template,
  canManage,
  placeholders,
  onChange,
  onInsert,
}: {
  title: string;
  description: string;
  template: TemplateState;
  canManage: boolean;
  placeholders: Record<string, string>;
  onChange: (template: TemplateState) => void;
  onInsert: (placeholder: string) => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/10 p-4 space-y-4">
      <div>
        <h4 className="text-sm font-semibold">
          {title}
        </h4>

        <p className="mt-1 text-xs text-muted-foreground">
          {description}
        </p>
      </div>

      <div className="grid gap-2">
        <label className="text-xs font-medium text-muted-foreground">
          Subject
        </label>

        <input
          value={template.subject}
          readOnly={!canManage}
          onChange={(event) =>
            onChange({
              ...template,
              subject: event.target.value,
            })
          }
          className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm read-only:bg-muted/30 read-only:text-muted-foreground"
        />
      </div>

      <div className="grid gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="text-xs font-medium text-muted-foreground">
            Message
          </label>

          <div className="flex flex-wrap gap-1.5">
            {Object.keys(placeholders).map(
              (placeholder) => (
                <button
                  key={placeholder}
                  type="button"
                  disabled={!canManage}
                  title={placeholders[placeholder]}
                  onClick={() =>
                    onInsert(placeholder)
                  }
                  className="rounded-full border border-border bg-background px-2 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors enabled:hover:border-primary/30 enabled:hover:text-primary disabled:cursor-default disabled:opacity-60"
                >
                  {placeholder}
                </button>
              ),
            )}
          </div>
        </div>

        <textarea
          rows={8}
          value={template.body}
          readOnly={!canManage}
          onChange={(event) =>
            onChange({
              ...template,
              body: event.target.value,
            })
          }
          className="w-full resize-y rounded-lg border border-input bg-background p-3 text-sm leading-6 read-only:bg-muted/30 read-only:text-muted-foreground"
        />
      </div>
    </div>
  );
}
