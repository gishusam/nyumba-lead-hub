import { useState, type ReactNode } from "react";
import type {
  AudienceFilter,
  AudienceSource,
  CampaignDraftState,
  ResolvedRecipient,
} from "./types";
import { parseCsvAudience } from "./csv-audience";
import { setAudienceFilter } from "./campaign-state";

const inputClass =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring";

export function AudienceBuilder({
  state,
  onChange,
  onCsvRecipients,
}: {
  state: CampaignDraftState;
  onChange: (state: CampaignDraftState) => void;
  onCsvRecipients: (recipients: ResolvedRecipient[]) => void;
}) {
  const [csvError, setCsvError] = useState<string | null>(null);
  const setFilter = (
    key: keyof AudienceFilter,
    value: string,
  ) => onChange(setAudienceFilter(state, key, value));

  const filterEntries = Object.entries(state.filters).filter(
    ([, value]) => Boolean(value),
  );

  const selectSource = (audienceSource: AudienceSource) => {
    setCsvError(null);
    onCsvRecipients([]);

    onChange({
      ...state,
      audienceSource,
      filters: {},
      csvFileName: null,
      csvSummary: null,
      review: null,
    });
  };

  const handleCsvFile = async (file?: File) => {
    setCsvError(null);

    if (!file) {
      onCsvRecipients([]);
      onChange({
        ...state,
        csvFileName: null,
        csvSummary: null,
        review: null,
      });
      return;
    }

    try {
      const result = parseCsvAudience(await file.text());

      onCsvRecipients(result.recipients);

      onChange({
        ...state,
        csvFileName: file.name,
        csvSummary: result.summary,
        review: null,
      });
    } catch (error) {
      onCsvRecipients([]);

      onChange({
        ...state,
        csvFileName: null,
        csvSummary: null,
        review: null,
      });

      setCsvError(
        error instanceof Error
          ? error.message
          : "Could not read this CSV file.",
      );
    }
  };

  return (
    <section className="space-y-5">
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold">Choose your audience</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose where this campaign's recipients should come from.
        </p>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <SourceCard
            title="Existing leads"
            description="Filter your current Sales Intelligence leads."
            active={state.audienceSource === "leads"}
            onClick={() => selectSource("leads")}
          />

          <SourceCard
            title="Mailing list"
            description="Saved mailing lists will be available in a later slice."
            disabled
          />

          <SourceCard
            title="CSV upload"
            description="Upload a CSV and review the exact recipients before sending."
            active={state.audienceSource === "csv"}
            onClick={() => selectSource("csv")}
          />
        </div>
      </div>

      {state.audienceSource === "leads" ? (
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
      ) : (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <h3 className="font-semibold">CSV upload</h3>

          <p className="mt-1 text-sm text-muted-foreground">
            Upload a CSV containing at least an email column.
            A name column is optional.
          </p>

          <label className="mt-5 block cursor-pointer rounded-lg border border-dashed border-border bg-muted/20 p-5 text-center transition-colors hover:bg-muted/40">
            <span className="block text-sm font-medium">
              Choose CSV file
            </span>

            <span className="mt-1 block text-xs text-muted-foreground">
              Expected columns: name, email
            </span>

            <input
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              onChange={(event) =>
                void handleCsvFile(event.target.files?.[0])
              }
            />
          </label>

          {csvError && (
            <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {csvError}
            </div>
          )}

          {state.csvFileName && state.csvSummary && (
            <div className="mt-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">
                    {state.csvFileName}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    CSV parsed successfully
                  </div>
                </div>

                <span className="rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                  Ready
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <CsvStat
                  label="Uploaded"
                  value={state.csvSummary.uploaded}
                />
                <CsvStat
                  label="Valid"
                  value={state.csvSummary.valid}
                />
                <CsvStat
                  label="Invalid"
                  value={state.csvSummary.invalid}
                />
                <CsvStat
                  label="Duplicates"
                  value={state.csvSummary.duplicates}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function CsvStat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3">
      <div className="text-xs text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-xl font-semibold tabular-nums">
        {value}
      </div>
    </div>
  );
}

function SourceCard({
  title,
  description,
  active,
  disabled,
  onClick,
}: {
  title: string;
  description: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`w-full rounded-xl border p-4 text-left transition-colors ${
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
          {active ? "Selected" : disabled ? "Later" : "Available"}
        </span>
      </div>
      <div className="mt-1 text-xs leading-5 text-muted-foreground">
        {description}
      </div>
    </button>
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
