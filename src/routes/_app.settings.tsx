import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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
    setScoring({ hotThreshold: 80, warmThreshold: 50 });
    toast.info("Reset to defaults");
  };

  return (
    <div className="p-6 lg:p-8 space-y-5 max-w-3xl">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <section className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
        <h3 className="font-semibold">Organisation</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Company name"
            value={org.companyName}
            onChange={(v) => setOrg((o) => ({ ...o, companyName: v }))}
          />
          <Field
            label="Primary city"
            value={org.primaryCity}
            onChange={(v) => setOrg((o) => ({ ...o, primaryCity: v }))}
          />
          <Field
            label="Sales lead email"
            value={org.salesEmail}
            onChange={(v) => setOrg((o) => ({ ...o, salesEmail: v }))}
          />
          <Field
            label="Time zone"
            value={org.timezone}
            onChange={(v) => setOrg((o) => ({ ...o, timezone: v }))}
          />
        </div>
        <div className="flex gap-2 pt-1">
          <Button onClick={saveOrg} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
        <h3 className="font-semibold">Lead scoring</h3>
        <p className="text-sm text-muted-foreground">
          Scores are computed by AI based on call notes and engagement signals. You can adjust the
          thresholds that determine how a lead is labelled.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">
              Hot threshold (≥)
            </label>
            <input
              type="number"
              min={1}
              max={99}
              value={scoring.hotThreshold}
              onChange={(e) =>
                setScoring((s) => ({ ...s, hotThreshold: Number(e.target.value) }))
              }
              className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">
              Warm threshold (≥)
            </label>
            <input
              type="number"
              min={1}
              max={99}
              value={scoring.warmThreshold}
              onChange={(e) =>
                setScoring((s) => ({ ...s, warmThreshold: Number(e.target.value) }))
              }
              className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm"
            />
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <Button onClick={saveScoring} disabled={savingScoring}>
            {savingScoring ? "Saving…" : "Save changes"}
          </Button>
          <Button variant="outline" onClick={resetScoring}>
            Reset to default
          </Button>
        </div>
      </section>
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
      <span className="text-xs text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full h-9 rounded-lg border border-input bg-background px-3 text-sm"
      />
    </label>
  );
}
