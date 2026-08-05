import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  MailCheck,
  ShieldCheck,
} from "lucide-react";

export const Route = createFileRoute("/_app/communications/")({
  component: CommunicationsOverviewFoundation,
});

function CommunicationsOverviewFoundation() {
  return (
    <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(16rem,0.5fr)]">
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Activity className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 className="font-semibold text-foreground">
              Communications overview
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              The workspace route and navigation are ready. Live delivery,
              engagement, readiness, and provider-event data are wired in the
              next implementation task.
            </p>
          </div>
        </div>
      </div>

      <aside className="rounded-xl border border-border bg-muted/25 p-5">
        <h2 className="text-sm font-semibold text-foreground">
          Foundation status
        </h2>
        <div className="mt-4 space-y-3 text-sm">
          <StatusRow
            icon={MailCheck}
            label="Authenticated API client"
          />
          <StatusRow
            icon={ShieldCheck}
            label="Readiness contract"
          />
        </div>
      </aside>
    </div>
  );
}

function StatusRow({
  icon: Icon,
  label,
}: {
  icon: typeof MailCheck;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <Icon className="h-4 w-4 text-primary" />
      <span>{label}</span>
    </div>
  );
}
