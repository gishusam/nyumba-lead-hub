import type { ReactNode } from "react";
import type { CampaignDraftState } from "./types";

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring";

export function CampaignComposer({
  state,
  onChange,
}: {
  state: CampaignDraftState;
  onChange: (state: CampaignDraftState) => void;
}) {
  const insertToken = (token: string) =>
    onChange({
      ...state,
      body: `${state.body}${state.body ? " " : ""}${token}`,
    });

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold">Compose campaign</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Write one message. The preview personalises it for each recipient.
      </p>

      <div className="mt-6 grid gap-5">
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
