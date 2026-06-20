import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  MapPin, Database, Loader2, CheckCircle2, XCircle, Building2, Briefcase, HardHat,
  Globe2, Building, Play, History, AlertTriangle, TrendingUp,
  Download, Filter, ChevronRight, Clock, FileWarning, ArrowRight,
} from "lucide-react";
import { scraperApi, type ScraperRun, type ScraperType as ApiScraperType } from "@/lib/api";

export const Route = createFileRoute("/_app/scrape")({
  head: () => ({ meta: [{ title: "Lead Acquisition Pipeline — Nyumba Zetu" }] }),
  component: ScrapePage,
});

type ScraperType = ApiScraperType;
type Coverage = "fresh" | "stale" | "never";

interface Zone {
  id: string; name: string; county: string; city: string;
  points: string; cx: number; cy: number;
}

const ZONES: Zone[] = [
  { id: "westlands", name: "Westlands", county: "Nairobi", city: "Nairobi", points: "330,300 470,300 470,380 330,380", cx: 400, cy: 340 },
  { id: "parklands", name: "Parklands", county: "Nairobi", city: "Nairobi", points: "490,300 610,300 610,380 490,380", cx: 550, cy: 340 },
  { id: "kilimani",  name: "Kilimani",  county: "Nairobi", city: "Nairobi", points: "330,400 470,400 470,480 330,480", cx: 400, cy: 440 },
  { id: "lavington", name: "Lavington", county: "Nairobi", city: "Nairobi", points: "180,400 310,400 310,480 180,480", cx: 245, cy: 440 },
  { id: "upperhill", name: "Upper Hill",county: "Nairobi", city: "Nairobi", points: "490,400 610,400 610,480 490,480", cx: 550, cy: 440 },
  { id: "karen",     name: "Karen",     county: "Nairobi", city: "Nairobi", points: "180,500 310,500 310,600 180,600", cx: 245, cy: 550 },
  { id: "embakasi",  name: "Embakasi",  county: "Nairobi", city: "Nairobi", points: "630,400 790,400 790,500 630,500", cx: 710, cy: 450 },
  { id: "runda",     name: "Runda",     county: "Kiambu",  city: "Kiambu Town", points: "330,200 470,200 470,280 330,280", cx: 400, cy: 240 },
  { id: "kiambu",    name: "Kiambu",    county: "Kiambu",  city: "Kiambu Town", points: "180,200 310,200 310,280 180,280", cx: 245, cy: 240 },
  { id: "ruiru",     name: "Ruiru",     county: "Kiambu",  city: "Ruiru",       points: "490,200 630,200 630,280 490,280", cx: 560, cy: 240 },
  { id: "thika",     name: "Thika",     county: "Kiambu",  city: "Thika",       points: "650,200 810,200 810,280 650,280", cx: 730, cy: 240 },
  { id: "athi",      name: "Athi River",county: "Machakos",city: "Athi River",  points: "490,520 670,520 670,610 490,610", cx: 580, cy: 565 },
];

const SCRAPERS: { id: ScraperType; label: string; icon: typeof Building2 }[] = [
  { id: "apartments", label: "Apartments", icon: Building2 },
  { id: "agencies",   label: "Agencies",   icon: Briefcase },
  { id: "developers", label: "Developers", icon: HardHat },
];

const COV: Record<Coverage, { fill: string; stroke: string; dot: string; label: string }> = {
  fresh: { fill: "hsl(142 71% 45% / 0.32)", stroke: "hsl(142 71% 38%)", dot: "bg-success", label: "Scraped" },
  stale: { fill: "hsl(38 92% 55% / 0.32)",  stroke: "hsl(38 92% 45%)",  dot: "bg-warning", label: "Older" },
  never: { fill: "hsl(220 14% 90%)",        stroke: "hsl(220 9% 65%)",  dot: "bg-muted-foreground", label: "Not scraped" },
};

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

function runDuration(r: ScraperRun): string {
  if (typeof r.duration_seconds === "number") {
    const m = Math.floor(r.duration_seconds / 60);
    const s = Math.floor(r.duration_seconds % 60);
    return `${m}m ${s.toString().padStart(2, "0")}s`;
  }
  const start = runStartedAt(r);
  const end = parseDate(r.finished_at);
  if (start && end) {
    const sec = Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000));
    return `${Math.floor(sec / 60)}m ${(sec % 60).toString().padStart(2, "0")}s`;
  }
  return r.status === "running" ? "—" : "—";
}

function ScrapePage() {
  const qc = useQueryClient();
  const [scraper, setScraper] = useState<ScraperType>("apartments");
  const [county, setCounty] = useState("All Counties");
  const [city, setCity] = useState("All Cities");
  const [selectedAreas, setSelectedAreas] = useState<string[]>(["thika"]);
  const [hover, setHover] = useState<string | null>(null);
  const [selectedRunId, setSelectedRunId] = useState<number | null>(null);
  const [historyFilter, setHistoryFilter] = useState<{ source: string; area: string }>({ source: "All", area: "All" });

  const counties = useMemo(() => ["All Counties", ...Array.from(new Set(ZONES.map((z) => z.county)))], []);
  const cities = useMemo(() => {
    const pool = county === "All Counties" ? ZONES : ZONES.filter((z) => z.county === county);
    return ["All Cities", ...Array.from(new Set(pool.map((z) => z.city)))];
  }, [county]);
  const filtered = ZONES.filter(
    (z) => (county === "All Counties" || z.county === county) && (city === "All Cities" || z.city === city),
  );

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

  const runs: ScraperRun[] = runsQuery.data ?? [];

  // Run mutation
  const runMutation = useMutation({
    mutationFn: ({ scraper_type, areas }: { scraper_type: ScraperType; areas: string[] }) =>
      scraperApi.run(scraper_type, areas),
    onSuccess: (res) => {
      toast.success("Scraper started");
      setSelectedRunId(res.run_id);
      qc.invalidateQueries({ queryKey: ["scraper", "runs"] });
    },
    onError: (e: any) => {
      toast.error(`Failed to start scraper: ${e?.message ?? "unknown error"}`);
    },
  });

  const startRun = () => {
    if (!selectedAreas.length) {
      toast.error("Pick at least one area");
      return;
    }
    runMutation.mutate({ scraper_type: scraper, areas: selectedAreas });
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

  const anyRunning = runs.some((r) => r.status === "running");
  const statusPill = anyRunning
    ? { c: "bg-primary/15 text-primary", l: "Running" }
    : { c: "bg-muted text-muted-foreground", l: "Idle" };

  const toggleArea = (id: string) =>
    setSelectedAreas((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

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
          { l: "Total Scrapes",  v: kpi.total,      tone: "" },
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

      {/* SECTION 1: Control Center */}
      <section className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="p-6 bg-gradient-to-br from-primary/5 via-card to-card border-b border-border">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Play className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-semibold">Scraper Control Center</div>
                <div className="text-xs text-muted-foreground">Pick a source and one or more areas, then run the scraper.</div>
              </div>
            </div>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${statusPill.c}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${anyRunning ? "bg-primary animate-pulse" : "bg-current"}`} />
              {statusPill.l}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
            <div className="lg:col-span-2">
              <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Source type</div>
              <div className="inline-flex w-full rounded-lg border border-input bg-background p-1">
                {SCRAPERS.map((s) => {
                  const Icon = s.icon; const active = scraper === s.id;
                  return (
                    <button key={s.id} onClick={() => setScraper(s.id)}
                      className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-md px-3 h-9 text-sm font-medium transition-colors ${
                        active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                      }`}>
                      <Icon className="h-3.5 w-3.5" />{s.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Country</div>
              <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3 h-9 text-sm font-medium">
                <Globe2 className="h-4 w-4 text-muted-foreground" /> Kenya
              </div>
            </div>

            <div>
              <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">County</div>
              <div className="relative">
                <MapPin className="h-4 w-4 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select value={county} onChange={(e) => { setCounty(e.target.value); setCity("All Cities"); }}
                  className="w-full h-9 rounded-md border border-input bg-background pl-8 pr-3 text-sm font-medium">
                  {counties.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div>
              <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">City</div>
              <div className="relative">
                <Building className="h-4 w-4 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select value={city} onChange={(e) => setCity(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background pl-8 pr-3 text-sm font-medium">
                  {cities.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Selected areas chips */}
          <div className="mt-5">
            <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
              Selected areas ({selectedAreas.length})
            </div>
            {selectedAreas.length === 0 ? (
              <div className="text-xs text-muted-foreground">Tap areas on the map below or pick one to begin.</div>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                {selectedAreas.map((id) => {
                  const z = ZONES.find((x) => x.id === id);
                  return (
                    <span key={id} className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium px-2.5 py-1">
                      {z?.name ?? id}
                      <button onClick={() => toggleArea(id)} className="hover:text-primary/70">×</button>
                    </span>
                  );
                })}
                <button onClick={() => setSelectedAreas([])} className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline">
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* Run row */}
          <div className="mt-5 flex items-center gap-3 flex-wrap">
            <button
              onClick={startRun}
              disabled={!selectedAreas.length || runMutation.isPending}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground h-11 px-5 text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 shadow-sm"
            >
              {runMutation.isPending
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Starting…</>
                : <><Play className="h-4 w-4" /> Run Scraper{selectedAreas.length ? ` · ${selectedAreas.length} area${selectedAreas.length > 1 ? "s" : ""}` : ""}</>}
            </button>
            {anyRunning && (
              <span className="inline-flex items-center gap-1.5 text-xs text-primary">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Polling for updates every 10s
              </span>
            )}
          </div>
        </div>
      </section>

      {/* SECTION 2: Coverage Map (area picker) */}
      <section className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <div className="text-sm font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Area Picker — {SCRAPERS.find((s) => s.id === scraper)?.label}
            </div>
            <div className="flex items-center gap-3 text-xs">
              {(["fresh", "stale", "never"] as Coverage[]).map((k) => (
                <div key={k} className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${COV[k].dot}`} />
                  <span className="text-muted-foreground">{COV[k].label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white">
            <svg viewBox="0 0 1000 700" className="w-full h-auto block">
              <defs>
                <pattern id="grid2" width="50" height="50" patternUnits="userSpaceOnUse">
                  <path d="M 50 0 L 0 0 0 50" fill="none" stroke="hsl(220 14% 94%)" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="1000" height="700" fill="url(#grid2)" />
              <text x="500" y="180" textAnchor="middle" fontSize="11" fontWeight="600" fill="hsl(220 9% 55%)" letterSpacing="2">KIAMBU COUNTY</text>
              <text x="500" y="380" textAnchor="middle" fontSize="11" fontWeight="600" fill="hsl(220 9% 55%)" letterSpacing="2">NAIROBI</text>
              <text x="580" y="500" textAnchor="middle" fontSize="11" fontWeight="600" fill="hsl(220 9% 55%)" letterSpacing="2">MACHAKOS</text>
              {filtered.map((z) => {
                // Mark area "fresh" if it appears in any successful run for this scraper type
                const hasRun = runs.some(
                  (r) => r.scraper_type === scraper && r.status === "success" && runAreas(r).toLowerCase().includes(z.name.toLowerCase()),
                );
                const cov: Coverage = hasRun ? "fresh" : "never";
                const style = COV[cov];
                const isHover = hover === z.id; const isSel = selectedAreas.includes(z.id);
                return (
                  <g key={z.id} onMouseEnter={() => setHover(z.id)} onMouseLeave={() => setHover(null)}
                     onClick={() => toggleArea(z.id)} style={{ cursor: "pointer" }}>
                    <polygon points={z.points}
                      fill={isSel ? "hsl(var(--primary) / 0.35)" : style.fill}
                      stroke={isSel ? "hsl(var(--primary))" : style.stroke}
                      strokeWidth={isSel ? 3 : isHover ? 2.5 : 1.5}
                      style={{ transition: "all 0.15s" }} />
                    <text x={z.cx} y={z.cy - 4} textAnchor="middle" fontSize="15" fontWeight="700" fill="hsl(220 39% 18%)" pointerEvents="none">{z.name}</text>
                    <text x={z.cx} y={z.cy + 14} textAnchor="middle" fontSize="10" fill="hsl(220 9% 45%)" pointerEvents="none">
                      {isSel ? "✓ selected" : (hasRun ? "scraped" : "tap to select")}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Side panel — latest run summary */}
        <div className="rounded-xl border border-border bg-card shadow-sm p-5 flex flex-col">
          {latestRun ? (
            <>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">
                    {selectedRunId != null ? "Selected Run" : "Latest Run"}
                  </div>
                  <div className="text-lg font-semibold capitalize">{latestRun.scraper_type}</div>
                  <div className="text-xs text-muted-foreground">{runAreas(latestRun)}</div>
                </div>
                <RunStatusBadge status={latestRun.status} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <Stat label="Found"      value={latestRun.records_found} />
                <Stat label="W/ Contact" value={latestRun.with_contacts} />
                <Stat label="Imported"   value={latestRun.imported}   tone="text-success" />
                <Stat label="Updated"    value={latestRun.updated}    tone="text-primary" />
                <Stat label="Duplicates" value={latestRun.duplicates} tone="text-warning" />
                <Stat label="Rejected"   value={latestRun.rejected}   tone="text-destructive" />
              </div>
              <div className="mt-4 text-xs text-muted-foreground">
                Started: <span className="text-foreground font-medium">
                  {runStartedAt(latestRun) ? fmtTime(runStartedAt(latestRun)!) : "—"}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                Duration: <span className="text-foreground font-medium">{runDuration(latestRun)}</span>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-sm text-muted-foreground py-10">
              <Database className="h-8 w-8 mb-3 text-muted-foreground/60" />
              <div className="font-medium text-foreground">No runs yet</div>
              <div className="mt-1 text-xs">Start a scrape to see results here.</div>
            </div>
          )}
        </div>
      </section>

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
            <select value={historyFilter.source} onChange={(e) => setHistoryFilter((f) => ({ ...f, source: e.target.value }))}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs font-medium">
              <option>All</option>{SCRAPERS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
            <select value={historyFilter.area} onChange={(e) => setHistoryFilter((f) => ({ ...f, area: e.target.value }))}
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
              {filteredRuns.map((r) => {
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
      </section>

      {/* SECTION 5: Errors / failed runs */}
      {runs.some((r) => r.status === "failed") && (
        <section className="rounded-xl border border-border bg-card shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center">
              <FileWarning className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-semibold">Failed Runs</div>
              <div className="text-xs text-muted-foreground">
                {runs.filter((r) => r.status === "failed").length} failed scrapes
              </div>
            </div>
          </div>
          <div className="space-y-2">
            {runs.filter((r) => r.status === "failed").slice(0, 5).map((r) => (
              <div key={r.id} className="rounded-lg border border-border bg-background p-3 flex items-start gap-3">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium capitalize">
                    {r.scraper_type} · {runAreas(r)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {runStartedAt(r) ? fmtTime(runStartedAt(r)!) : "—"}
                    {r.error ? <> · <span className="text-destructive">{r.error}</span></> : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
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

function Stat({ label, value, tone = "" }: { label: string; value?: number | null; tone?: string }) {
  return (
    <div className="rounded-md border border-border bg-background px-2.5 py-2">
      <div className={`text-base font-semibold tabular-nums ${tone}`}>{value ?? "—"}</div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</div>
    </div>
  );
}
