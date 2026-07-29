import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Loader2, CheckCircle2, XCircle, History, AlertTriangle, TrendingUp,
  Filter, ArrowRight, ChevronLeft, ChevronRight,
} from "lucide-react";

import { scraperApi, type ScraperRun, type ScraperType as ApiScraperType, type ScraperRunRecordOutcome } from "@/lib/api";
import { ScraperCommandWorkspace } from "@/components/ScraperCommandWorkspace";
import {
  PAGE_SIZE_OPTIONS,
  paginate,
  paginationItems,
} from "@/lib/pagination";
import { groupFailedRuns } from "@/lib/scraper-run-health";

export const Route = createFileRoute("/_app/scrape")({
  head: () => ({ meta: [{ title: "Lead Acquisition Pipeline — Nyumba Zetu" }] }),
  component: ScrapePage,
});

type ScraperType = ApiScraperType;
const SCRAPERS: { id: ScraperType; label: string }[] = [
  { id: "apartments", label: "Apartments" },
  { id: "agencies",   label: "Agencies" },
  { id: "developers", label: "Developers" },
];

function fmtTime(d: Date) {
  return d.toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function parseDate(s?: string | null): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function runAreas(r: ScraperRun): string {
  if (r.areas && r.areas.length) return r.areas.join(", ");
  return r.area ?? "—";
}

function runStartedAt(r: ScraperRun): Date | null {
  return parseDate(r.started_at) ?? parseDate(r.created_at);
}

function ScrapePage() {
  const qc = useQueryClient();
  const [scraper, setScraper] = useState<ScraperType>("apartments");
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [selectedRunId, setSelectedRunId] = useState<number | null>(null);
  const [historyFilter, setHistoryFilter] = useState<{ source: string; area: string }>({ source: "All", area: "All" });
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(5);

  const optionsQuery = useQuery({
    queryKey: ["scraper", "options"],
    queryFn: scraperApi.options,
    staleTime: 5 * 60 * 1000,
  });

  // Runs query — poll while anything is running
  const runsQuery = useQuery({
    queryKey: ["scraper", "runs"],
    queryFn: async () => {
      const raw = await scraperApi.runs();
      const list = Array.isArray(raw) ? raw : raw.data;
      return list ?? [];
    },
    refetchInterval: (q) => {
      const data = q.state.data as ScraperRun[] | undefined;
      return data && data.some((r) => r.status === "running") ? 10_000 : false;
    },
  });

  const runs: ScraperRun[] = useMemo(
    () => runsQuery.data ?? [],
    [runsQuery.data],
  );

  // Run mutation
  const runMutation = useMutation({
    mutationFn: ({ scraper_type, areas }: { scraper_type: ScraperType; areas: string[] }) =>
      scraperApi.run(scraper_type, areas),
    onSuccess: (res) => {
      toast.success("Scraper started");
      setSelectedRunId(res.run_id);
      qc.invalidateQueries({ queryKey: ["scraper", "runs"] });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "unknown error";
      toast.error(`Failed to start scraper: ${message}`);
    },
  });

  const startRun = () => {
    if (scraper !== "developers" && !selectedAreaId) {
      toast.error("Pick at least one area");
      return;
    }
    runMutation.mutate({
      scraper_type: scraper,
      areas: scraper === "developers" ? [] : [selectedAreaId!],
    });
  };

  // Latest run for results card: selected, else newest
  const sortedRuns = [...runs].sort((a, b) => {
    const at = runStartedAt(a)?.getTime() ?? 0;
    const bt = runStartedAt(b)?.getTime() ?? 0;
    return bt - at;
  });
  const latestRun: ScraperRun | null =
    (selectedRunId != null ? sortedRuns.find((r) => r.id === selectedRunId) : null) ??
    sortedRuns[0] ?? null;

  // KPIs
  const kpi = runs.reduce(
    (a, r) => {
      a.total += 1;
      a.found += r.records_found ?? 0;
      a.imported += r.imported ?? 0;
      a.updated += r.updated ?? 0;
      a.duplicates += r.duplicates ?? 0;
      a.rejected += r.rejected ?? 0;
      return a;
    },
    { total: 0, found: 0, imported: 0, updated: 0, duplicates: 0, rejected: 0 },
  );

  const filteredRuns = sortedRuns.filter(
    (r) =>
      (historyFilter.source === "All" || r.scraper_type === historyFilter.source) &&
      (historyFilter.area === "All" || runAreas(r).includes(historyFilter.area)),
  );
  const paginatedRuns = paginate(filteredRuns, historyPage, historyPageSize);
  const runHealthGroups = useMemo(() => groupFailedRuns(runs), [runs]);
  const unknownPatternNumbers = useMemo(
    () =>
      new Map(
        runHealthGroups
          .filter((group) => group.key === "unknown")
          .map((group, index) => [group.groupKey, index + 1]),
      ),
    [runHealthGroups],
  );
  const failedRunCount = runHealthGroups.reduce(
    (total, group) => total + group.runs.length,
    0,
  );

  const anyRunning = runs.some((r) => r.status === "running");
  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-[1500px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-primary mb-1">Lead Operations</div>
          <h1 className="text-2xl font-semibold">Lead Acquisition Pipeline</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Discover, validate and import new sales leads across the Nairobi metro.
          </p>
        </div>
        <button
          onClick={() => runsQuery.refetch()}
          className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 h-9 text-sm font-medium hover:bg-accent"
        >
          <History className="h-4 w-4" /> Refresh History
        </button>
      </div>

      {/* KPI cards */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { l: "Runs Loaded",    v: kpi.total,      tone: "" },
          { l: "Records Found",  v: kpi.found,      tone: "" },
          { l: "Imported",       v: kpi.imported,   tone: "text-success" },
          { l: "Updated",        v: kpi.updated,    tone: "text-primary" },
          { l: "Duplicates",     v: kpi.duplicates, tone: "text-warning" },
          { l: "Rejected",       v: kpi.rejected,   tone: "text-destructive" },
        ].map((k) => (
          <div key={k.l} className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <div className={`text-2xl font-semibold tabular-nums ${k.tone}`}>{k.v.toLocaleString()}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5 uppercase tracking-wide">{k.l}</div>
          </div>
        ))}
      </section>

      <ScraperCommandWorkspace
        options={optionsQuery.data}
        optionsLoading={optionsQuery.isLoading}
        optionsError={optionsQuery.isError}
        runs={runs}
        scraper={scraper}
        selectedAreaId={selectedAreaId}
        onScraperChange={setScraper}
        onSelectedAreaChange={setSelectedAreaId}
        onRun={startRun}
        runPending={runMutation.isPending}
        anyRunning={anyRunning}
      />

      {/* SECTION 3: Pipeline visual for latest run */}
      {latestRun && latestRun.status === "success" && (
        <section className="rounded-xl border border-border bg-card shadow-sm p-6">
          <div className="text-sm font-semibold mb-1">Import Pipeline</div>
          <div className="text-xs text-muted-foreground mb-5">
            How {latestRun.records_found ?? 0} scraped records moved through the system
          </div>
          <div className="flex items-stretch gap-2 overflow-x-auto">
            {[
              { l: "Scraped",     v: latestRun.records_found ?? 0, tone: "bg-muted text-foreground" },
              { l: "With Contacts", v: latestRun.with_contacts ?? 0, tone: "bg-primary/10 text-primary" },
              { l: "Imported",    v: latestRun.imported ?? 0,      tone: "bg-success/15 text-success" },
              { l: "Updated",     v: latestRun.updated ?? 0,       tone: "bg-primary/15 text-primary" },
              { l: "Rejected",    v: latestRun.rejected ?? 0,      tone: "bg-destructive/10 text-destructive" },
            ].map((s, i, arr) => (
              <div key={s.l} className="flex items-center flex-1 min-w-[110px]">
                <div className={`flex-1 rounded-lg px-3 py-3 text-center ${s.tone}`}>
                  <div className="text-xl font-semibold tabular-nums">{s.v}</div>
                  <div className="text-[11px] font-medium mt-0.5 opacity-80">{s.l}</div>
                </div>
                {i < arr.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground mx-1 shrink-0" />}
              </div>
            ))}
          </div>
          <div className="mt-4 text-xs text-muted-foreground flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-success" />
            {latestRun.imported ?? 0} new leads added · {latestRun.updated ?? 0} updated
          </div>
        </section>
      )}

      {/* SECTION 4: Run History */}
      <section className="rounded-xl border border-border bg-card shadow-sm">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-sm font-semibold">Scrape Run History</div>
            <div className="text-xs text-muted-foreground">
              {runsQuery.isLoading ? "Loading…" : `${filteredRuns.length} runs`}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Filter className="h-3.5 w-3.5" /> Filter</div>
            <select
              aria-label="Filter history by source"
              value={historyFilter.source}
              onChange={(e) => {
                setHistoryFilter((f) => ({ ...f, source: e.target.value }));
                setHistoryPage(1);
              }}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs font-medium">
              <option>All</option>{SCRAPERS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
            <select
              aria-label="Filter history by area"
              value={historyFilter.area}
              onChange={(e) => {
                setHistoryFilter((f) => ({ ...f, area: e.target.value }));
                setHistoryPage(1);
              }}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs font-medium">
              <option>All</option>
              {Array.from(new Set(runs.flatMap((r) => (r.areas ?? (r.area ? [r.area] : []))))).map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs text-muted-foreground">
              <tr className="text-left">
                {["Date", "Source", "Area", "Found", "With Contacts", "Imported", "Updated", "Duplicates", "Rejected", "Status"].map((h) => (
                  <th key={h} className="px-4 py-2.5 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedRuns.items.map((r) => {
                const start = runStartedAt(r);
                return (
                  <tr key={r.id} onClick={() => setSelectedRunId(r.id)}
                    className={`border-t border-border hover:bg-accent/40 cursor-pointer ${selectedRunId === r.id ? "bg-accent/50" : ""}`}>
                    <td className="px-4 py-2.5 text-muted-foreground">{start ? fmtTime(start) : "—"}</td>
                    <td className="px-4 py-2.5 capitalize font-medium">{r.scraper_type}</td>
                    <td className="px-4 py-2.5">{runAreas(r)}</td>
                    <td className="px-4 py-2.5 tabular-nums">{r.records_found ?? "—"}</td>
                    <td className="px-4 py-2.5 tabular-nums">{r.with_contacts ?? "—"}</td>
                    <td className="px-4 py-2.5 tabular-nums text-success font-medium">{r.imported ?? "—"}</td>
                    <td className="px-4 py-2.5 tabular-nums text-primary">{r.updated ?? "—"}</td>
                    <td className="px-4 py-2.5 tabular-nums text-warning">{r.duplicates ?? "—"}</td>
                    <td className="px-4 py-2.5 tabular-nums text-destructive">{r.rejected ?? "—"}</td>
                    <td className="px-4 py-2.5"><RunStatusBadge status={r.status} /></td>
                  </tr>
                );
              })}
              {!runsQuery.isLoading && filteredRuns.length === 0 && (
                <tr><td colSpan={10} className="px-4 py-10 text-center text-sm text-muted-foreground">No runs yet. Start your first scrape above.</td></tr>
              )}
              {runsQuery.isLoading && (
                <tr><td colSpan={10} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Loading runs…
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
        {!runsQuery.isLoading && filteredRuns.length > 0 && (
          <PaginationFooter
            pagination={paginatedRuns}
            itemLabel="runs"
            onPageChange={setHistoryPage}
            onPageSizeChange={(pageSize) => {
              setHistoryPageSize(pageSize);
              setHistoryPage(1);
            }}
          />
        )}
      </section>

      {/* SECTION 4b: Drill-down records audit */}
      {selectedRunId != null && <RunRecordsPanel runId={selectedRunId} />}


      {/* SECTION 5: Run health */}
      <section className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-3">
          <div
            className={`h-9 w-9 rounded-lg flex items-center justify-center ${
              failedRunCount > 0
                ? "bg-destructive/10 text-destructive"
                : "bg-success/15 text-success"
            }`}
          >
            {failedRunCount > 0 ? (
              <AlertTriangle className="h-4 w-4" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
          </div>
          <div>
            <div className="text-sm font-semibold">Run health</div>
            <div className="text-xs text-muted-foreground">
              {failedRunCount > 0
                ? `${failedRunCount} failed run${failedRunCount === 1 ? "" : "s"} across ${runHealthGroups.length} issue${runHealthGroups.length === 1 ? "" : "s"} in recent history`
                : "No failures in recent history"}
            </div>
          </div>
        </div>

        {failedRunCount === 0 ? (
          <div className="px-5 py-5 text-sm text-muted-foreground">
            The recent scraper history returned by the server is healthy.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {runHealthGroups.map((group) => {
              const latestStart = runStartedAt(group.latestRun);
              return (
                <div key={group.groupKey} className="px-5 py-4">
                  <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
                    <div className="flex items-start gap-3 min-w-0">
                      <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="text-sm font-semibold">
                            {group.key === "unknown"
                              ? `${group.label} · Pattern ${unknownPatternNumbers.get(group.groupKey)}`
                              : group.label}
                          </div>
                          <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-semibold text-destructive">
                            {group.runs.length} run{group.runs.length === 1 ? "" : "s"}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {group.explanation}
                        </p>
                        <p className="mt-1.5 text-xs text-muted-foreground">
                          Latest:{" "}
                          <span className="font-medium text-foreground capitalize">
                            {group.latestRun.scraper_type} · {runAreas(group.latestRun)}
                          </span>
                          {latestStart ? ` · ${fmtTime(latestStart)}` : ""}
                        </p>
                      </div>
                    </div>
                    <details className="group">
                      <summary className="cursor-pointer list-none rounded-md border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        <span className="inline-flex items-center gap-1.5">
                          <ChevronRight className="h-3.5 w-3.5 transition-transform group-open:rotate-90" />
                          Technical details
                        </span>
                      </summary>
                      <div className="mt-3 space-y-2 md:max-w-3xl">
                        {group.runs.map((run) => {
                          const started = runStartedAt(run);
                          return (
                            <div key={run.id} className="rounded-md bg-muted/50 p-3">
                              <div className="text-xs font-semibold capitalize">
                                Run #{run.id} · {run.scraper_type} · {runAreas(run)}
                              </div>
                              <div className="mt-0.5 text-[11px] text-muted-foreground">
                                {started ? fmtTime(started) : "Time unavailable"}
                              </div>
                              <pre className="mt-2 whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-destructive">
                                {run.error || "No technical error details were returned."}
                              </pre>
                            </div>
                          );
                        })}
                      </div>
                    </details>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div className="border-t border-border bg-muted/20 px-5 py-2.5 text-[11px] text-muted-foreground">
          Based on the recent history window returned by the server (up to 50 runs).
        </div>
      </section>
    </div>
  );
}

function PaginationFooter({
  pagination,
  itemLabel,
  onPageChange,
  onPageSizeChange,
}: {
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    from: number;
    to: number;
  };
  itemLabel: string;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}) {
  return (
    <div className="border-t border-border px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>
          Showing <span className="font-semibold text-foreground tabular-nums">{pagination.from}–{pagination.to}</span>{" "}
          of <span className="font-semibold text-foreground tabular-nums">{pagination.totalItems}</span> {itemLabel}
        </span>
        <label className="inline-flex items-center gap-2">
          Rows
          <select
            aria-label={`Rows per page for ${itemLabel}`}
            value={pagination.pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            className="h-8 rounded-md border border-input bg-background px-2 text-xs font-medium text-foreground"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </label>
      </div>
      <nav aria-label={`Pagination for ${itemLabel}`} className="flex items-center gap-1.5">
        <button
          type="button"
          aria-label={`Previous page of ${itemLabel}`}
          disabled={pagination.page === 1}
          onClick={() => onPageChange(pagination.page - 1)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        {paginationItems(pagination.totalPages, pagination.page).map((item, index) =>
          item === "ellipsis" ? (
            <span key={`ellipsis-${index}`} aria-hidden="true" className="px-1 text-xs text-muted-foreground">…</span>
          ) : (
            <button
              key={item}
              type="button"
              aria-label={`Page ${item} of ${itemLabel}`}
              aria-current={item === pagination.page ? "page" : undefined}
              onClick={() => onPageChange(item)}
              className={`inline-flex h-8 min-w-8 items-center justify-center rounded-md border px-2 text-xs font-semibold ${
                item === pagination.page
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              {item}
            </button>
          ),
        )}
        <button
          type="button"
          aria-label={`Next page of ${itemLabel}`}
          disabled={pagination.page === pagination.totalPages}
          onClick={() => onPageChange(pagination.page + 1)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </nav>
    </div>
  );
}

function RunStatusBadge({ status }: { status: ScraperRun["status"] }) {
  const map = {
    success: { c: "bg-success/15 text-success",  Icon: CheckCircle2, l: "Success" },
    running: { c: "bg-primary/15 text-primary",  Icon: Loader2,      l: "Running", spin: true },
    failed:  { c: "bg-destructive/15 text-destructive", Icon: XCircle, l: "Failed" },
  } as const;
  const m = map[status] ?? map.failed;
  const Icon = m.Icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${m.c}`}>
      <Icon className={`h-3 w-3 ${"spin" in m && m.spin ? "animate-spin" : ""}`} />
      {m.l}
    </span>
  );
}

type TabKey = ScraperRunRecordOutcome;

const TAB_STYLES: Record<TabKey, { active: string; idle: string; label: string; rowTone: string }> = {
  imported:  { active: "bg-success/15 text-success border-success/40",       idle: "text-muted-foreground hover:text-foreground", label: "Imported",   rowTone: "" },
  rejected:  { active: "bg-destructive/15 text-destructive border-destructive/40", idle: "text-muted-foreground hover:text-foreground", label: "Rejected",   rowTone: "" },
  duplicate: { active: "bg-warning/20 text-warning border-warning/50",       idle: "text-muted-foreground hover:text-foreground", label: "Duplicates", rowTone: "" },
};

function RunRecordsPanel({ runId }: { runId: number }) {
  const [tab, setTab] = useState<TabKey>("rejected");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const q = useQuery({
    queryKey: ["scraper", "records", runId],
    queryFn: () => scraperApi.records(runId),
  });

  useEffect(() => {
    setPage(1);
  }, [runId]);

  const data = q.data;
  const counts = {
    imported: data?.summary?.imported ?? 0,
    rejected: data?.summary?.rejected ?? 0,
    duplicate: data?.summary?.duplicate ?? 0,
  };
  const records = (data?.records ?? []).filter((r) => r.outcome === tab);
  const paginatedRecords = paginate(records, page, pageSize);

  return (
    <section className="rounded-xl border border-border bg-card shadow-sm">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-sm font-semibold">Run #{runId} — Record Audit</div>
          <div className="text-xs text-muted-foreground">
            Every record the scraper found and what happened to it.
          </div>
        </div>
        <div className="inline-flex items-center gap-2">
          {(["imported", "rejected", "duplicate"] as TabKey[]).map((k) => {
            const s = TAB_STYLES[k];
            const active = tab === k;
            return (
              <button
                key={k}
                onClick={() => {
                  setTab(k);
                  setPage(1);
                }}
                className={`inline-flex items-center gap-1.5 rounded-md border px-3 h-8 text-xs font-semibold transition-colors ${
                  active ? s.active : `border-transparent ${s.idle}`
                }`}
              >
                {s.label} ({counts[k]})
              </button>
            );
          })}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs text-muted-foreground">
            <tr className="text-left">
              {["Name", "Area", "Phone", "Website", "Category", "Reason"].map((h) => (
                <th key={h} className="px-4 py-2.5 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {q.isLoading && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Loading records…
              </td></tr>
            )}
            {q.isError && !q.isLoading && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-destructive">
                Failed to load records for this run.
              </td></tr>
            )}
            {!q.isLoading && !q.isError && records.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                No {TAB_STYLES[tab].label.toLowerCase()} records for this run.
              </td></tr>
            )}
            {paginatedRecords.items.map((r) => (
              <tr key={r.id} className="border-t border-border hover:bg-accent/40">
                <td className="px-4 py-2.5 font-medium">{r.name}</td>
                <td className="px-4 py-2.5">{r.area || "—"}</td>
                <td className="px-4 py-2.5 tabular-nums">{r.phone || "—"}</td>
                <td className="px-4 py-2.5">
                  {r.website ? (
                    <a href={r.website} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate inline-block max-w-[220px] align-bottom">
                      {r.website.replace(/^https?:\/\//, "")}
                    </a>
                  ) : "—"}
                </td>
                <td className="px-4 py-2.5">{r.category || "—"}</td>
                <td className={`px-4 py-2.5 text-xs ${tab === "rejected" ? "text-destructive" : "text-muted-foreground"}`}>
                  {r.reason || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!q.isLoading && !q.isError && records.length > 0 && (
        <PaginationFooter
          pagination={paginatedRecords}
          itemLabel={tab === "duplicate" ? "duplicate records" : `${tab} records`}
          onPageChange={setPage}
          onPageSizeChange={(nextPageSize) => {
            setPageSize(nextPageSize);
            setPage(1);
          }}
        />
      )}
    </section>
  );
}

