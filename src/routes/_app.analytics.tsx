import { createFileRoute } from "@tanstack/react-router";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi, type LeadStatusApi, STATUS_LABEL } from "@/lib/api";
import { AREAS, teamPerformance, sourcePerformance } from "@/data/mock";

export const Route = createFileRoute("/_app/analytics")({
  head: () => ({ meta: [{ title: "Analytics — Nyumba Zetu" }] }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const funnelQ = useQuery({
    queryKey: ["dashboard", "funnel"],
    queryFn: dashboardApi.funnel,
    staleTime: 5 * 60 * 1000,
  });
  const areaQ = useQuery({
    queryKey: ["dashboard", "by-area"],
    queryFn: () => dashboardApi.byArea(),
    staleTime: 5 * 60 * 1000,
  });
  const sourceQ = useQuery({
    queryKey: ["dashboard", "by-source"],
    queryFn: dashboardApi.bySource,
    staleTime: 5 * 60 * 1000,
  });

  const funnelData = (funnelQ.data ?? []).map((r) => ({
    stage: STATUS_LABEL[r.status as LeadStatusApi] ?? r.status,
    value: r.count,
  }));
  const maxFunnel = Math.max(...funnelData.map((f) => f.value), 1);

  const areaData = (areaQ.data ?? []).map((r) => ({ area: r.area, value: r.count }));
  const topAreas = [...areaData].sort((a, b) => b.value - a.value).slice(0, 6);

  // Source data from real API; augmented with mock won/conv when unavailable
  const sourceData = (sourceQ.data ?? []).map((r) => {
    const mock = sourcePerformance.find((s) => s.source.toLowerCase() === r.type?.toLowerCase());
    return { source: r.type, leads: r.count, won: mock?.won ?? 0 };
  });

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Pipeline performance across sources, areas and team.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="font-semibold mb-4">Sales Funnel</h3>
          {funnelQ.isLoading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3, 4].map((i) => <div key={i} className="h-7 rounded-md bg-muted" />)}
            </div>
          ) : funnelData.length === 0 ? (
            <div className="text-sm text-muted-foreground italic">No funnel data yet.</div>
          ) : (
            <div className="space-y-3">
              {funnelData.map((f) => {
                const pct = (f.value / maxFunnel) * 100;
                return (
                  <div key={f.stage} className="flex items-center gap-3">
                    <div className="w-28 text-sm font-medium">{f.stage}</div>
                    <div className="flex-1 h-7 rounded-md bg-muted overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-primary/70 flex items-center justify-end px-2 text-xs font-semibold text-primary-foreground"
                        style={{ width: `${pct}%` }}
                      >
                        {f.value}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="font-semibold mb-4">Top Performing Areas — Nairobi</h3>
          {areaQ.isLoading ? (
            <div className="space-y-2 animate-pulse">
              {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-8 rounded-md bg-muted" />)}
            </div>
          ) : topAreas.length === 0 ? (
            <div className="text-sm text-muted-foreground italic">No area data yet.</div>
          ) : (
            <>
              <div className="space-y-2">
                {topAreas.map((a, i) => (
                  <div key={a.area} className="flex items-center gap-3">
                    <div className="w-6 text-xs text-muted-foreground tabular-nums">#{i + 1}</div>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{a.area}</span>
                        <span className="text-muted-foreground tabular-nums">{a.value} leads</span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-success"
                          style={{ width: `${(a.value / (topAreas[0]?.value || 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-xs text-muted-foreground">
                Covering {AREAS.length} neighborhoods across Nairobi metro.
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="font-semibold mb-4">Lead Source Performance</h3>
          {sourceQ.isLoading ? (
            <div className="h-72 animate-pulse rounded-lg bg-muted/40" />
          ) : (
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={sourceData.length ? sourceData : sourcePerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="source" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="leads" name="Leads" fill="var(--color-chart-2)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="won" name="Won" fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="font-semibold mb-4">Sales Team Performance</h3>
          <table className="w-full text-sm">
            <thead className="text-muted-foreground text-left text-xs uppercase">
              <tr>
                <th className="py-2 font-medium">Rep</th>
                <th className="py-2 font-medium">Calls</th>
                <th className="py-2 font-medium">Demos</th>
                <th className="py-2 font-medium">Conv.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {teamPerformance.map((t) => (
                <tr key={t.name}>
                  <td className="py-3 font-medium">{t.name}</td>
                  <td className="py-3 tabular-nums">{t.calls}</td>
                  <td className="py-3 tabular-nums">{t.demos}</td>
                  <td className="py-3">
                    <span className="inline-flex items-center rounded-md bg-success/10 text-success px-2 py-0.5 text-xs font-semibold">
                      {t.conversion}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-muted-foreground italic">
            Team performance data is updated manually by your admin.
          </p>
        </div>
      </div>
    </div>
  );
}
