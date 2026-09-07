import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Download,
  MessageSquare,
  Plus,
} from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import {
  communicationsApi,
  type CampaignPerformanceRecipient,
} from "@/lib/api";
import {
  buildDeliveryTimeline,
  buildDomainRows,
  paginateRows,
  summarizeCampaigns,
  toDashboardCampaign,
  type DashboardCampaign,
  type DashboardCampaignStatus,
} from "./communications-dashboard-data";

type Campaign = DashboardCampaign;
type CampaignStatus = DashboardCampaignStatus;

const detailNav = ["Overview", "Recipients", "Delivered", "Bounced", "Failed", "Activity log"];
const pageSize = 5;

function percentage(part: number, total: number) {
  return total ? `${((part / total) * 100).toFixed(1)}%` : "0.0%";
}

function formatCampaignDate(value: string | null) {
  if (!value) return "Not sent";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function StatusPill({ status }: { status: CampaignStatus }) {
  const tone =
    status === "Sent"
      ? "bg-success/10 text-success"
      : status === "Sending"
        ? "bg-info/10 text-info"
        : status === "Failed"
          ? "bg-destructive/10 text-destructive"
          : status === "Ready"
            ? "bg-warning/15 text-warning-foreground"
            : "bg-muted text-muted-foreground";
  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${tone}`}>
      {status}
    </span>
  );
}

function OverviewMetric({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  tone: "neutral" | "success" | "warning" | "destructive";
}) {
  const styles = {
    neutral: "bg-muted/70 text-foreground",
    success: "bg-success/10 text-success",
    warning: "bg-warning/15 text-warning-foreground",
    destructive: "bg-destructive/10 text-destructive",
  };

  return (
    <div className={`rounded-lg px-3 py-3 text-center sm:px-4 ${styles[tone]}`}>
      <div className="text-[10px] font-semibold uppercase tracking-wide opacity-70">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
      <div className="mt-0.5 text-[11px] font-medium opacity-75">{detail}</div>
    </div>
  );
}

function DonutVisual({
  segments,
  value,
  label,
}: {
  segments: Array<{ value: number; color: string }>;
  value: string;
  label: string;
}) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0) || 1;
  let progress = 0;
  const gradient = segments
    .map((segment) => {
      const start = (progress / total) * 100;
      progress += segment.value;
      const end = (progress / total) * 100;
      return `${segment.color} ${start}% ${Math.max(start, end - 1.5)}%`;
    })
    .join(", ");

  return (
    <div
      className="relative grid h-24 w-24 shrink-0 place-items-center rounded-full"
      style={{ background: `conic-gradient(${gradient})` }}
      aria-label={`${value} ${label}`}
      role="img"
    >
      <div className="grid h-[68px] w-[68px] place-items-center rounded-full bg-card text-center shadow-sm">
        <div>
          <div className="text-xl font-semibold leading-none tabular-nums">{value}</div>
          <div className="mt-1 text-[10px] font-medium leading-none text-muted-foreground">
            {label}
          </div>
        </div>
      </div>
    </div>
  );
}

function PaginationControls({
  from,
  to,
  total,
  page,
  totalPages,
  label,
  onPrevious,
  onNext,
}: {
  from: number;
  to: number;
  total: number;
  page: number;
  totalPages: number;
  label: string;
  onPrevious: () => void;
  onNext: () => void;
}) {
  if (total <= 10) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
      <div className="text-xs tabular-nums text-muted-foreground">
        {from}–{to} of {total} {label}
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={onPrevious}
        >
          Previous
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={onNext}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

export function CommunicationsDashboard() {
  const campaignQuery = useQuery({
    queryKey: ["communications", "campaigns"],
    queryFn: communicationsApi.list,
  });

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [detailTab, setDetailTab] = useState("Overview");
  const [detailPage, setDetailPage] = useState(1);
  const [domainPage, setDomainPage] = useState(1);

  const apiCampaigns = campaignQuery.data ?? [];
  const campaigns = apiCampaigns.map(toDashboardCampaign);
  const summary = summarizeCampaigns(apiCampaigns);

  const selected =
    campaigns.find((campaign) => campaign.id === selectedId) ??
    campaigns[0];

  useEffect(() => {
    setDetailPage(1);
    setDomainPage(1);
  }, [selected?.id]);

  useEffect(() => {
    setDetailPage(1);
  }, [detailTab]);

  const performanceQuery = useQuery({
    queryKey: [
      "communications",
      "campaigns",
      selected?.id,
      "performance",
    ],
    queryFn: () =>
      communicationsApi.performance(selected!.id),
    enabled: Boolean(selected),
  });

  const performance = performanceQuery.data;
  const performanceRecipients =
    performance?.recipients ?? [];

  const deliveryTimeline =
    buildDeliveryTimeline(performanceRecipients);

  const domainRows =
    buildDomainRows(performanceRecipients).sort(
      (a, b) =>
        b.recipients - a.recipients ||
        a.domain.localeCompare(b.domain),
    );

  const detailRecipients =
    detailTab === "Delivered"
      ? performanceRecipients.filter(
          (recipient) => Boolean(recipient.delivered_at),
        )
      : detailTab === "Bounced"
        ? performanceRecipients.filter(
            (recipient) => Boolean(recipient.bounced_at),
          )
        : detailTab === "Failed"
          ? performanceRecipients.filter(
              (recipient) => Boolean(recipient.failed_at),
            )
          : performanceRecipients;

  const recipientPagination = paginateRows(
    detailRecipients,
    detailPage,
    10,
  );

  const domainPagination = paginateRows(
    domainRows,
    domainPage,
    10,
  );

  const activityRows = performanceRecipients
    .flatMap((recipient) => {
      const events: Array<{
        email: string;
        name: string | null | undefined;
        event: string;
        timestamp: string;
        detail?: string | null;
      }> = [];

      const addEvent = (
        event: string,
        timestamp?: string | null,
        detail?: string | null,
      ) => {
        if (!timestamp) return;

        events.push({
          email: recipient.email,
          name: recipient.name,
          event,
          timestamp,
          detail,
        });
      };

      addEvent("Sent", recipient.sent_at);
      addEvent("Delivered", recipient.delivered_at);
      addEvent("Opened", recipient.opened_at);
      addEvent("Clicked", recipient.clicked_at);
      addEvent(
        "Bounced",
        recipient.bounced_at,
        recipient.bounce_reason,
      );
      addEvent(
        "Failed",
        recipient.failed_at,
        recipient.error,
      );

      return events;
    })
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() -
        new Date(a.timestamp).getTime(),
    );

  const totalPages = Math.max(
    1,
    Math.ceil(campaigns.length / pageSize),
  );

  const visibleCampaigns = campaigns.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  const selectCampaign = (campaign: Campaign) => {
    setSelectedId(campaign.id);
    setDetailTab("Overview");
  };

  if (campaignQuery.isLoading) {
    return (
      <div className="mx-auto max-w-[1500px] space-y-5 p-4 sm:p-6 lg:p-8">
        <h1 className="text-3xl font-semibold tracking-tight">
          Communications
        </h1>
        <div className="rounded-xl border border-border bg-card p-8 text-sm text-muted-foreground shadow-sm">
          Loading campaigns…
        </div>
      </div>
    );
  }

  if (campaignQuery.isError) {
    return (
      <div className="mx-auto max-w-[1500px] space-y-5 p-4 sm:p-6 lg:p-8">
        <h1 className="text-3xl font-semibold tracking-tight">
          Communications
        </h1>
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
          <div className="font-medium text-destructive">
            Could not load campaigns
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Check the Communications API connection and try again.
          </p>
        </div>
      </div>
    );
  }

  if (!selected) {
    return (
      <div className="mx-auto max-w-[1500px] space-y-5 p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Communications
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              No campaigns have been created yet.
            </p>
          </div>

          <Button asChild>
            <Link to="/communications/new">
              <Plus /> New Campaign
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const topPerformingCampaign = campaigns.reduce(
    (best, campaign) =>
      campaign.delivered > best.delivered ? campaign : best,
    campaigns[0],
  );

  const topPerformingDelivery = [
    {
      name: "Delivered",
      value: topPerformingCampaign.delivered,
      color: "var(--color-chart-1)",
    },
    {
      name: "Bounced",
      value: topPerformingCampaign.bounced,
      color: "var(--color-chart-3)",
    },
    {
      name: "Failed",
      value: topPerformingCampaign.failed,
      color: "var(--color-chart-5)",
    },
    {
      name: "Pending",
      value: Math.max(
        topPerformingCampaign.recipients -
          topPerformingCampaign.delivered -
          topPerformingCampaign.bounced -
          topPerformingCampaign.failed,
        0,
      ),
      color: "var(--color-muted)",
    },
  ].filter((item) => item.value > 0);

  const campaignTypes = [
    {
      name: "Cold Outreach",
      value: campaigns.filter(
        (campaign) => campaign.type === "Cold Outreach",
      ).length,
      color: "var(--color-chart-1)",
    },
    {
      name: "Newsletter",
      value: campaigns.filter(
        (campaign) => campaign.type === "Newsletter",
      ).length,
      color: "var(--color-chart-2)",
    },
    {
      name: "Unknown",
      value: campaigns.filter(
        (campaign) => campaign.type === "Unknown",
      ).length,
      color: "var(--color-muted-foreground)",
    },
  ].filter((item) => item.value > 0);

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 overflow-x-hidden p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-primary">
            <MessageSquare className="h-3.5 w-3.5" /> Outreach workspace
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Communications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create, monitor, and review campaign delivery across your lead audience.
          </p>
        </div>
        <Button asChild className="shadow-sm">
          <Link to="/communications/new">
            <Plus /> New Campaign
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full bg-success"
          aria-hidden="true"
        />
        <span>
          <span className="font-semibold text-foreground">
            Live campaign data.
          </span>{" "}
          Campaigns and delivery totals are loaded from the Communications API.
        </span>
      </div>

      <section
        aria-labelledby="campaign-overview-heading"
        className="rounded-xl border border-border bg-card shadow-sm"
      >
        <div className="flex items-center justify-between gap-3 px-4 pb-3 pt-4 sm:px-5">
          <div className="min-w-0">
            <h2 id="campaign-overview-heading" className="text-sm font-semibold">
              All campaigns overview
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Delivery performance across sent campaigns
            </p>
          </div>
          <Button
            className="shrink-0 text-primary hover:text-primary"
            variant="ghost"
            size="sm"
            onClick={() => setPage(1)}
          >
            View all campaigns
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2 border-t border-border p-3 sm:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] sm:items-center sm:gap-3 sm:p-4">
          <OverviewMetric
            label="Total recipients"
            value={String(summary.recipients)}
            detail="Across sent campaigns"
            tone="neutral"
          />
          <ArrowRight
            className="hidden h-4 w-4 text-muted-foreground sm:block"
            aria-hidden="true"
          />
          <OverviewMetric
            label="Delivered"
            value={String(summary.delivered)}
            detail={`${percentage(summary.delivered, summary.recipients)} delivery rate`}
            tone="success"
          />
          <ArrowRight
            className="hidden h-4 w-4 text-muted-foreground sm:block"
            aria-hidden="true"
          />
          <OverviewMetric
            label="Bounced"
            value={String(summary.bounced)}
            detail={`${percentage(summary.bounced, summary.recipients)} of recipients`}
            tone="warning"
          />
          <ArrowRight
            className="hidden h-4 w-4 text-muted-foreground sm:block"
            aria-hidden="true"
          />
          <OverviewMetric
            label="Failed"
            value={String(summary.failed)}
            detail={`${percentage(summary.failed, summary.recipients)} of recipients`}
            tone="destructive"
          />
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="min-w-0 space-y-5">
          <section
            aria-labelledby="recent-campaigns-heading"
            className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
          >
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-4 sm:px-5">
              <div>
                <h2 id="recent-campaigns-heading" className="text-sm font-semibold">
                  Recent campaigns
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Select a campaign to inspect delivery details.
                </p>
              </div>
              <span className="text-xs text-muted-foreground">
                {campaigns.length} campaigns
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full table-fixed text-sm">
                <thead className="bg-muted/45 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="w-[44%] px-4 py-3 sm:w-[40%]">Campaign</th>
                    <th className="hidden px-2 py-3 sm:table-cell sm:w-[14%]">Type</th>
                    <th className="w-[18%] px-2 py-3 sm:w-[13%]">Recipients</th>
                    <th className="w-[21%] px-2 py-3 sm:w-[16%]">Delivery</th>
                    <th className="hidden w-[18%] px-2 py-3 lg:table-cell">Sent</th>
                    <th className="w-[17%] px-3 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {visibleCampaigns.map((campaign) => {
                    const active = campaign.id === selected.id;
                    return (
                      <tr key={campaign.id} className={active ? "bg-accent/70" : undefined}>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            aria-pressed={active}
                            aria-label={`${active ? "Selected" : "Select"} campaign: ${campaign.name}`}
                            onClick={() => selectCampaign(campaign)}
                            className="w-full rounded-sm text-left outline-none transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          >
                            <div className="truncate font-medium">{campaign.name}</div>
                            <div className="mt-0.5 truncate text-xs text-muted-foreground">
                              {campaign.subject}
                            </div>
                          </button>
                        </td>
                        <td className="hidden px-2 py-3 text-muted-foreground sm:table-cell">
                          {campaign.type}
                        </td>
                        <td className="px-2 py-3 tabular-nums">{campaign.recipients}</td>
                        <td className="px-2 py-3">
                          <span className="font-medium tabular-nums">
                            {percentage(campaign.delivered, campaign.recipients)}
                          </span>
                          <div className="text-[11px] text-muted-foreground">
                            {campaign.delivered} delivered
                          </div>
                        </td>
                        <td className="hidden whitespace-nowrap px-2 py-3 text-xs text-muted-foreground lg:table-cell">
                          {formatCampaignDate(campaign.sentAt)}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <StatusPill status={campaign.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 text-xs text-muted-foreground sm:px-5">
              <span>
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  aria-label="Previous campaigns page"
                  size="sm"
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  <ChevronLeft /> Previous
                </Button>
                <Button
                  aria-label="Next campaigns page"
                  size="sm"
                  variant="outline"
                  disabled={page === totalPages}
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                >
                  Next <ChevronRight />
                </Button>
              </div>
            </div>
          </section>

          <section
            aria-labelledby="selected-campaign-heading"
            className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
          >
            <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 id="selected-campaign-heading" className="truncate text-lg font-semibold">
                    {selected.name}
                  </h2>
                  <StatusPill status={selected.status} />
                </div>
                <p className="mt-1 truncate text-sm text-muted-foreground">{selected.subject}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled
                title="Campaign export is not available yet"
              >
                <Download /> Export
              </Button>
            </div>
            <div className="lg:grid lg:grid-cols-[10rem_minmax(0,1fr)]">
              <nav
                aria-label="Selected campaign sections"
                className="overflow-x-auto border-b border-border lg:overflow-visible lg:border-b-0 lg:border-r"
              >
                <div className="flex min-w-max gap-1 px-3 py-2 lg:min-w-0 lg:flex-col lg:gap-1 lg:px-3 lg:py-4">
                  {detailNav.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setDetailTab(item)}
                      className={`inline-flex rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:w-full lg:justify-start ${detailTab === item ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </nav>
              <div className="min-w-0 p-4 sm:p-5">
                {performanceQuery.isLoading ? (
                  <div className="py-10 text-center text-sm text-muted-foreground">
                    Loading campaign performance…
                  </div>
                ) : performanceQuery.isError ? (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                    <div className="text-sm font-medium text-destructive">
                      Could not load campaign performance
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      The campaign exists, but its detailed delivery data could not be loaded.
                    </p>
                  </div>
                ) : detailTab === "Overview" && performance ? (
                  <>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <OverviewMetric
                        label="Recipients"
                        value={String(performance.summary.recipients)}
                        detail="Targeted audience"
                        tone="neutral"
                      />
                      <OverviewMetric
                        label="Delivered"
                        value={String(performance.summary.delivered)}
                        detail={`${performance.summary.delivery_rate.toFixed(1)}%`}
                        tone="success"
                      />
                      <OverviewMetric
                        label="Opened"
                        value={String(performance.summary.opened)}
                        detail={`${performance.summary.open_rate.toFixed(1)}%`}
                        tone="neutral"
                      />
                      <OverviewMetric
                        label="Clicked"
                        value={String(performance.summary.clicked)}
                        detail={`${performance.summary.click_rate.toFixed(1)}%`}
                        tone="neutral"
                      />
                    </div>

                    {(selected.status === "Draft" ||
                      selected.status === "Ready") ? (
                      <div className="mt-6 border-t border-border pt-5">
                        <h3 className="text-sm font-semibold">
                          Delivery timeline
                        </h3>
                        <div className="mt-3 rounded-md bg-muted/60 p-3 text-sm">
                          <div className="font-medium">
                            Not sent yet
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Delivery activity will appear once this campaign is sent.
                          </p>
                        </div>
                      </div>
                    ) : deliveryTimeline.length === 0 ? (
                      <div className="mt-6 border-t border-border pt-5">
                        <h3 className="text-sm font-semibold">
                          Delivery timeline
                        </h3>
                        <div className="mt-3 rounded-md bg-muted/60 p-3 text-sm text-muted-foreground">
                          No delivery events have been received for this campaign yet.
                        </div>
                      </div>
                    ) : (
                      <div className="mt-5 border-t border-border pt-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <h3 className="text-sm font-semibold">
                              Delivery timeline
                            </h3>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              Actual delivery events reported for campaign recipients.
                            </p>
                          </div>

                          <span className="text-xs text-muted-foreground">
                            {formatCampaignDate(selected.sentAt)}
                          </span>
                        </div>

                        <div className="mt-4 h-52 rounded-lg border border-border bg-muted/20 p-3">
                          <ResponsiveContainer>
                            <LineChart
                              data={deliveryTimeline}
                              margin={{
                                top: 6,
                                right: 4,
                                left: -18,
                                bottom: 0,
                              }}
                            >
                              <CartesianGrid
                                stroke="var(--color-border)"
                                strokeDasharray="3 3"
                                vertical={false}
                              />
                              <XAxis
                                dataKey="time"
                                tick={{ fontSize: 10 }}
                                tickLine={false}
                                axisLine={false}
                              />
                              <YAxis
                                tick={{ fontSize: 10 }}
                                tickLine={false}
                                axisLine={false}
                              />
                              <Tooltip />
                              <Legend
                                iconType="circle"
                                iconSize={7}
                                wrapperStyle={{ fontSize: 11 }}
                              />
                              <Line
                                type="monotone"
                                dataKey="delivered"
                                name="Delivered"
                                stroke="var(--color-chart-1)"
                                strokeWidth={2.5}
                                dot={false}
                              />
                              <Line
                                type="monotone"
                                dataKey="bounced"
                                name="Bounced"
                                stroke="var(--color-chart-3)"
                                strokeWidth={2}
                                dot={false}
                              />
                              <Line
                                type="monotone"
                                dataKey="failed"
                                name="Failed"
                                stroke="var(--color-chart-5)"
                                strokeWidth={2}
                                dot={false}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                  </>
                ) : detailTab === "Activity log" ? (
                  activityRows.length === 0 ? (
                    <div className="py-10 text-center text-sm text-muted-foreground">
                      No campaign activity has been recorded yet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="border-b border-border text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          <tr>
                            <th className="px-2 py-2">
                              Recipient
                            </th>
                            <th className="px-2 py-2">
                              Event
                            </th>
                            <th className="px-2 py-2">
                              Time
                            </th>
                            <th className="px-2 py-2">
                              Detail
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {activityRows.map((row, index) => (
                            <tr
                              key={`${row.email}-${row.event}-${row.timestamp}-${index}`}
                            >
                              <td className="px-2 py-3">
                                <div className="font-medium">
                                  {row.name || row.email}
                                </div>
                                {row.name ? (
                                  <div className="text-xs text-muted-foreground">
                                    {row.email}
                                  </div>
                                ) : null}
                              </td>
                              <td className="px-2 py-3">
                                {row.event}
                              </td>
                              <td className="whitespace-nowrap px-2 py-3 text-xs text-muted-foreground">
                                {formatCampaignDate(
                                  row.timestamp,
                                )}
                              </td>
                              <td className="px-2 py-3 text-xs text-muted-foreground">
                                {row.detail || "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                ) : (
                  <>
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold">
                          {detailTab}
                        </h3>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {detailRecipients.length} recipient
                          {detailRecipients.length === 1
                            ? ""
                            : "s"}
                        </p>
                      </div>
                    </div>

                    {detailRecipients.length === 0 ? (
                      <div className="rounded-lg bg-muted/50 px-4 py-8 text-center text-sm text-muted-foreground">
                        No recipients in this category.
                      </div>
                    ) : (
                      <div className="space-y-3">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="border-b border-border text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            <tr>
                              <th className="px-2 py-2">
                                Recipient
                              </th>
                              <th className="px-2 py-2">
                                Status
                              </th>
                              <th className="px-2 py-2">
                                Opens
                              </th>
                              <th className="px-2 py-2">
                                Clicks
                              </th>
                              <th className="px-2 py-2">
                                Last activity
                              </th>
                            </tr>
                          </thead>

                          <tbody className="divide-y divide-border">
                            {recipientPagination.items.map(
                              (
                                recipient: CampaignPerformanceRecipient,
                              ) => (
                                <tr key={recipient.email}>
                                  <td className="px-2 py-3">
                                    <div className="font-medium">
                                      {recipient.name ||
                                        recipient.email}
                                    </div>
                                    {recipient.name ? (
                                      <div className="text-xs text-muted-foreground">
                                        {recipient.email}
                                      </div>
                                    ) : null}
                                  </td>

                                  <td className="px-2 py-3 capitalize">
                                    {recipient.status}
                                  </td>

                                  <td className="px-2 py-3 tabular-nums">
                                    {recipient.open_count}
                                  </td>

                                  <td className="px-2 py-3 tabular-nums">
                                    {recipient.click_count}
                                  </td>

                                  <td className="whitespace-nowrap px-2 py-3 text-xs text-muted-foreground">
                                    {formatCampaignDate(
                                      recipient.last_event_at ??
                                        recipient.failed_at ??
                                        recipient.bounced_at ??
                                        recipient.clicked_at ??
                                        recipient.opened_at ??
                                        recipient.delivered_at ??
                                        recipient.sent_at ??
                                        null,
                                    )}
                                  </td>
                                </tr>
                              ),
                            )}
                          </tbody>
                        </table>
                      </div>

                      <PaginationControls
                        from={recipientPagination.from}
                        to={recipientPagination.to}
                        total={recipientPagination.total}
                        page={recipientPagination.page}
                        totalPages={recipientPagination.totalPages}
                        label="recipients"
                        onPrevious={() =>
                          setDetailPage(
                            recipientPagination.page - 1,
                          )
                        }
                        onNext={() =>
                          setDetailPage(
                            recipientPagination.page + 1,
                          )
                        }
                      />
                    </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </section>
        </div>

        <aside className="min-w-0 space-y-5">
          <section
            aria-labelledby="top-performing-heading"
            className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="top-performing-heading" className="text-sm font-semibold">
                  Top performing campaign
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">By delivered recipients</p>
              </div>
              <span className="rounded-full bg-success/10 px-2 py-1 text-[11px] font-semibold text-success">
                Best delivery
              </span>
            </div>
            <div className="mt-4 flex items-center gap-4">
              <DonutVisual
                segments={topPerformingDelivery}
                value={String(topPerformingCampaign.recipients)}
                label="recipients"
              />
              <div className="min-w-0">
                <div className="font-medium">{topPerformingCampaign.name}</div>
                <div className="mt-1 text-2xl font-semibold tabular-nums text-success">
                  {topPerformingCampaign.delivered}
                </div>
                <div className="text-xs text-muted-foreground">
                  Delivered of {topPerformingCampaign.recipients} recipients
                </div>
                <div className="mt-3 space-y-1.5">
                  {topPerformingDelivery.map((entry) => (
                    <div
                      key={entry.name}
                      className="flex items-center justify-between gap-3 text-[11px]"
                    >
                      <span className="flex items-center gap-1.5">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: entry.color }}
                        />
                        {entry.name}
                      </span>
                      <span className="tabular-nums">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
          <section
            aria-labelledby="campaign-types-heading"
            className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5"
          >
            <h2 id="campaign-types-heading" className="text-sm font-semibold">
              Campaign types
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Current campaign mix</p>
            <div className="mt-4 flex items-center gap-4">
              <DonutVisual
                segments={campaignTypes}
                value={String(campaignTypes.reduce((sum, item) => sum + item.value, 0))}
                label="campaigns"
              />
              <div className="flex-1 space-y-2">
                {campaignTypes.map((entry) => (
                  <div key={entry.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: entry.color }}
                      />
                      {entry.name}
                    </span>
                    <span className="font-medium tabular-nums">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
          <section
            aria-labelledby="domains-heading"
            className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5"
          >
            <h2
              id="domains-heading"
              className="text-sm font-semibold"
            >
              Delivery by domain
            </h2>

            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {selected.name} recipients
            </p>

            {performanceQuery.isLoading ? (
              <div className="mt-4 text-xs text-muted-foreground">
                Loading domain delivery…
              </div>
            ) : performanceQuery.isError ? (
              <div className="mt-4 text-xs text-destructive">
                Domain delivery unavailable.
              </div>
            ) : domainRows.length === 0 ? (
              <div className="mt-4 rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
                No recipient domain delivery data yet.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {domainPagination.items.map((row) => (
                  <div key={row.domain}>
                    <div className="flex justify-between gap-3 text-xs">
                      <span className="truncate font-medium">
                        {row.domain}
                      </span>

                      <span className="shrink-0 tabular-nums text-muted-foreground">
                        {row.delivered} / {row.recipients} ·{" "}
                        {row.deliveryRate.toFixed(1)}%
                      </span>
                    </div>

                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-success"
                        style={{
                          width: `${row.deliveryRate}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}

                <PaginationControls
                  from={domainPagination.from}
                  to={domainPagination.to}
                  total={domainPagination.total}
                  page={domainPagination.page}
                  totalPages={domainPagination.totalPages}
                  label="domains"
                  onPrevious={() =>
                    setDomainPage(
                      domainPagination.page - 1,
                    )
                  }
                  onNext={() =>
                    setDomainPage(
                      domainPagination.page + 1,
                    )
                  }
                />
              </div>
            )}
          </section>
          <section
            aria-labelledby="campaign-details-heading"
            className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5"
          >
            <h2 id="campaign-details-heading" className="text-sm font-semibold">
              Campaign details
            </h2>
            <dl className="mt-3 divide-y divide-border text-sm">
              <div className="flex justify-between gap-4 py-2">
                <dt className="text-muted-foreground">Campaign type</dt>
                <dd className="font-medium">{selected.type}</dd>
              </div>
              <div className="flex justify-between gap-4 py-2">
                <dt className="text-muted-foreground">Audience</dt>
                <dd className="text-right font-medium">{selected.audience}</dd>
              </div>
              <div className="flex justify-between gap-4 py-2">
                <dt className="text-muted-foreground">Owner</dt>
                <dd className="font-medium">{selected.owner}</dd>
              </div>
              <div className="flex justify-between gap-4 py-2">
                <dt className="text-muted-foreground">Sent</dt>
                <dd className="text-right font-medium">{formatCampaignDate(selected.sentAt)}</dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>

    </div>
  );
}
