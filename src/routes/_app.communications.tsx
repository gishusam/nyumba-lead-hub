import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Download,
  Mail,
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
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_app/communications")({
  head: () => ({ meta: [{ title: "Communications — Nyumba Zetu" }] }),
  component: CommunicationsPage,
});

type CampaignStatus = "Delivered" | "Sending" | "Draft";
type CampaignType = "Email" | "Newsletter" | "Event";

type Campaign = {
  id: string;
  name: string;
  subject: string;
  type: CampaignType;
  status: CampaignStatus;
  sentAt: string;
  recipients: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  failed: number;
  owner: string;
  segment: string;
};

const campaigns: Campaign[] = [
  {
    id: "kilimani-agency-event",
    name: "Kilimani Agency Event",
    subject: "You're invited: Kilimani Agency Partner Event",
    type: "Event",
    status: "Delivered",
    sentAt: "14 Aug 2026, 09:15",
    recipients: 48,
    delivered: 46,
    opened: 31,
    clicked: 12,
    bounced: 1,
    failed: 1,
    owner: "Alice Wanjiku",
    segment: "Kilimani agencies",
  },
  {
    id: "product-demo-outreach",
    name: "Product Demo Outreach",
    subject: "See Nyumba Zetu lead intelligence in action",
    type: "Email",
    status: "Delivered",
    sentAt: "13 Aug 2026, 14:30",
    recipients: 72,
    delivered: 69,
    opened: 52,
    clicked: 26,
    bounced: 2,
    failed: 1,
    owner: "Brian Otieno",
    segment: "Qualified agency leads",
  },
  {
    id: "customer-product-update",
    name: "Customer Product Update",
    subject: "A faster way to work your property leads",
    type: "Email",
    status: "Delivered",
    sentAt: "11 Aug 2026, 10:00",
    recipients: 39,
    delivered: 37,
    opened: 24,
    clicked: 9,
    bounced: 1,
    failed: 1,
    owner: "Alice Wanjiku",
    segment: "Active customers",
  },
  {
    id: "monthly-property-insights",
    name: "Monthly Property Insights",
    subject: "Nairobi property demand: August highlights",
    type: "Newsletter",
    status: "Delivered",
    sentAt: "05 Aug 2026, 08:00",
    recipients: 41,
    delivered: 39,
    opened: 27,
    clicked: 7,
    bounced: 2,
    failed: 0,
    owner: "Brian Otieno",
    segment: "Property newsletter subscribers",
  },
  {
    id: "westlands-portfolio-intro",
    name: "Westlands Portfolio Intro",
    subject: "A clearer view of Westlands opportunities",
    type: "Email",
    status: "Sending",
    sentAt: "14 Aug 2026, 16:20",
    recipients: 29,
    delivered: 23,
    opened: 8,
    clicked: 2,
    bounced: 1,
    failed: 0,
    owner: "Brian Otieno",
    segment: "Westlands portfolio owners",
  },
  {
    id: "landlord-welcome",
    name: "Landlord Welcome Series",
    subject: "Welcome to better lead visibility",
    type: "Email",
    status: "Draft",
    sentAt: "Not sent",
    recipients: 24,
    delivered: 0,
    opened: 0,
    clicked: 0,
    bounced: 0,
    failed: 0,
    owner: "Alice Wanjiku",
    segment: "New landlord leads",
  },
];

const topPerformingCampaign = campaigns.find(
  (campaign) => campaign.id === "product-demo-outreach",
)!;
const topPerformingDelivery = [
  {
    name: "Delivered",
    value: topPerformingCampaign.delivered,
    color: "var(--color-chart-1)",
  },
  { name: "Bounced", value: topPerformingCampaign.bounced, color: "var(--color-chart-3)" },
  { name: "Failed", value: topPerformingCampaign.failed, color: "var(--color-chart-5)" },
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
  { name: "Email", value: 4, color: "var(--color-chart-1)" },
  { name: "Newsletter", value: 1, color: "var(--color-chart-2)" },
  { name: "Event", value: 1, color: "var(--color-chart-3)" },
];

const domainRows = [
  { domain: "gmail.com", delivered: 28, rate: "96.6%", width: "97%" },
  { domain: "outlook.com", delivered: 16, rate: "94.1%", width: "94%" },
  { domain: "company domains", delivered: 19, rate: "90.5%", width: "91%" },
  { domain: "yahoo.com", delivered: 6, rate: "85.7%", width: "86%" },
];

const detailNav = ["Overview", "Recipients", "Delivered", "Bounced", "Failed", "Activity log"];
const pageSize = 5;

function percentage(part: number, total: number) {
  return total ? `${((part / total) * 100).toFixed(1)}%` : "0.0%";
}

function StatusPill({ status }: { status: CampaignStatus }) {
  const tone =
    status === "Delivered"
      ? "bg-success/10 text-success"
      : status === "Sending"
        ? "bg-info/10 text-info"
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

function timelineFor(campaign: Campaign) {
  const delivered = campaign.delivered;
  const bounced = campaign.bounced;
  const failed = campaign.failed;
  return [
    { time: "0 min", delivered: 0, bounced: 0, failed: 0 },
    {
      time: "15 min",
      delivered: Math.round(delivered * 0.52),
      bounced: Math.round(bounced * 0.5),
      failed: 0,
    },
    {
      time: "30 min",
      delivered: Math.round(delivered * 0.79),
      bounced,
      failed: Math.round(failed * 0.5),
    },
    { time: "45 min", delivered: Math.round(delivered * 0.91), bounced, failed },
    { time: "2 hrs", delivered: Math.round(delivered * 0.98), bounced, failed },
    { time: "24 hrs", delivered, bounced, failed },
  ];
}

function CommunicationsPage() {
  const [selectedId, setSelectedId] = useState("product-demo-outreach");
  const [page, setPage] = useState(1);
  const [newCampaignOpen, setNewCampaignOpen] = useState(false);
  const [detailTab, setDetailTab] = useState("Overview");
  const selected = campaigns.find((campaign) => campaign.id === selectedId) ?? campaigns[0];
  const totalPages = Math.ceil(campaigns.length / pageSize);
  const visibleCampaigns = campaigns.slice((page - 1) * pageSize, page * pageSize);

  const selectCampaign = (campaign: Campaign) => {
    setSelectedId(campaign.id);
    setDetailTab("Overview");
  };

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
        <Button className="shadow-sm" onClick={() => setNewCampaignOpen(true)}>
          <Plus /> New Campaign
        </Button>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-info" aria-hidden="true" />
        <span>
          <span className="font-semibold text-foreground">Local demo data.</span> A campaign service
          is not connected; metrics are deterministic examples.
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
            value="229"
            detail="Across sent campaigns"
            tone="neutral"
          />
          <ArrowRight
            className="hidden h-4 w-4 text-muted-foreground sm:block"
            aria-hidden="true"
          />
          <OverviewMetric
            label="Delivered"
            value="214"
            detail="93.4% delivery rate"
            tone="success"
          />
          <ArrowRight
            className="hidden h-4 w-4 text-muted-foreground sm:block"
            aria-hidden="true"
          />
          <OverviewMetric label="Bounced" value="7" detail="3.1% of recipients" tone="warning" />
          <ArrowRight
            className="hidden h-4 w-4 text-muted-foreground sm:block"
            aria-hidden="true"
          />
          <OverviewMetric label="Failed" value="3" detail="1.3% of recipients" tone="destructive" />
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
                {campaigns.length} local campaigns
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
                          {campaign.sentAt}
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
                title="Export is unavailable until a campaign service is connected"
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
                {detailTab === "Overview" ? (
                  <>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <OverviewMetric
                        label="Recipients"
                        value={String(selected.recipients)}
                        detail="Targeted audience"
                        tone="neutral"
                      />
                      <OverviewMetric
                        label="Delivered"
                        value={String(selected.delivered)}
                        detail={percentage(selected.delivered, selected.recipients)}
                        tone="success"
                      />
                      <OverviewMetric
                        label="Opened"
                        value={String(selected.opened)}
                        detail={percentage(selected.opened, selected.delivered)}
                        tone="neutral"
                      />
                      <OverviewMetric
                        label="Clicked"
                        value={String(selected.clicked)}
                        detail={percentage(selected.clicked, selected.delivered)}
                        tone="neutral"
                      />
                    </div>
                    {selected.status === "Draft" ? (
                      <div className="mt-6 border-t border-border pt-5">
                        <h3 className="text-sm font-semibold">Delivery timeline</h3>
                        <div className="mt-3 rounded-md bg-muted/60 p-3 text-sm">
                          <div className="font-medium">Not sent yet</div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Delivery activity will appear after this draft is sent through a
                            connected campaign service.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-5 border-t border-border pt-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <h3 className="text-sm font-semibold">Delivery timeline</h3>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              Most delivery completed in the first 45 minutes.
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground">{selected.sentAt}</span>
                        </div>
                        <div className="mt-4 h-52 rounded-lg border border-border bg-muted/20 p-3">
                          <ResponsiveContainer>
                            <LineChart
                              data={timelineFor(selected)}
                              margin={{ top: 6, right: 4, left: -18, bottom: 0 }}
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
                              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
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
                ) : (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">{detailTab}</p>
                    <p className="mt-1">
                      Campaign event data will appear here when a campaign service is connected.
                    </p>
                  </div>
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
            <p className="mt-0.5 text-xs text-muted-foreground">Local campaign mix</p>
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
            <h2 id="domains-heading" className="text-sm font-semibold">
              Delivery by domain
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Product Demo Outreach recipients</p>
            <div className="mt-4 space-y-3">
              {domainRows.map((row) => (
                <div key={row.domain}>
                  <div className="flex justify-between gap-3 text-xs">
                    <span className="font-medium">{row.domain}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {row.delivered} delivered · {row.rate}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-success" style={{ width: row.width }} />
                  </div>
                </div>
              ))}
            </div>
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
                <dd className="text-right font-medium">{selected.segment}</dd>
              </div>
              <div className="flex justify-between gap-4 py-2">
                <dt className="text-muted-foreground">Owner</dt>
                <dd className="font-medium">{selected.owner}</dd>
              </div>
              <div className="flex justify-between gap-4 py-2">
                <dt className="text-muted-foreground">Sent</dt>
                <dd className="text-right font-medium">{selected.sentAt}</dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>

      <Dialog open={newCampaignOpen} onOpenChange={setNewCampaignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Campaign creation is not connected</DialogTitle>
            <DialogDescription>
              This workspace uses deterministic local campaign data because Nyumba Zetu does not yet
              have a campaign service or API. Creating or sending a campaign is unavailable until
              that service is connected.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2 font-medium text-foreground">
              <Mail className="h-4 w-4 text-primary" /> What is available now
            </div>
            <p className="mt-1">
              Review local campaign delivery examples and inspect selected campaign details.
            </p>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
