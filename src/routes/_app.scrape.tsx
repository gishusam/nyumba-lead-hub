import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  MapPin, Database, Loader2, CheckCircle2, Building2, Briefcase, HardHat, Globe2,
} from "lucide-react";

export const Route = createFileRoute("/_app/scrape")({
  head: () => ({ meta: [{ title: "Geo Scraper — Nyumba Zetu" }] }),
  component: ScrapePage,
});

type Coverage = "tapped" | "partial" | "untapped";
type ScraperType = "apartments" | "agencies" | "developers";

interface Zone {
  id: string;
  name: string;
  county: string;
  // Polygon points in a 1000x700 viewBox (rough Nairobi metro layout)
  points: string;
  // Label anchor
  cx: number;
  cy: number;
  coverage: Record<ScraperType, Coverage>;
  records: Record<ScraperType, number>;
}

const ZONES: Zone[] = [
  {
    id: "westlands", name: "Westlands", county: "Nairobi",
    points: "380,300 470,290 490,360 410,380 370,350",
    cx: 425, cy: 335,
    coverage: { apartments: "tapped", agencies: "tapped", developers: "partial" },
    records: { apartments: 487, agencies: 42, developers: 14 },
  },
  {
    id: "kilimani", name: "Kilimani", county: "Nairobi",
    points: "450,380 540,370 555,440 470,455 445,420",
    cx: 500, cy: 410,
    coverage: { apartments: "tapped", agencies: "tapped", developers: "tapped" },
    records: { apartments: 521, agencies: 38, developers: 22 },
  },
  {
    id: "lavington", name: "Lavington", county: "Nairobi",
    points: "350,380 440,385 445,450 360,455",
    cx: 395, cy: 420,
    coverage: { apartments: "tapped", agencies: "partial", developers: "untapped" },
    records: { apartments: 274, agencies: 18, developers: 0 },
  },
  {
    id: "karen", name: "Karen", county: "Nairobi",
    points: "300,500 410,490 430,580 320,590 290,540",
    cx: 360, cy: 540,
    coverage: { apartments: "partial", agencies: "partial", developers: "untapped" },
    records: { apartments: 156, agencies: 11, developers: 0 },
  },
  {
    id: "runda", name: "Runda", county: "Nairobi",
    points: "440,210 540,200 555,270 460,285",
    cx: 495, cy: 245,
    coverage: { apartments: "partial", agencies: "untapped", developers: "untapped" },
    records: { apartments: 98, agencies: 0, developers: 0 },
  },
  {
    id: "kiambu", name: "Kiambu", county: "Kiambu",
    points: "320,120 460,110 470,200 330,210",
    cx: 395, cy: 160,
    coverage: { apartments: "tapped", agencies: "partial", developers: "untapped" },
    records: { apartments: 342, agencies: 16, developers: 0 },
  },
  {
    id: "ruiru", name: "Ruiru", county: "Kiambu",
    points: "560,160 700,150 715,250 575,260",
    cx: 635, cy: 205,
    coverage: { apartments: "tapped", agencies: "untapped", developers: "partial" },
    records: { apartments: 218, agencies: 0, developers: 7 },
  },
  {
    id: "thika", name: "Thika", county: "Kiambu",
    points: "720,80 880,70 895,180 740,200",
    cx: 805, cy: 130,
    coverage: { apartments: "partial", agencies: "untapped", developers: "untapped" },
    records: { apartments: 189, agencies: 0, developers: 0 },
  },
  {
    id: "parklands", name: "Parklands", county: "Nairobi",
    points: "470,290 555,280 565,355 495,360",
    cx: 520, cy: 320,
    coverage: { apartments: "untapped", agencies: "untapped", developers: "untapped" },
    records: { apartments: 0, agencies: 0, developers: 0 },
  },
  {
    id: "upperhill", name: "Upper Hill", county: "Nairobi",
    points: "540,440 620,435 630,510 555,515",
    cx: 585, cy: 475,
    coverage: { apartments: "partial", agencies: "tapped", developers: "tapped" },
    records: { apartments: 112, agencies: 27, developers: 19 },
  },
  {
    id: "embakasi", name: "Embakasi", county: "Nairobi",
    points: "630,440 790,430 810,560 650,570",
    cx: 720, cy: 500,
    coverage: { apartments: "untapped", agencies: "untapped", developers: "untapped" },
    records: { apartments: 0, agencies: 0, developers: 0 },
  },
  {
    id: "athi", name: "Athi River", county: "Machakos",
    points: "560,600 760,590 780,680 580,690",
    cx: 670, cy: 640,
    coverage: { apartments: "untapped", agencies: "untapped", developers: "partial" },
    records: { apartments: 0, agencies: 0, developers: 5 },
  },
];

const SCRAPERS: { id: ScraperType; label: string; icon: typeof Building2 }[] = [
  { id: "apartments", label: "Apartments", icon: Building2 },
  { id: "agencies", label: "Agencies", icon: Briefcase },
  { id: "developers", label: "Developers", icon: HardHat },
];

const COVERAGE_STYLE: Record<Coverage, { fill: string; stroke: string; chip: string; label: string }> = {
  tapped: {
    fill: "hsl(var(--success) / 0.55)",
    stroke: "hsl(var(--success))",
    chip: "bg-success/15 text-success",
    label: "Tapped",
  },
  partial: {
    fill: "hsl(var(--warning) / 0.45)",
    stroke: "hsl(var(--warning))",
    chip: "bg-warning/15 text-warning",
    label: "Partial",
  },
  untapped: {
    fill: "hsl(var(--muted-foreground) / 0.18)",
    stroke: "hsl(var(--muted-foreground) / 0.55)",
    chip: "bg-muted text-muted-foreground",
    label: "Untapped",
  },
};

function ScrapePage() {
  const [scraper, setScraper] = useState<ScraperType>("apartments");
  const [county, setCounty] = useState("All Counties");
  const [selected, setSelected] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [running, setRunning] = useState<string | null>(null);
  const [done, setDone] = useState<Record<string, number>>({});

  const counties = useMemo(
    () => ["All Counties", ...Array.from(new Set(ZONES.map((z) => z.county)))],
    [],
  );

  const filtered = ZONES.filter((z) => county === "All Counties" || z.county === county);
  const totals = filtered.reduce(
    (acc, z) => {
      acc[z.coverage[scraper]] += 1;
      return acc;
    },
    { tapped: 0, partial: 0, untapped: 0 } as Record<Coverage, number>,
  );
  const totalRecords = filtered.reduce((s, z) => s + z.records[scraper], 0);

  const sel = selected ? ZONES.find((z) => z.id === selected) : null;

  const runScrape = (id: string) => {
    setRunning(id);
    setTimeout(() => {
      setDone((d) => ({ ...d, [`${id}-${scraper}`]: 15 + Math.floor(Math.random() * 90) }));
      setRunning(null);
    }, 2000);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Geo Scraper</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visualise coverage across Nairobi metro. Click any area to scrape it.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-card border border-border px-3 py-2 text-sm">
          <Database className="h-4 w-4 text-primary" />
          <span className="font-medium tabular-nums">{totalRecords.toLocaleString()}</span>
          <span className="text-muted-foreground">{scraper} records</span>
        </div>
      </div>

      {/* Controls */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex flex-wrap items-end gap-4">
        <div>
          <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
            Scraper type
          </div>
          <div className="inline-flex rounded-lg border border-input bg-background p-1">
            {SCRAPERS.map((s) => {
              const Icon = s.icon;
              const active = scraper === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setScraper(s.id)}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 h-8 text-sm font-medium transition-colors ${
                    active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Country</div>
          <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3 h-9 text-sm font-medium">
            <Globe2 className="h-4 w-4 text-muted-foreground" />
            Kenya
          </div>
        </div>

        <div>
          <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">County</div>
          <select
            value={county}
            onChange={(e) => setCounty(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm font-medium"
          >
            {counties.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>

        <div className="ml-auto flex items-center gap-4 text-xs">
          {(["tapped", "partial", "untapped"] as Coverage[]).map((k) => (
            <div key={k} className="flex items-center gap-2">
              <span
                className="inline-block h-3 w-3 rounded-sm border"
                style={{ background: COVERAGE_STYLE[k].fill, borderColor: COVERAGE_STYLE[k].stroke }}
              />
              <span className="text-muted-foreground">
                {COVERAGE_STYLE[k].label}
                <span className="ml-1 font-semibold text-foreground tabular-nums">{totals[k]}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Map + side panel */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <div className="text-sm font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Nairobi Metro — {SCRAPERS.find((s) => s.id === scraper)?.label} coverage
            </div>
            <div className="text-xs text-muted-foreground">{filtered.length} areas</div>
          </div>
          <div className="relative bg-[hsl(var(--muted)/0.3)]">
            <svg viewBox="0 0 1000 700" className="w-full h-auto block">
              {/* subtle grid */}
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.4" />
                </pattern>
              </defs>
              <rect width="1000" height="700" fill="url(#grid)" />

              {/* "river" decorative path */}
              <path
                d="M 0 450 Q 200 420 400 470 T 800 460 T 1000 480"
                fill="none"
                stroke="hsl(var(--primary) / 0.15)"
                strokeWidth="14"
                strokeLinecap="round"
              />

              {filtered.map((z) => {
                const cov = z.coverage[scraper];
                const style = COVERAGE_STYLE[cov];
                const isHover = hover === z.id;
                const isSel = selected === z.id;
                return (
                  <g
                    key={z.id}
                    onMouseEnter={() => setHover(z.id)}
                    onMouseLeave={() => setHover(null)}
                    onClick={() => setSelected(z.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <polygon
                      points={z.points}
                      fill={style.fill}
                      stroke={style.stroke}
                      strokeWidth={isSel ? 3 : isHover ? 2.5 : 1.5}
                      style={{ transition: "all 0.15s", filter: isHover || isSel ? "brightness(1.08)" : undefined }}
                    />
                    <text
                      x={z.cx}
                      y={z.cy - 4}
                      textAnchor="middle"
                      fontSize="14"
                      fontWeight="600"
                      fill="hsl(var(--foreground))"
                      pointerEvents="none"
                    >
                      {z.name}
                    </text>
                    <text
                      x={z.cx}
                      y={z.cy + 12}
                      textAnchor="middle"
                      fontSize="11"
                      fill="hsl(var(--muted-foreground))"
                      pointerEvents="none"
                    >
                      {z.records[scraper]} {z.records[scraper] === 1 ? "record" : "records"}
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
                  <div className="text-xs text-muted-foreground">{sel.county} County</div>
                </div>
                <span className={`text-[11px] font-semibold rounded-full px-2 py-0.5 ${COVERAGE_STYLE[sel.coverage[scraper]].chip}`}>
                  {COVERAGE_STYLE[sel.coverage[scraper]].label}
                </span>
              </div>

              <div className="mt-4 space-y-2">
                {SCRAPERS.map((s) => {
                  const Icon = s.icon;
                  const cov = sel.coverage[s.id];
                  return (
                    <div key={s.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{s.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs tabular-nums text-muted-foreground">{sel.records[s.id]}</span>
                        <span className={`text-[10px] font-semibold rounded-full px-1.5 py-0.5 ${COVERAGE_STYLE[cov].chip}`}>
                          {COVERAGE_STYLE[cov].label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {done[`${sel.id}-${scraper}`] && running !== sel.id && (
                <div className="mt-3 flex items-center gap-2 rounded-md bg-success/10 text-success px-3 py-2 text-xs font-medium">
                  <CheckCircle2 className="h-4 w-4" />
                  Added {done[`${sel.id}-${scraper}`]} new {scraper} records
                </div>
              )}

              <button
                onClick={() => runScrape(sel.id)}
                disabled={running === sel.id}
                className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground h-10 text-sm font-medium hover:bg-primary/90 disabled:opacity-60"
              >
                {running === sel.id ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Scraping {sel.name}…</>
                ) : (
                  <><Database className="h-4 w-4" /> Scrape {scraper} in {sel.name}</>
                )}
              </button>

              <button
                onClick={() => setSelected(null)}
                className="mt-2 text-xs text-muted-foreground hover:text-foreground"
              >
                Clear selection
              </button>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-sm text-muted-foreground py-10">
              <MapPin className="h-8 w-8 mb-3 text-muted-foreground/60" />
              <div className="font-medium text-foreground">Pick an area on the map</div>
              <div className="mt-1 text-xs max-w-[220px]">
                Grey zones are untapped opportunities. Click one to run the {scraper} scraper.
              </div>
            </div>
          )}

          <div className="mt-auto pt-4 border-t border-border mt-6">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Untapped opportunities
            </div>
            <div className="space-y-1.5">
              {filtered.filter((z) => z.coverage[scraper] === "untapped").slice(0, 4).map((z) => (
                <button
                  key={z.id}
                  onClick={() => setSelected(z.id)}
                  className="w-full flex items-center justify-between text-left text-sm px-2 py-1.5 rounded hover:bg-accent"
                >
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    {z.name}
                  </span>
                  <span className="text-xs text-muted-foreground">{z.county}</span>
                </button>
              ))}
              {filtered.filter((z) => z.coverage[scraper] === "untapped").length === 0 && (
                <div className="text-xs text-muted-foreground italic">All areas covered 🎉</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
