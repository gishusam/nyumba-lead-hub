import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import {
  MapPin, Database, Loader2, CheckCircle2, XCircle, Building2, Briefcase, HardHat,
  Globe2, Building, Play, History, AlertTriangle, TrendingUp, Phone, Calendar,
  Trophy, Download, Filter, ChevronRight, Clock, Users, FileWarning, ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/_app/scrape")({
  head: () => ({ meta: [{ title: "Lead Acquisition Pipeline — Nyumba Zetu" }] }),
  component: ScrapePage,
});

type Coverage = "fresh" | "stale" | "never";
type ScraperType = "apartments" | "agencies" | "developers";
type RunStatus = "success" | "running" | "failed";

interface Zone {
  id: string; name: string; county: string; city: string;
  points: string; cx: number; cy: number;
  coverage: Record<ScraperType, Coverage>;
  records: Record<ScraperType, number>;
  lastScraped: Record<ScraperType, string | null>;
}

const ZONES: Zone[] = [
  { id: "westlands", name: "Westlands", county: "Nairobi", city: "Nairobi",
    points: "330,300 470,300 470,380 330,380", cx: 400, cy: 340,
    coverage: { apartments: "fresh", agencies: "fresh", developers: "stale" },
    records: { apartments: 487, agencies: 42, developers: 14 },
    lastScraped: { apartments: "2 days ago", agencies: "5 days ago", developers: "3 weeks ago" } },
  { id: "parklands", name: "Parklands", county: "Nairobi", city: "Nairobi",
    points: "490,300 610,300 610,380 490,380", cx: 550, cy: 340,
    coverage: { apartments: "never", agencies: "never", developers: "never" },
    records: { apartments: 0, agencies: 0, developers: 0 },
    lastScraped: { apartments: null, agencies: null, developers: null } },
  { id: "kilimani", name: "Kilimani", county: "Nairobi", city: "Nairobi",
    points: "330,400 470,400 470,480 330,480", cx: 400, cy: 440,
    coverage: { apartments: "fresh", agencies: "fresh", developers: "fresh" },
    records: { apartments: 521, agencies: 38, developers: 22 },
    lastScraped: { apartments: "1 day ago", agencies: "3 days ago", developers: "4 days ago" } },
  { id: "lavington", name: "Lavington", county: "Nairobi", city: "Nairobi",
    points: "180,400 310,400 310,480 180,480", cx: 245, cy: 440,
    coverage: { apartments: "fresh", agencies: "stale", developers: "never" },
    records: { apartments: 274, agencies: 18, developers: 0 },
    lastScraped: { apartments: "4 days ago", agencies: "1 month ago", developers: null } },
  { id: "upperhill", name: "Upper Hill", county: "Nairobi", city: "Nairobi",
    points: "490,400 610,400 610,480 490,480", cx: 550, cy: 440,
    coverage: { apartments: "stale", agencies: "fresh", developers: "fresh" },
    records: { apartments: 112, agencies: 27, developers: 19 },
    lastScraped: { apartments: "3 weeks ago", agencies: "1 week ago", developers: "5 days ago" } },
  { id: "karen", name: "Karen", county: "Nairobi", city: "Nairobi",
    points: "180,500 310,500 310,600 180,600", cx: 245, cy: 550,
    coverage: { apartments: "stale", agencies: "stale", developers: "never" },
    records: { apartments: 156, agencies: 11, developers: 0 },
    lastScraped: { apartments: "2 weeks ago", agencies: "1 month ago", developers: null } },
  { id: "embakasi", name: "Embakasi", county: "Nairobi", city: "Nairobi",
    points: "630,400 790,400 790,500 630,500", cx: 710, cy: 450,
    coverage: { apartments: "never", agencies: "never", developers: "never" },
    records: { apartments: 0, agencies: 0, developers: 0 },
    lastScraped: { apartments: null, agencies: null, developers: null } },
  { id: "runda", name: "Runda", county: "Kiambu", city: "Kiambu Town",
    points: "330,200 470,200 470,280 330,280", cx: 400, cy: 240,
    coverage: { apartments: "stale", agencies: "never", developers: "never" },
    records: { apartments: 98, agencies: 0, developers: 0 },
    lastScraped: { apartments: "1 month ago", agencies: null, developers: null } },
  { id: "kiambu", name: "Kiambu", county: "Kiambu", city: "Kiambu Town",
    points: "180,200 310,200 310,280 180,280", cx: 245, cy: 240,
    coverage: { apartments: "fresh", agencies: "stale", developers: "never" },
    records: { apartments: 342, agencies: 16, developers: 0 },
    lastScraped: { apartments: "6 days ago", agencies: "3 weeks ago", developers: null } },
  { id: "ruiru", name: "Ruiru", county: "Kiambu", city: "Ruiru",
    points: "490,200 630,200 630,280 490,280", cx: 560, cy: 240,
    coverage: { apartments: "fresh", agencies: "never", developers: "stale" },
    records: { apartments: 218, agencies: 0, developers: 7 },
    lastScraped: { apartments: "3 days ago", agencies: null, developers: "1 month ago" } },
  { id: "thika", name: "Thika", county: "Kiambu", city: "Thika",
    points: "650,200 810,200 810,280 650,280", cx: 730, cy: 240,
    coverage: { apartments: "stale", agencies: "never", developers: "never" },
    records: { apartments: 189, agencies: 0, developers: 0 },
    lastScraped: { apartments: "2 weeks ago", agencies: null, developers: null } },
  { id: "athi", name: "Athi River", county: "Machakos", city: "Athi River",
    points: "490,520 670,520 670,610 490,610", cx: 580, cy: 565,
    coverage: { apartments: "never", agencies: "never", developers: "stale" },
    records: { apartments: 0, agencies: 0, developers: 5 },
    lastScraped: { apartments: null, agencies: null, developers: "1 month ago" } },
];

const SCRAPERS: { id: ScraperType; label: string; icon: typeof Building2 }[] = [
  { id: "apartments", label: "Apartments", icon: Building2 },
  { id: "agencies", label: "Agencies", icon: Briefcase },
  { id: "developers", label: "Developers", icon: HardHat },
];

const COV: Record<Coverage, { fill: string; stroke: string; chip: string; dot: string; label: string }> = {
  fresh:  { fill: "hsl(142 71% 45% / 0.32)", stroke: "hsl(142 71% 38%)", chip: "bg-success/15 text-success",         dot: "bg-success",         label: "Recently scraped" },
  stale:  { fill: "hsl(38 92% 55% / 0.32)",  stroke: "hsl(38 92% 45%)",  chip: "bg-warning/15 text-warning",         dot: "bg-warning",         label: "Needs refresh" },
  never:  { fill: "hsl(220 14% 90%)",        stroke: "hsl(220 9% 65%)",  chip: "bg-muted text-muted-foreground",     dot: "bg-muted-foreground",label: "Never scraped" },
};

interface RunResult {
  id: string; area: string; areaId: string; source: ScraperType;
  startedAt: Date; duration: string; status: RunStatus;
  found: number; withContacts: number; imported: number; updated: number;
  duplicates: number; rejected: number;
  rejectReasons: { reason: string; count: number }[];
}

const SEED_RUNS: RunResult[] = [
  { id: "r1", area: "Kilimani", areaId: "kilimani", source: "apartments", startedAt: new Date(Date.now() - 86400000),
    duration: "3m 12s", status: "success", found: 142, withContacts: 51, imported: 38, updated: 13, duplicates: 12, rejected: 79,
    rejectReasons: [{ reason: "Missing Phone", count: 41 }, { reason: "Missing Website", count: 18 }, { reason: "Invalid Business Name", count: 12 }, { reason: "Duplicate Lead", count: 8 }] },
  { id: "r2", area: "Westlands", areaId: "westlands", source: "agencies", startedAt: new Date(Date.now() - 86400000 * 2),
    duration: "2m 04s", status: "success", found: 64, withContacts: 31, imported: 22, updated: 9, duplicates: 5, rejected: 28,
    rejectReasons: [{ reason: "Missing Phone", count: 15 }, { reason: "Missing Website", count: 8 }, { reason: "Duplicate Lead", count: 5 }] },
  { id: "r3", area: "Ruiru", areaId: "ruiru", source: "apartments", startedAt: new Date(Date.now() - 86400000 * 3),
    duration: "5m 41s", status: "success", found: 98, withContacts: 27, imported: 19, updated: 8, duplicates: 11, rejected: 60,
    rejectReasons: [{ reason: "Missing Phone", count: 34 }, { reason: "Invalid Business Name", count: 18 }, { reason: "Missing Website", count: 8 }] },
  { id: "r4", area: "Karen", areaId: "karen", source: "developers", startedAt: new Date(Date.now() - 86400000 * 4),
    duration: "1m 38s", status: "failed", found: 0, withContacts: 0, imported: 0, updated: 0, duplicates: 0, rejected: 0, rejectReasons: [] },
  { id: "r5", area: "Thika", areaId: "thika", source: "apartments", startedAt: new Date(Date.now() - 86400000 * 6),
    duration: "4m 23s", status: "success", found: 80, withContacts: 21, imported: 14, updated: 5, duplicates: 7, rejected: 59,
    rejectReasons: [{ reason: "Missing Phone", count: 32 }, { reason: "Missing Website", count: 14 }, { reason: "Duplicate Lead", count: 7 }, { reason: "Invalid Business Name", count: 6 }] },
];

function fmtTime(d: Date) {
  return d.toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function ScrapePage() {
  const [scraper, setScraper] = useState<ScraperType>("apartments");
  const [county, setCounty] = useState("All Counties");
  const [city, setCity] = useState("All Cities");
  const [selected, setSelected] = useState<string | null>("thika");
  const [hover, setHover] = useState<string | null>(null);

  const [status, setStatus] = useState<"idle" | "running" | "completed" | "failed">("idle");
  const [progress, setProgress] = useState(0);
  const [discovered, setDiscovered] = useState(0);
  const [eta, setEta] = useState(0);
  const [latestRun, setLatestRun] = useState<RunResult | null>(SEED_RUNS[4]);
  const [runs, setRuns] = useState<RunResult[]>(SEED_RUNS);
  const [historyFilter, setHistoryFilter] = useState<{ source: string; area: string }>({ source: "All", area: "All" });

  const counties = useMemo(() => ["All Counties", ...Array.from(new Set(ZONES.map((z) => z.county)))], []);
  const cities = useMemo(() => {
    const pool = county === "All Counties" ? ZONES : ZONES.filter((z) => z.county === county);
    return ["All Cities", ...Array.from(new Set(pool.map((z) => z.city)))];
  }, [county]);
  const filtered = ZONES.filter(
    (z) => (county === "All Counties" || z.county === county) && (city === "All Cities" || z.city === city),
  );
  const sel = selected ? ZONES.find((z) => z.id === selected) : null;

  // Simulate run progress
  useEffect(() => {
    if (status !== "running") return;
    const total = 12000; // 12s mock run
    const t0 = Date.now();
    const iv = setInterval(() => {
      const elapsed = Date.now() - t0;
      const pct = Math.min(100, (elapsed / total) * 100);
      setProgress(pct);
      setDiscovered(Math.floor((pct / 100) * 80));
      setEta(Math.max(0, Math.ceil((total - elapsed) / 1000)));
      if (pct >= 100) {
        clearInterval(iv);
        const found = 70 + Math.floor(Math.random() * 30);
        const withContacts = Math.floor(found * 0.28);
        const duplicates = Math.floor(found * 0.09);
        const imported = Math.floor(withContacts * 0.65);
        const updated = withContacts - imported - 2;
        const rejected = found - withContacts - duplicates;
        const run: RunResult = {
          id: `r${Date.now()}`,
          area: sel?.name ?? "Unknown",
          areaId: sel?.id ?? "",
          source: scraper,
          startedAt: new Date(),
          duration: `${Math.floor(total / 60000)}m ${Math.floor((total / 1000) % 60).toString().padStart(2, "0")}s`,
          status: "success",
          found, withContacts, imported, updated: Math.max(0, updated), duplicates, rejected,
          rejectReasons: [
            { reason: "Missing Phone", count: Math.floor(rejected * 0.55) },
            { reason: "Missing Website", count: Math.floor(rejected * 0.25) },
            { reason: "Duplicate Lead", count: Math.floor(rejected * 0.1) },
            { reason: "Invalid Business Name", count: Math.floor(rejected * 0.1) },
          ],
        };
        setLatestRun(run);
        setRuns((r) => [run, ...r]);
        setStatus("completed");
      }
    }, 200);
    return () => clearInterval(iv);
  }, [status, scraper, sel]);

  const runScrape = () => {
    if (!sel || status === "running") return;
    setProgress(0); setDiscovered(0); setEta(12); setStatus("running");
  };

  const statusPill = {
    idle:      { c: "bg-muted text-muted-foreground", l: "Idle" },
    running:   { c: "bg-primary/15 text-primary", l: "Running" },
    completed: { c: "bg-success/15 text-success", l: "Completed" },
    failed:    { c: "bg-destructive/15 text-destructive", l: "Failed" },
  }[status];

  const filteredRuns = runs.filter(
    (r) => (historyFilter.source === "All" || r.source === historyFilter.source) &&
           (historyFilter.area === "All" || r.area === historyFilter.area),
  );

  // Aggregated reject reasons
  const allRejects = runs.flatMap((r) => r.rejectReasons);
  const rejectByReason = allRejects.reduce((acc, r) => {
    acc[r.reason] = (acc[r.reason] ?? 0) + r.count; return acc;
  }, {} as Record<string, number>);
  const totalRejected = Object.values(rejectByReason).reduce((a, b) => a + b, 0);

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
        <button className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 h-9 text-sm font-medium hover:bg-accent">
          <History className="h-4 w-4" /> View Previous Runs
        </button>
      </div>

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
                <div className="text-xs text-muted-foreground">Pick a source and area, then run the scraper.</div>
              </div>
            </div>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${statusPill.c}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${status === "running" ? "bg-primary animate-pulse" : "bg-current"}`} />
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
              <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Area</div>
              <div className="relative">
                <Building className="h-4 w-4 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select value={selected ?? ""} onChange={(e) => setSelected(e.target.value || null)}
                  className="w-full h-9 rounded-md border border-input bg-background pl-8 pr-3 text-sm font-medium">
                  <option value="">Pick an area…</option>
                  {filtered.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Run row */}
          <div className="mt-5 flex items-center gap-3 flex-wrap">
            <button onClick={runScrape} disabled={!sel || status === "running"}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground h-11 px-5 text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 shadow-sm">
              {status === "running"
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Scraping {sel?.name}…</>
                : <><Play className="h-4 w-4" /> Run Scraper{sel ? ` · ${sel.name}` : ""}</>}
            </button>
            {sel && (
              <div className="text-xs text-muted-foreground">
                Source: <span className="font-medium text-foreground capitalize">{scraper}</span>
                <span className="mx-2">·</span>
                Area: <span className="font-medium text-foreground">{sel.name}, {sel.county}</span>
              </div>
            )}
          </div>

          {/* Running progress */}
          {status === "running" && (
            <div className="mt-5 rounded-lg border border-primary/30 bg-primary/5 p-4">
              <div className="flex items-center justify-between text-xs font-medium mb-2">
                <span className="text-primary">Scraping {sel?.name} · {scraper}</span>
                <span className="tabular-nums text-muted-foreground">{Math.round(progress)}%</span>
              </div>
              <div className="h-2 rounded-full bg-primary/15 overflow-hidden">
                <div className="h-full bg-primary transition-[width] duration-200" style={{ width: `${progress}%` }} />
              </div>
              <div className="mt-3 flex items-center gap-6 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><Database className="h-3.5 w-3.5" /> <span className="font-semibold text-foreground tabular-nums">{discovered}</span> records discovered</span>
                <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> <span className="font-semibold text-foreground tabular-nums">~{eta}s</span> remaining</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* SECTION 2: Coverage Map */}
      <section className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <div className="text-sm font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Area Coverage Map — {SCRAPERS.find((s) => s.id === scraper)?.label}
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
              <line x1="120" y1="295" x2="850" y2="295" stroke="hsl(220 14% 88%)" strokeDasharray="6 6" />
              <line x1="450" y1="510" x2="850" y2="510" stroke="hsl(220 14% 88%)" strokeDasharray="6 6" />
              {filtered.map((z) => {
                const cov = z.coverage[scraper]; const style = COV[cov];
                const isHover = hover === z.id; const isSel = selected === z.id;
                return (
                  <g key={z.id} onMouseEnter={() => setHover(z.id)} onMouseLeave={() => setHover(null)}
                     onClick={() => setSelected(z.id)} style={{ cursor: "pointer" }}>
                    <polygon points={z.points} fill={style.fill} stroke={style.stroke}
                      strokeWidth={isSel ? 3 : isHover ? 2.5 : 1.5}
                      style={{ transition: "all 0.15s", filter: isHover || isSel ? "brightness(0.97)" : undefined }} />
                    <text x={z.cx} y={z.cy - 10} textAnchor="middle" fontSize="15" fontWeight="700" fill="hsl(220 39% 18%)" pointerEvents="none">{z.name}</text>
                    <text x={z.cx} y={z.cy + 8} textAnchor="middle" fontSize="11" fontWeight="600" fill="hsl(220 9% 30%)" pointerEvents="none">
                      {z.records[scraper]} leads
                    </text>
                    <text x={z.cx} y={z.cy + 24} textAnchor="middle" fontSize="10" fill="hsl(220 9% 45%)" pointerEvents="none">
                      {z.lastScraped[scraper] ?? "Never scraped"}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Side panel */}
        <div className="rounded-xl border border-border bg-card shadow-sm p-5 flex flex-col">
          {sel ? (
            <>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-lg font-semibold">{sel.name}</div>
                  <div className="text-xs text-muted-foreground">{sel.city} · {sel.county} County</div>
                </div>
                <span className={`text-[11px] font-semibold rounded-full px-2 py-0.5 ${COV[sel.coverage[scraper]].chip}`}>
                  {COV[sel.coverage[scraper]].label}
                </span>
              </div>
              <div className="mt-4 space-y-2">
                {SCRAPERS.map((s) => {
                  const Icon = s.icon; const cov = sel.coverage[s.id];
                  return (
                    <div key={s.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Icon className="h-4 w-4 text-muted-foreground" /><span className="font-medium">{s.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs tabular-nums text-muted-foreground">{sel.records[s.id]}</span>
                        <span className={`h-2 w-2 rounded-full ${COV[cov].dot}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 text-xs text-muted-foreground">
                Last scraped: <span className="text-foreground font-medium">{sel.lastScraped[scraper] ?? "Never"}</span>
              </div>
              <button onClick={runScrape} disabled={status === "running"}
                className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground h-10 text-sm font-medium hover:bg-primary/90 disabled:opacity-60">
                <Play className="h-4 w-4" /> Run Scraper
              </button>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-sm text-muted-foreground py-10">
              <MapPin className="h-8 w-8 mb-3 text-muted-foreground/60" />
              <div className="font-medium text-foreground">Pick an area on the map</div>
            </div>
          )}
        </div>
      </section>

      {/* SECTION 3 + 4: Latest Results + Pipeline */}
      {latestRun ? (
        <section className="grid grid-cols-1 xl:grid-cols-[1fr_1.2fr] gap-4">
          {/* Results card */}
          <div className="rounded-xl border border-border bg-card shadow-sm p-6">
            <div className="flex items-start justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-success/15 text-success flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Scrape Complete</div>
                  <div className="text-xs text-muted-foreground">
                    {latestRun.area} · <span className="capitalize">{latestRun.source}</span> · {latestRun.duration}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-semibold tabular-nums">{Math.round((latestRun.imported / Math.max(1, latestRun.found)) * 100)}%</div>
                <div className="text-[11px] text-muted-foreground uppercase tracking-wide">Success rate</div>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { l: "Records Found", v: latestRun.found, tone: "" },
                { l: "With Contacts", v: latestRun.withContacts, tone: "" },
                { l: "New Leads", v: latestRun.imported, tone: "text-success" },
                { l: "Updated", v: latestRun.updated, tone: "text-primary" },
                { l: "Duplicates", v: latestRun.duplicates, tone: "text-warning" },
                { l: "Rejected", v: latestRun.rejected, tone: "text-destructive" },
              ].map((k) => (
                <div key={k.l} className="rounded-lg border border-border bg-background p-3">
                  <div className={`text-xl font-semibold tabular-nums ${k.tone}`}>{k.v}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{k.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Pipeline */}
          <div className="rounded-xl border border-border bg-card shadow-sm p-6">
            <div className="text-sm font-semibold mb-1">Import Pipeline</div>
            <div className="text-xs text-muted-foreground mb-5">How {latestRun.found} scraped records moved through the system</div>
            <div className="flex items-stretch gap-2 overflow-x-auto">
              {[
                { l: "Scraped",     v: latestRun.found,          tone: "bg-muted text-foreground" },
                { l: "Validated",   v: latestRun.found - latestRun.rejected + latestRun.duplicates, tone: "bg-primary/10 text-primary" },
                { l: "Contactable", v: latestRun.withContacts,   tone: "bg-primary/15 text-primary" },
                { l: "Imported",    v: latestRun.imported,       tone: "bg-success/15 text-success" },
                { l: "Assigned",    v: latestRun.imported,       tone: "bg-success/25 text-success" },
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
              {latestRun.imported} new contactable leads added to your pipeline
            </div>
          </div>
        </section>
      ) : null}

      {/* SECTION 5: Run History */}
      <section className="rounded-xl border border-border bg-card shadow-sm">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-sm font-semibold">Scrape Run History</div>
            <div className="text-xs text-muted-foreground">{filteredRuns.length} runs</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Filter className="h-3.5 w-3.5" /> Filter</div>
            <select value={historyFilter.source} onChange={(e) => setHistoryFilter((f) => ({ ...f, source: e.target.value }))}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs font-medium">
              <option>All</option>{SCRAPERS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
            <select value={historyFilter.area} onChange={(e) => setHistoryFilter((f) => ({ ...f, area: e.target.value }))}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs font-medium">
              <option>All</option>{Array.from(new Set(runs.map((r) => r.area))).map((a) => <option key={a}>{a}</option>)}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs text-muted-foreground">
              <tr className="text-left">
                {["Run time", "Source", "Area", "Found", "Imported", "Duplicates", "Rejected", "Duration", "Status"].map((h) => (
                  <th key={h} className="px-4 py-2.5 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRuns.map((r) => (
                <tr key={r.id} onClick={() => setLatestRun(r)} className="border-t border-border hover:bg-accent/40 cursor-pointer">
                  <td className="px-4 py-2.5 text-muted-foreground">{fmtTime(r.startedAt)}</td>
                  <td className="px-4 py-2.5 capitalize font-medium">{r.source}</td>
                  <td className="px-4 py-2.5">{r.area}</td>
                  <td className="px-4 py-2.5 tabular-nums">{r.found}</td>
                  <td className="px-4 py-2.5 tabular-nums text-success font-medium">{r.imported}</td>
                  <td className="px-4 py-2.5 tabular-nums text-warning">{r.duplicates}</td>
                  <td className="px-4 py-2.5 tabular-nums text-destructive">{r.rejected}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{r.duration}</td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      r.status === "success" ? "bg-success/15 text-success" :
                      r.status === "running" ? "bg-primary/15 text-primary" :
                      "bg-destructive/15 text-destructive"
                    }`}>
                      {r.status === "success" ? <CheckCircle2 className="h-3 w-3" /> :
                       r.status === "running" ? <Loader2 className="h-3 w-3 animate-spin" /> :
                       <XCircle className="h-3 w-3" />}
                      {r.status[0].toUpperCase() + r.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredRuns.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-10 text-center text-sm text-muted-foreground">No runs match these filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* SECTION 6: Failed records review */}
      <section className="rounded-xl border border-border bg-card shadow-sm p-6">
        <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center">
              <FileWarning className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-semibold">Rejected Records Review</div>
              <div className="text-xs text-muted-foreground">{totalRejected} records rejected across all runs</div>
            </div>
          </div>
          <button className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 h-9 text-sm font-medium hover:bg-accent">
            <Download className="h-4 w-4" /> Export rejected
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(rejectByReason).map(([reason, count]) => {
            const pct = totalRejected ? Math.round((count / totalRejected) * 100) : 0;
            return (
              <div key={reason} className="rounded-lg border border-border bg-background p-4">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-warning" />{reason}
                </div>
                <div className="text-2xl font-semibold tabular-nums">{count}</div>
                <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-destructive/60" style={{ width: `${pct}%` }} />
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground">{pct}% of rejects</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 7: Sales Impact */}
      <section className="rounded-xl border border-border bg-card shadow-sm p-6">
        <div className="flex items-start justify-between gap-3 mb-5 flex-wrap">
          <div>
            <div className="text-sm font-semibold">Sales Impact Dashboard</div>
            <div className="text-xs text-muted-foreground">Business outcomes from scraped leads</div>
          </div>
          <div className="text-[11px] text-muted-foreground">Last 7 days</div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {[
            { l: "New leads today",   v: 38,  Icon: Users,    tone: "text-primary",   bg: "bg-primary/10" },
            { l: "New leads (week)",  v: 214, Icon: TrendingUp, tone: "text-primary", bg: "bg-primary/10" },
            { l: "Calls made",        v: 156, Icon: Phone,    tone: "text-foreground", bg: "bg-muted" },
            { l: "Demos booked",      v: 32,  Icon: Calendar, tone: "text-warning",   bg: "bg-warning/15" },
            { l: "Customers won",     v: 9,   Icon: Trophy,   tone: "text-success",   bg: "bg-success/15" },
          ].map((m) => (
            <div key={m.l} className="rounded-lg border border-border bg-background p-4">
              <div className={`h-8 w-8 rounded-md ${m.bg} ${m.tone} flex items-center justify-center mb-2`}>
                <m.Icon className="h-4 w-4" />
              </div>
              <div className="text-2xl font-semibold tabular-nums">{m.v}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{m.l}</div>
            </div>
          ))}
        </div>

        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Conversion funnel</div>
          <div className="space-y-2">
            {[
              { l: "Leads imported", v: 214, pct: 100 },
              { l: "Called",         v: 156, pct: 73 },
              { l: "Demo booked",    v: 32,  pct: 15 },
              { l: "Won",            v: 9,   pct: 4 },
            ].map((s, i, arr) => (
              <div key={s.l} className="flex items-center gap-3">
                <div className="w-32 text-sm font-medium">{s.l}</div>
                <div className="flex-1 h-7 rounded-md bg-muted/60 overflow-hidden relative">
                  <div className="h-full bg-gradient-to-r from-primary to-primary/70 flex items-center px-3" style={{ width: `${s.pct}%` }}>
                    <span className="text-xs font-semibold text-primary-foreground tabular-nums">{s.v}</span>
                  </div>
                </div>
                <div className="w-12 text-right text-xs text-muted-foreground tabular-nums">{s.pct}%</div>
                {i < arr.length - 1 && null}
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
            <ChevronRight className="h-3.5 w-3.5" />
            <span><span className="font-semibold text-foreground">4.2%</span> end-to-end conversion from scraped lead → customer</span>
          </div>
        </div>
      </section>
    </div>
  );
}
