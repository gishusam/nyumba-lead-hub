import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw, Users, PhoneCall, CalendarCheck2, Trophy, Loader2 } from "lucide-react";
import { reportsApi, type WeeklyReport } from "@/lib/api";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/reports")({
  head: () => ({ meta: [{ title: "Reports — Nyumba Zetu" }] }),
  component: ReportsPage,
});

function ReportsPage() {
  const q = useQuery({ queryKey: ["reports", "weekly"], queryFn: reportsApi.weekly });
  const r: WeeklyReport = q.data ?? {};
  const a = r.activity ?? {};

  const cards = [
    { label: "New Leads", value: a.new_leads, icon: Users },
    { label: "Calls Made", value: a.calls_made, icon: PhoneCall },
    { label: "Demos Booked", value: a.demos_booked, icon: CalendarCheck2 },
    { label: "Won", value: a.won, icon: Trophy },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Weekly Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sales activity and scraping coverage across the pipeline.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => q.refetch()}
          disabled={q.isFetching}
        >
          {q.isFetching ? (
            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-1.5" />
          )}
          Refresh
        </Button>
      </div>

      {/* SECTION A */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Sales activity (this week)</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {cards.map((k) => {
            const Icon = k.icon;
            return (
              <div key={k.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">{k.label}</div>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="mt-2 text-2xl font-semibold tabular-nums">
                  {q.isLoading ? "…" : (k.value ?? 0)}
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="text-sm font-semibold mb-3">Top Performer</div>
            {r.top_performer ? (
              <div>
                <div className="text-lg font-semibold">{r.top_performer.name}</div>
                <div className="mt-2 flex gap-6 text-sm">
                  <div>
                    <div className="text-xs text-muted-foreground">Calls</div>
                    <div className="tabular-nums font-medium">{r.top_performer.calls ?? 0}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Demos</div>
                    <div className="tabular-nums font-medium">{r.top_performer.demos ?? 0}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Won</div>
                    <div className="tabular-nums font-medium">{r.top_performer.won ?? 0}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground italic">
                No activity recorded yet this week
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-muted/40 p-5">
            <div className="text-xs text-muted-foreground">Developers tracked</div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">
              {r.developers_tracked ?? 0}
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Company-wide leads, not area-specific
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="font-semibold">Follow-ups due</h3>
          </div>
          {(r.follow_ups_due ?? []).length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground italic">
              No follow-ups due — pipeline is clean
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-muted-foreground">
                  <tr className="text-left">
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Area</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Days overdue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(r.follow_ups_due ?? []).map((f, i) => {
                    const overdue = f.days_overdue > 0;
                    const dueToday = f.days_overdue === 0;
                    const cls = overdue
                      ? "bg-destructive/10 text-destructive border-destructive/20"
                      : dueToday
                        ? "bg-warning/15 text-warning-foreground border-warning/30"
                        : "bg-muted text-muted-foreground";
                    return (
                      <tr key={f.id ?? i} className="hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">{f.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{f.area ?? "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{f.lead_type ?? "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}>
                            {overdue
                              ? `${f.days_overdue}d overdue`
                              : dueToday
                                ? "Due today"
                                : `In ${Math.abs(f.days_overdue)}d`}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* SECTION B */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Coverage by area</h2>
          <p className="text-sm text-muted-foreground">
            Areas where lead data has been collected
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium">Area</th>
                <th className="px-4 py-3 font-medium">Apartments</th>
                <th className="px-4 py-3 font-medium">Agencies</th>
                <th className="px-4 py-3 font-medium">Landlords</th>
                <th className="px-4 py-3 font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(r.coverage ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                    {q.isLoading ? "Loading…" : "No coverage data yet."}
                  </td>
                </tr>
              )}
              {(r.coverage ?? []).map((c) => (
                <tr key={c.area} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{c.area}</td>
                  <CoverageCell v={c.apartments ?? 0} />
                  <CoverageCell v={c.agencies ?? 0} />
                  <CoverageCell v={c.landlords ?? 0} />
                  <CoverageCell v={c.total ?? 0} bold />
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <h3 className="font-semibold">
            Untapped areas ({(r.untapped_areas ?? []).length})
          </h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {(r.untapped_areas ?? []).map((a) => (
              <span
                key={a}
                className="inline-flex items-center rounded-full bg-muted text-muted-foreground px-2.5 py-1 text-xs font-medium"
              >
                {a}
              </span>
            ))}
            {(r.untapped_areas ?? []).length === 0 && (
              <span className="text-sm text-muted-foreground italic">
                All tracked areas have some data.
              </span>
            )}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            These areas have no scraped data yet. Run the scraper on these areas to
            find new leads.
          </p>
        </div>
      </section>
    </div>
  );
}

function CoverageCell({ v, bold }: { v: number; bold?: boolean }) {
  const cls =
    v > 0
      ? "bg-success/15 text-success"
      : "bg-muted text-muted-foreground";
  return (
    <td className="px-4 py-3">
      <span
        className={`inline-flex min-w-[2rem] justify-center rounded-md px-2 py-0.5 text-xs tabular-nums ${cls} ${bold ? "font-semibold" : "font-medium"}`}
      >
        {v}
      </span>
    </td>
  );
}
