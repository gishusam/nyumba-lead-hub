import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  Ban,
  CheckCircle2,
  Clock3,
  FileWarning,
  Gauge,
  Inbox,
  MailCheck,
  MailOpen,
  MousePointerClick,
  RefreshCw,
  Send,
  ShieldCheck,
  UserRoundX,
} from "lucide-react";
import type { ComponentType } from "react";

import { getCurrentUser } from "../../lib/api";
import {
  communicationsApi,
  type ProviderEvent,
} from "../../lib/communications-api";
import {
  buildOverviewViewModel,
  type OverviewMetricId,
  type OverviewRateId,
} from "./overview-model";
import {
  canManageCommunications,
  formatCommunicationsTimestamp,
  providerEventLabel,
  resolveOverviewState,
} from "./communications-overview-state";
import { OverviewError } from "./OverviewError";
import { OverviewSkeleton } from "./OverviewSkeleton";

type IconComponent = ComponentType<{ className?: string }>;

const metricIcons: Record<OverviewMetricId, IconComponent> = {
  total: Send,
  delivered: MailCheck,
  campaigns: Activity,
  newsletters: MailOpen,
  suppressed: UserRoundX,
};

const rateIcons: Record<OverviewRateId, IconComponent> = {
  delivery: Gauge,
  open: MailOpen,
  click: MousePointerClick,
};

export function CommunicationsOverview() {
  const overviewQuery = useQuery({
    queryKey: ["communications", "overview"],
    queryFn: communicationsApi.overview,
  });

  const readinessQuery = useQuery({
    queryKey: ["communications", "readiness"],
    queryFn: communicationsApi.readiness,
  });

  const eventsQuery = useQuery({
    queryKey: ["communications", "events", 8],
    queryFn: () => communicationsApi.events({ limit: 8 }),
  });

  const coreState = resolveOverviewState({
    overviewPending: overviewQuery.isPending,
    readinessPending: readinessQuery.isPending,
    overviewFailed: overviewQuery.isError,
    readinessFailed: readinessQuery.isError,
  });

  if (coreState === "loading") {
    return <OverviewSkeleton />;
  }

  if (
    coreState === "error" ||
    !overviewQuery.data ||
    !readinessQuery.data
  ) {
    const error =
      overviewQuery.error ??
      readinessQuery.error;

    return (
      <OverviewError
        title="Communications data unavailable"
        message={errorMessage(error)}
        onRetry={() => {
          void Promise.all([
            overviewQuery.refetch(),
            readinessQuery.refetch(),
          ]);
        }}
      />
    );
  }

  const model = buildOverviewViewModel(
    overviewQuery.data,
    readinessQuery.data,
  );
  const canManage = canManageCommunications(
    getCurrentUser()?.role,
  );

  const schemaIssues = [
    ...readinessQuery.data.schema.missing_tables.map(
      (item) => `Missing table: ${item}`,
    ),
    ...readinessQuery.data.schema.missing_columns.map(
      (item) => `Missing column: ${item}`,
    ),
    ...readinessQuery.data.schema.missing_indexes.map(
      (item) => `Missing index: ${item}`,
    ),
    ...readinessQuery.data.schema.mismatched_constraints.map(
      (item) => `Constraint mismatch: ${item}`,
    ),
    ...(readinessQuery.data.schema.error
      ? [readinessQuery.data.schema.error]
      : []),
  ];

  const readinessIssues = Array.from(
    new Set([
      ...model.readiness.issues,
      ...schemaIssues,
    ]),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">
            Operational overview
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Live delivery, engagement, provider activity, and system readiness.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            void Promise.all([
              overviewQuery.refetch(),
              readinessQuery.refetch(),
              eventsQuery.refetch(),
            ]);
          }}
          disabled={
            overviewQuery.isFetching ||
            readinessQuery.isFetching ||
            eventsQuery.isFetching
          }
          className="inline-flex min-h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              overviewQuery.isFetching ||
              readinessQuery.isFetching ||
              eventsQuery.isFetching
                ? "animate-spin"
                : ""
            }`}
          />
          Refresh
        </button>
      </div>

      {model.isEmpty ? <OperationalEmptyState /> : null}

      <section aria-labelledby="communications-metrics-heading">
        <h2
          id="communications-metrics-heading"
          className="sr-only"
        >
          Communications metrics
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {model.metrics.map((metric) => {
            const Icon = metricIcons[metric.id];

            return (
              <article
                key={metric.id}
                className="min-w-0 rounded-xl border border-border bg-card p-5 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {metric.label}
                  </p>
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                </div>
                <p className="mt-4 text-3xl font-semibold tabular-nums text-foreground">
                  {metric.value.toLocaleString()}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section
        aria-labelledby="communications-rates-heading"
        className="grid gap-4 lg:grid-cols-3"
      >
        <h2 id="communications-rates-heading" className="sr-only">
          Communications rates
        </h2>
        {model.rates.map((rate) => {
          const Icon = rateIcons[rate.id];

          return (
            <article
              key={rate.id}
              className="rounded-xl border border-border bg-card p-5 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {rate.label}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {rate.numerator.toLocaleString()} of{" "}
                    {rate.denominator.toLocaleString()}{" "}
                    {rate.denominatorLabel}
                  </p>
                </div>
                <Icon className="h-5 w-5 shrink-0 text-primary" />
              </div>

              <div className="mt-5 flex items-end justify-between gap-3">
                <p className="text-3xl font-semibold tabular-nums">
                  {formatPercentage(rate.value)}
                </p>
                <span className="text-xs text-muted-foreground">
                  Current rate
                </span>
              </div>
            </article>
          );
        })}
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
        <DeliveryStatusPanel
          statuses={model.deliveryStatuses}
        />

        <ReadinessPanel
          ready={readinessQuery.data.ready}
          status={model.readiness.status}
          label={model.readiness.label}
          environment={model.readiness.environment}
          schemaReady={model.readiness.schemaReady}
          checkedAt={model.readiness.checkedAt}
          issues={readinessIssues}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
        <ProviderActivityPanel
          events={eventsQuery.data ?? []}
          isPending={eventsQuery.isPending}
          isError={eventsQuery.isError}
          error={eventsQuery.error}
          onRetry={() => {
            void eventsQuery.refetch();
          }}
        />

        <FutureActionsPanel canManage={canManage} />
      </div>
    </div>
  );
}

function OperationalEmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6">
      <div className="flex items-start gap-3">
        <Inbox className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
        <div>
          <h2 className="font-semibold text-foreground">
            No communications activity yet
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            The system is connected, but there are no messages, active
            campaigns, newsletters, or suppression records to report.
          </p>
        </div>
      </div>
    </div>
  );
}

function DeliveryStatusPanel({
  statuses,
}: {
  statuses: ReturnType<
    typeof buildOverviewViewModel
  >["deliveryStatuses"];
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <Activity className="h-4 w-4 text-primary" />
        <h2 className="font-semibold text-foreground">
          Delivery status
        </h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Message counts and their share of total activity.
      </p>

      <div className="mt-6 space-y-4">
        {statuses.map((status) => (
          <div key={status.id}>
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-muted-foreground">
                {status.label}
              </span>
              <span className="shrink-0 font-medium tabular-nums text-foreground">
                {status.value.toLocaleString()} ·{" "}
                {formatPercentage(status.percentage)}
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-[width]"
                style={{
                  width: `${Math.min(
                    Math.max(status.percentage, 0),
                    100,
                  )}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ReadinessPanel({
  ready,
  status,
  label,
  environment,
  schemaReady,
  checkedAt,
  issues,
}: {
  ready: boolean;
  status: "healthy" | "degraded";
  label: string;
  environment: string;
  schemaReady: boolean;
  checkedAt: string;
  issues: string[];
}) {
  const healthy = ready && status === "healthy";
  const Icon = healthy ? CheckCircle2 : AlertTriangle;

  return (
    <section className="min-w-0 rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <h2 className="font-semibold text-foreground">
              System readiness
            </h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Environment and Communications schema checks.
          </p>
        </div>

        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
            healthy
              ? "border-primary/20 bg-primary/10 text-primary"
              : "border-destructive/25 bg-destructive/10 text-destructive"
          }`}
        >
          <Icon className="h-3.5 w-3.5" />
          {healthy ? label : "Needs attention"}
        </span>
      </div>

      <dl className="mt-5 grid gap-3 text-sm">
        <ReadinessRow
          label="Environment"
          value={environment || "Unknown"}
        />
        <ReadinessRow
          label="Schema"
          value={schemaReady ? "Ready" : "Not ready"}
        />
        <ReadinessRow
          label="Checked"
          value={formatCommunicationsTimestamp(checkedAt)}
        />
      </dl>

      {!healthy ? (
        <div className="mt-5 rounded-lg border border-destructive/20 bg-destructive/5 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-destructive">
            Readiness issues
          </p>
          {issues.length > 0 ? (
            <ul className="mt-2 space-y-2">
              {issues.map((issue) => (
                <li
                  key={issue}
                  className="break-words text-sm leading-5 text-muted-foreground"
                >
                  {issue}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              The backend reports that Communications is not ready.
            </p>
          )}
        </div>
      ) : null}
    </section>
  );
}

function ReadinessRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border pb-3 last:border-0 last:pb-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-right font-medium text-foreground">
        {value}
      </dd>
    </div>
  );
}

function ProviderActivityPanel({
  events,
  isPending,
  isError,
  error,
  onRetry,
}: {
  events: ProviderEvent[];
  isPending: boolean;
  isError: boolean;
  error: unknown;
  onRetry: () => void;
}) {
  return (
    <section className="min-w-0 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="border-b border-border px-5 py-4">
        <h2 className="font-semibold text-foreground">
          Recent provider activity
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The eight most recent delivery and engagement events.
        </p>
      </div>

      {isPending ? (
        <div
          aria-label="Loading provider activity"
          className="space-y-3 p-5"
        >
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="h-14 animate-pulse rounded-lg bg-muted"
            />
          ))}
        </div>
      ) : isError ? (
        <div className="p-5">
          <div className="rounded-lg border border-border bg-muted/20 p-4">
            <div className="flex items-start gap-3">
              <FileWarning className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="font-medium text-foreground">
                  Provider activity unavailable
                </p>
                <p className="mt-1 break-words text-sm text-muted-foreground">
                  {errorMessage(error)}
                </p>
                <button
                  type="button"
                  onClick={onRetry}
                  className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium hover:bg-muted"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry activity
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : events.length === 0 ? (
        <div className="p-6 text-sm text-muted-foreground">
          No provider events have been recorded yet.
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {events.map((event) => (
            <li
              key={event.id}
              className="flex min-w-0 items-start gap-3 px-5 py-4"
            >
              <ProviderEventIcon event={event} />
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <p className="font-medium text-foreground">
                    {providerEventLabel(event.event_type)}
                  </p>
                  <time className="shrink-0 text-xs text-muted-foreground">
                    {formatCommunicationsTimestamp(
                      event.occurred_at,
                    )}
                  </time>
                </div>
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  {event.recipient_email ?? "Recipient unavailable"}
                </p>
                <p className="mt-1 break-words text-xs text-muted-foreground">
                  {event.provider}
                  {event.reason ? ` · ${event.reason}` : ""}
                  {event.url ? ` · ${event.url}` : ""}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ProviderEventIcon({
  event,
}: {
  event: ProviderEvent;
}) {
  let Icon: IconComponent = Clock3;

  if (
    event.event_type === "delivered" ||
    event.event_type === "opened" ||
    event.event_type === "clicked"
  ) {
    Icon = CheckCircle2;
  } else if (
    event.event_type === "hard_bounce" ||
    event.event_type === "soft_bounce" ||
    event.event_type === "complaint"
  ) {
    Icon = AlertTriangle;
  } else if (event.event_type === "unsubscribe") {
    Icon = Ban;
  }

  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
      <Icon className="h-4 w-4" />
    </div>
  );
}

function FutureActionsPanel({
  canManage,
}: {
  canManage: boolean;
}) {
  return (
    <aside className="rounded-xl border border-border bg-muted/20 p-5">
      <h2 className="font-semibold text-foreground">
        Next actions
      </h2>

      {canManage ? (
        <>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Campaign and newsletter creation arrives in a later
            implementation slice.
          </p>
          <div className="mt-5 grid gap-3">
            <button
              type="button"
              disabled
              className="inline-flex min-h-10 cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground opacity-55"
            >
              <Send className="h-4 w-4" />
              Create campaign
            </button>
            <button
              type="button"
              disabled
              className="inline-flex min-h-10 cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground opacity-55"
            >
              <MailOpen className="h-4 w-4" />
              Create newsletter
            </button>
          </div>
        </>
      ) : (
        <div className="mt-4 rounded-lg border border-border bg-card p-4">
          <p className="text-sm font-medium text-foreground">
            Read-only access
          </p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Ask an administrator or manager for campaign and
            newsletter configuration access.
          </p>
        </div>
      )}
    </aside>
  );
}

function formatPercentage(value: number): string {
  return `${value.toLocaleString(undefined, {
    maximumFractionDigits: 1,
  })}%`;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "The service could not be reached. Check the API connection and retry.";
}
