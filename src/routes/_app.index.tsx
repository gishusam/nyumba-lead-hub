import { createFileRoute } from "@tanstack/react-router";
import {
  Users, UserPlus, PhoneCall, CalendarCheck2, Trophy, TrendingUp,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { activity, funnel, kpis, leadsByArea, leadsBySource } from "@/data/mock";

export const Route = createFileRoute("/_app/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Nyumba Zetu Lead Intelligence" },
      { name: "description", content: "Lead intelligence and sales pipeline for property management." },
    ],
  }),
  component: Dashboard,
});

const kpiItems = [
  { label: "Total Leads", value: kpis.totalLeads, icon: Users, delta: "+12%", tone: "text-success" },
  { label: "New Leads", value: kpis.newLeads, icon: UserPlus, delta: "+4 this week", tone: "text-info" },
  { label: "Calls This Week", value: kpis.callsThisWeek, icon: PhoneCall, delta: "+18%", tone: "text-success" },
  { label: "Demos Booked", value: kpis.demoBooked, icon: CalendarCheck2, delta: "+3", tone: "text-success" },
  { label: "Won Customers", value: kpis.wonCustomers, icon: Trophy, delta: "+2", tone: "text-success" },
  { label: "Conversion Rate", value: `${kpis.conversionRate}%`, icon: TrendingUp, delta: "+1.2 pts", tone: "text-success" },
];

const sourceColors = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)"];

function Dashboard() {
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
              <div className="mt-2 text-2xl font-semibold tabular-nums">{k.value}</div>
              <div className={`mt-1 text-xs ${k.tone}`}>{k.delta}</div>
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
            <ResponsiveContainer>
              <PieChart>
                <Pie data={leadsBySource} dataKey="value" nameKey="source" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {leadsBySource.map((_, i) => (
                    <Cell key={i} fill={sourceColors[i]} />
                  ))}
                </Pie>
                <Legend verticalAlign="bottom" iconType="circle" />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Lead Status Funnel</h3>
          </div>
          <div className="space-y-3">
            {funnel.map((f) => {
              const max = Math.max(...funnel.map((x) => x.value));
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
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Leads by Area</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={leadsByArea} margin={{ left: -10, right: 10, top: 6, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="area" tick={{ fontSize: 10 }} interval={0} angle={-30} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip cursor={{ fill: "var(--color-muted)" }} />
                <Bar dataKey="value" fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold">Recent Activity</h3>
          <span className="text-xs text-muted-foreground">Last 48 hours</span>
        </div>
        <ul className="divide-y divide-border">
          {activity.map((a) => (
            <li key={a.id} className="flex items-center gap-4 px-5 py-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                {a.who.split(" ").map((s) => s[0]).join("")}
              </div>
              <div className="flex-1 text-sm">
                <span className="font-medium">{a.who}</span>{" "}
                <span className="text-muted-foreground">{a.action}</span>{" "}
                <span className="font-medium">{a.target}</span>
              </div>
              <div className="text-xs text-muted-foreground">{a.when}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
