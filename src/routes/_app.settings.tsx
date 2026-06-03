import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — Nyumba Zetu" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="p-6 lg:p-8 space-y-5 max-w-3xl">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <section className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
        <h3 className="font-semibold">Organization</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Company name" defaultValue="Nyumba Zetu Ltd" />
          <Field label="Primary city" defaultValue="Nairobi" />
          <Field label="Sales lead email" defaultValue="sales@nyumbazetu.co.ke" />
          <Field label="Time zone" defaultValue="Africa/Nairobi" />
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
        <h3 className="font-semibold">Lead scoring</h3>
        <p className="text-sm text-muted-foreground">
          Hot ≥ 80, Warm 50–79, Cold &lt; 50. Score weights are tuned per source.
        </p>
        <div className="flex gap-2">
          <Button>Save changes</Button>
          <Button variant="outline">Reset to default</Button>
        </div>
      </section>
    </div>
  );
}

function Field({ label, defaultValue }: { label: string; defaultValue: string }) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input
        defaultValue={defaultValue}
        className="mt-1 w-full h-9 rounded-lg border border-input bg-background px-3 text-sm"
      />
    </label>
  );
}
