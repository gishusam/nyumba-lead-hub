import type { ReactNode } from "react";
import type {
  AudienceFilter,
  CampaignDraftState,
} from "./types";
import { setAudienceFilter } from "./campaign-state";

const inputClass =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring";

export function AudienceBuilder({
  state,
  onChange,
}: {
  state: CampaignDraftState;
  onChange: (state: CampaignDraftState) => void;
}) {
  const setFilter = (
    key: keyof AudienceFilter,
    value: string,
  ) => onChange(setAudienceFilter(state, key, value));

  const filterEntries = Object.entries(state.filters).filter(
    ([, value]) => Boolean(value),
  );

  return (
    <section className="space-y-5">
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold">Choose your audience</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          This working flow resolves recipients from your existing Nyumba Zetu leads.
        </p>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <SourceCard
            title="Existing leads"
            description="Live — filter your current Sales Intelligence leads."
            active
          />
          <SourceCard
            title="Mailing list"
            description="Connect after the mailing-list backend contract is final."
            disabled
          />
          <SourceCard
            title="CSV upload"
            description="Connect after the upload/review backend contract is final."
            disabled
          />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Area">
            <input
              className={inputClass}
              placeholder="e.g. Kilimani"
              value={state.filters.area ?? ""}
              onChange={(event) =>
                setFilter("area", event.target.value)
              }
            />
          </Field>

          <Field label="Lead type">
            <select
              className={inputClass}
              value={state.filters.lead_type ?? ""}
              onChange={(event) =>
                setFilter("lead_type", event.target.value)
              }
            >
              <option value="">Any lead type</option>
              <option value="agency">Agency</option>
              <option value="apartment">Apartment</option>
              <option value="landlord">Landlord</option>
              <option value="developer">Developer</option>
            </select>
          </Field>

          <Field label="Status">
            <select
              className={inputClass}
              value={state.filters.status ?? ""}
              onChange={(event) =>
                setFilter("status", event.target.value)
              }
            >
              <option value="">Any status</option>
              <option value="new">New</option>
              <option value="called">Called</option>
              <option value="demo_booked">Demo booked</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>
          </Field>

          <Field label="AI score">
            <select
              className={inputClass}
              value={state.filters.ai_score ?? ""}
              onChange={(event) =>
                setFilter("ai_score", event.target.value)
              }
            >
              <option value="">Any score</option>
              <option value="LOW_HANGING_FRUIT">
                Low hanging fruit
              </option>
              <option value="WARM_PROSPECT">
                Warm prospect
              </option>
              <option value="EXECUTIVE_LEAD">
                Executive lead
              </option>
              <option value="NURTURE">Nurture</option>
              <option value="NOT_QUALIFIED">
                Not qualified
              </option>
            </select>
          </Field>
        </div>

        <div className="mt-5 rounded-lg border border-border bg-muted/30 p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Current filter
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            {filterEntries.length ? (
              filterEntries.map(([key, value]) => (
                <span
                  key={key}
                  className="rounded-full border border-border bg-background px-2.5 py-1 text-xs"
                >
                  {key.replace("_", " ")}: {value}
                </span>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">
                Add at least one filter before resolving recipients.
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function SourceCard({
  title,
  description,
  active,
  disabled,
}: {
  title: string;
  description: string;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        active
          ? "border-primary bg-primary/5"
          : disabled
            ? "border-border bg-muted/20 opacity-65"
            : "border-border"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="font-medium">{title}</span>
        <span className="rounded-full bg-background px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          {active ? "Available" : "Later"}
        </span>
      </div>
      <div className="mt-1 text-xs leading-5 text-muted-foreground">
        {description}
      </div>
    </div>
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
