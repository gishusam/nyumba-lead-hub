import { createFileRoute } from "@tanstack/react-router";
import {
  Users, UserPlus, PhoneCall, CalendarCheck2, Trophy, TrendingUp,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi, STATUS_LABEL, type LeadStatusApi } from "@/lib/api";
import { WeekFollowupsStrip } from "@/components/WeekFollowupsStrip";

export const Route = createFileRoute("/_app/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Nyumba Zetu Lead Intelligence" },
      { name: "description", content: "Lead intelligence and sales pipeline for property management." },
    ],
  }),
  component: Dashboard,
});

const sourceColors = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)"];

function Dashboard() {
  const summary = useQuery({ queryKey: ["dashboard", "summary"], queryFn: dashboardApi.summary });
  const bySource = useQuery({ queryKey: ["dashboard", "by-source"], queryFn: dashboardApi.bySource });
  const funnel = useQuery({ queryKey: ["dashboard", "funnel"], queryFn: dashboardApi.funnel });
  const byArea = useQuery({ queryKey: ["dashboard", "by-area"], queryFn: dashboardApi.byArea });
  const activity = useQuery({ queryKey: ["dashboard", "activity"], queryFn: dashboardApi.activity });

  const s = summary.data;
  const kpiItems = [
    { label: "Total Leads", value: s?.total_leads ?? "—", icon: Users },
    { label: "New Leads", value: s?.new_leads ?? "—", icon: UserPlus },
    { label: "Calls This Week", value: s?.calls_this_week ?? "—", icon: PhoneCall },
    { label: "Demos Booked", value: s?.demos_booked ?? "—", icon: CalendarCheck2 },
    { label: "Won Customers", value: s?.won_customers ?? "—", icon: Trophy },
    { label: "Conversion Rate", value: s ? `${s.conversion_rate}%` : "—", icon: TrendingUp },
  ];

  const sourceData = (bySource.data ?? []).map((r) => ({ source: r.type, value: r.count }));
  const funnelData = (funnel.data ?? []).map((r) => ({
    stage: STATUS_LABEL[r.status as LeadStatusApi] ?? r.status,
    value: r.count,
  }));
  const areaData = (byArea.data ?? []).map((r) => ({ area: r.area, value: r.count }));

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Lead Intelligence</h1>
        <p className="text-sm text-muted-foreground mt-1">
          A live view of the Nairobi property management opportunity pipeline.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpiItems.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">{k.label}</div>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="mt-2 text-2xl font-semibold tabular-nums">
                {summary.isLoading ? "…" : k.value}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Leads by Source</h3>
            <span className="text-xs text-muted-foreground">All time</span>
          </div>
          <div className="h-64">
            {bySource.isLoading ? (
              <SkeletonBlock />
            ) : sourceData.length === 0 ? (
              <EmptyState label="No source data yet" />
            ) : (
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={sourceData} dataKey="value" nameKey="source" innerRadius={55} outerRadius={90} paddingAngle={2}>
                    {sourceData.map((_, i) => (
                      <Cell key={i} fill={sourceColors[i % sourceColors.length]} />
                    ))}
                  </Pie>
                  <Legend verticalAlign="bottom" iconType="circle" />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Lead Status Funnel</h3>
          </div>
          {funnel.isLoading ? (
            <SkeletonBlock />
          ) : funnelData.length === 0 ? (
            <EmptyState label="No funnel data" />
          ) : (
            <div className="space-y-3">
              {funnelData.map((f) => {
                const max = Math.max(...funnelData.map((x) => x.value), 1);
                const pct = (f.value / max) * 100;
                return (
                  <div key={f.stage}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium">{f.stage}</span>
                      <span className="text-muted-foreground tabular-nums">{f.value}</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Leads by Area</h3>
          </div>
          <div className="h-64">
            {byArea.isLoading ? (
              <SkeletonBlock />
            ) : areaData.length === 0 ? (
              <EmptyState label="No area data" />
            ) : (
              <ResponsiveContainer>
                <BarChart data={areaData} margin={{ left: -10, right: 10, top: 6, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="area" tick={{ fontSize: 10 }} interval={0} angle={-30} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip cursor={{ fill: "var(--color-muted)" }} />
                  <Bar dataKey="value" fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold">Recent Activity</h3>
          <span className="text-xs text-muted-foreground">Latest updates</span>
        </div>
        {activity.isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading activity…</div>
        ) : (activity.data ?? []).length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">No recent activity.</div>
        ) : (
          <ul className="divide-y divide-border">
            {activity.data!.map((a) => {
              const who = a.assigned_to || "Unassigned";
              const initials = who.split(" ").map((p) => p[0]).slice(0, 2).join("");
              return (
                <li key={a.id} className="flex items-center gap-4 px-5 py-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                    {initials}
                  </div>
                  <div className="flex-1 text-sm">
                    <span className="font-medium">{who}</span>{" "}
                    <span className="text-muted-foreground">
                      updated {a.lead_type} →{" "}
                      {STATUS_LABEL[a.status as LeadStatusApi] ?? a.status}
                    </span>{" "}
                    <span className="font-medium">{a.name}</span>{" "}
                    {a.area && <span className="text-muted-foreground">· {a.area}</span>}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {a.updated_at ? new Date(a.updated_at).toLocaleString() : ""}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function SkeletonBlock() {
  return <div className="h-full w-full animate-pulse rounded-lg bg-muted/40" />;
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}
