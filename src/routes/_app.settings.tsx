import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { EmailTemplateSettings } from "@/features/communications/EmailTemplateSettings";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — Nyumba Zetu" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const [org, setOrg] = useState({
    companyName: "Nyumba Zetu Ltd",
    primaryCity: "Nairobi",
    salesEmail: "sales@nyumbazetu.co.ke",
    timezone: "Africa/Nairobi",
  });

  const [scoring, setScoring] = useState({
    hotThreshold: 80,
    warmThreshold: 50,
  });

  const [saving, setSaving] = useState(false);
  const [savingScoring, setSavingScoring] = useState(false);

  const saveOrg = async () => {
    setSaving(true);
    // No backend endpoint yet — optimistic UI only
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    toast.success("Organisation settings saved");
  };

  const saveScoring = async () => {
    setSavingScoring(true);
    await new Promise((r) => setTimeout(r, 600));
    setSavingScoring(false);
    toast.success("Lead scoring thresholds saved");
  };

  const resetScoring = () => {
    setScoring({
      hotThreshold: 80,
      warmThreshold: 50,
    });
    toast.info("Reset to defaults");
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-6 lg:p-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Settings
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Manage organisation preferences and shared communication settings.
        </p>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(18rem,0.85fr)_minmax(0,1.65fr)]">
        {/* Left column */}
        <div className="space-y-6">
          <div>
            <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              General
            </div>

            <section className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
              <div>
                <h3 className="font-semibold">
                  Organisation
                </h3>

                <p className="mt-1 text-sm text-muted-foreground">
                  Basic company and sales configuration.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <Field
                  label="Company name"
                  value={org.companyName}
                  onChange={(v) =>
                    setOrg((o) => ({
                      ...o,
                      companyName: v,
                    }))
                  }
                />

                <Field
                  label="Primary city"
                  value={org.primaryCity}
                  onChange={(v) =>
                    setOrg((o) => ({
                      ...o,
                      primaryCity: v,
                    }))
                  }
                />

                <Field
                  label="Sales lead email"
                  value={org.salesEmail}
                  onChange={(v) =>
                    setOrg((o) => ({
                      ...o,
                      salesEmail: v,
                    }))
                  }
                />

                <Field
                  label="Time zone"
                  value={org.timezone}
                  onChange={(v) =>
                    setOrg((o) => ({
                      ...o,
                      timezone: v,
                    }))
                  }
                />
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  onClick={saveOrg}
                  disabled={saving}
                >
                  {saving
                    ? "Saving…"
                    : "Save changes"}
                </Button>
              </div>
            </section>
          </div>

          <section className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
            <div>
              <h3 className="font-semibold">
                Lead scoring
              </h3>

              <p className="mt-1 text-sm leading-5 text-muted-foreground">
                Adjust the thresholds used to classify hot and warm leads.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">
                  Hot threshold (≥)
                </label>

                <input
                  type="number"
                  min={1}
                  max={99}
                  value={scoring.hotThreshold}
                  onChange={(e) =>
                    setScoring((s) => ({
                      ...s,
                      hotThreshold: Number(
                        e.target.value,
                      ),
                    }))
                  }
                  className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-muted-foreground">
                  Warm threshold (≥)
                </label>

                <input
                  type="number"
                  min={1}
                  max={99}
                  value={scoring.warmThreshold}
                  onChange={(e) =>
                    setScoring((s) => ({
                      ...s,
                      warmThreshold: Number(
                        e.target.value,
                      ),
                    }))
                  }
                  className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                onClick={saveScoring}
                disabled={savingScoring}
              >
                {savingScoring
                  ? "Saving…"
                  : "Save changes"}
              </Button>

              <Button
                variant="outline"
                onClick={resetScoring}
              >
                Reset
              </Button>
            </div>
          </section>
        </div>

        {/* Right column */}
        <div>
          <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Communications
          </div>

          <EmailTemplateSettings />
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">
        {label}
      </span>

      <input
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        className="mt-1 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
      />
    </label>
  );
}
