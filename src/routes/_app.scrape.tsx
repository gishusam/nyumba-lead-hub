import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  MapPin, Database, Loader2, CheckCircle2, Building2, Briefcase, HardHat, Globe2, Building,
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
  city: string;
  // Polygon points in a 1000x700 viewBox
  points: string;
  cx: number;
  cy: number;
  coverage: Record<ScraperType, Coverage>;
  records: Record<ScraperType, number>;
}

// Cleaner, more spaced-out layout. Each polygon is a roomy rounded rectangle-ish shape.
const ZONES: Zone[] = [
  // ---- Nairobi / Nairobi City ----
  { id: "westlands", name: "Westlands", county: "Nairobi", city: "Nairobi",
    points: "330,300 470,300 470,380 330,380", cx: 400, cy: 340,
    coverage: { apartments: "tapped", agencies: "tapped", developers: "partial" },
    records: { apartments: 487, agencies: 42, developers: 14 } },
  { id: "parklands", name: "Parklands", county: "Nairobi", city: "Nairobi",
    points: "490,300 610,300 610,380 490,380", cx: 550, cy: 340,
    coverage: { apartments: "untapped", agencies: "untapped", developers: "untapped" },
    records: { apartments: 0, agencies: 0, developers: 0 } },
  { id: "kilimani", name: "Kilimani", county: "Nairobi", city: "Nairobi",
    points: "330,400 470,400 470,480 330,480", cx: 400, cy: 440,
    coverage: { apartments: "tapped", agencies: "tapped", developers: "tapped" },
    records: { apartments: 521, agencies: 38, developers: 22 } },
  { id: "lavington", name: "Lavington", county: "Nairobi", city: "Nairobi",
    points: "180,400 310,400 310,480 180,480", cx: 245, cy: 440,
    coverage: { apartments: "tapped", agencies: "partial", developers: "untapped" },
    records: { apartments: 274, agencies: 18, developers: 0 } },
  { id: "upperhill", name: "Upper Hill", county: "Nairobi", city: "Nairobi",
    points: "490,400 610,400 610,480 490,480", cx: 550, cy: 440,
    coverage: { apartments: "partial", agencies: "tapped", developers: "tapped" },
    records: { apartments: 112, agencies: 27, developers: 19 } },
  { id: "karen", name: "Karen", county: "Nairobi", city: "Nairobi",
    points: "180,500 310,500 310,600 180,600", cx: 245, cy: 550,
    coverage: { apartments: "partial", agencies: "partial", developers: "untapped" },
    records: { apartments: 156, agencies: 11, developers: 0 } },
  { id: "embakasi", name: "Embakasi", county: "Nairobi", city: "Nairobi",
    points: "630,400 790,400 790,500 630,500", cx: 710, cy: 450,
    coverage: { apartments: "untapped", agencies: "untapped", developers: "untapped" },
    records: { apartments: 0, agencies: 0, developers: 0 } },

  // ---- Kiambu County ----
  { id: "runda", name: "Runda", county: "Kiambu", city: "Kiambu Town",
    points: "330,200 470,200 470,280 330,280", cx: 400, cy: 240,
    coverage: { apartments: "partial", agencies: "untapped", developers: "untapped" },
    records: { apartments: 98, agencies: 0, developers: 0 } },
  { id: "kiambu", name: "Kiambu", county: "Kiambu", city: "Kiambu Town",
    points: "180,200 310,200 310,280 180,280", cx: 245, cy: 240,
    coverage: { apartments: "tapped", agencies: "partial", developers: "untapped" },
    records: { apartments: 342, agencies: 16, developers: 0 } },
  { id: "ruiru", name: "Ruiru", county: "Kiambu", city: "Ruiru",
    points: "490,200 630,200 630,280 490,280", cx: 560, cy: 240,
    coverage: { apartments: "tapped", agencies: "untapped", developers: "partial" },
    records: { apartments: 218, agencies: 0, developers: 7 } },
  { id: "thika", name: "Thika", county: "Kiambu", city: "Thika",
    points: "650,200 810,200 810,280 650,280", cx: 730, cy: 240,
    coverage: { apartments: "partial", agencies: "untapped", developers: "untapped" },
    records: { apartments: 189, agencies: 0, developers: 0 } },

  // ---- Machakos County ----
  { id: "athi", name: "Athi River", county: "Machakos", city: "Athi River",
    points: "490,520 670,520 670,610 490,610", cx: 580, cy: 565,
    coverage: { apartments: "untapped", agencies: "untapped", developers: "partial" },
    records: { apartments: 0, agencies: 0, developers: 5 } },
];

const SCRAPERS: { id: ScraperType; label: string; icon: typeof Building2 }[] = [
  { id: "apartments", label: "Apartments", icon: Building2 },
  { id: "agencies", label: "Agencies", icon: Briefcase },
  { id: "developers", label: "Developers", icon: HardHat },
];

const COVERAGE_STYLE: Record<Coverage, { fill: string; stroke: string; chip: string; label: string }> = {
  tapped: {
    fill: "hsl(142 71% 45% / 0.32)",
    stroke: "hsl(142 71% 38%)",
    chip: "bg-success/15 text-success",
    label: "Tapped",
  },
  partial: {
    fill: "hsl(38 92% 55% / 0.32)",
    stroke: "hsl(38 92% 45%)",
    chip: "bg-warning/15 text-warning",
    label: "Partial",
  },
  untapped: {
    fill: "hsl(220 14% 90%)",
    stroke: "hsl(220 9% 65%)",
    chip: "bg-muted text-muted-foreground",
    label: "Untapped",
  },
};

function ScrapePage() {
  const [scraper, setScraper] = useState<ScraperType>("apartments");
  const [county, setCounty] = useState("All Counties");
  const [city, setCity] = useState("All Cities");
  const [selected, setSelected] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [running, setRunning] = useState<string | null>(null);
  const [done, setDone] = useState<Record<string, number>>({});

  const counties = useMemo(
    () => ["All Counties", ...Array.from(new Set(ZONES.map((z) => z.county)))],
    [],
  );

  const cities = useMemo(() => {
    const pool = county === "All Counties" ? ZONES : ZONES.filter((z) => z.county === county);
    return ["All Cities", ...Array.from(new Set(pool.map((z) => z.city)))];
  }, [county]);

  const filtered = ZONES.filter(
    (z) =>
      (county === "All Counties" || z.county === county) &&
      (city === "All Cities" || z.city === city),
  );

  const totals = filtered.reduce(
    (acc, z) => { acc[z.coverage[scraper]] += 1; return acc; },
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
          <div className="relative">
            <MapPin className="h-4 w-4 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={county}
              onChange={(e) => { setCounty(e.target.value); setCity("All Cities"); }}
              className="h-9 rounded-md border border-input bg-background pl-8 pr-3 text-sm font-medium"
            >
              {counties.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div>
          <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">City</div>
          <div className="relative">
            <Building className="h-4 w-4 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="h-9 rounded-md border border-input bg-background pl-8 pr-3 text-sm font-medium"
            >
              {cities.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
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
          <div className="relative bg-white">
            <svg viewBox="0 0 1000 700" className="w-full h-auto block">
              <defs>
                <pattern id="grid2" width="50" height="50" patternUnits="userSpaceOnUse">
                  <path d="M 50 0 L 0 0 0 50" fill="none" stroke="hsl(220 14% 94%)" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="1000" height="700" fill="url(#grid2)" />

              {/* County band labels */}
              <text x="500" y="180" textAnchor="middle" fontSize="11" fontWeight="600"
                    fill="hsl(220 9% 55%)" letterSpacing="2">KIAMBU COUNTY</text>
              <text x="500" y="380" textAnchor="middle" fontSize="11" fontWeight="600"
                    fill="hsl(220 9% 55%)" letterSpacing="2">NAIROBI</text>
              <text x="580" y="500" textAnchor="middle" fontSize="11" fontWeight="600"
                    fill="hsl(220 9% 55%)" letterSpacing="2">MACHAKOS</text>

              {/* County dividers */}
              <line x1="120" y1="295" x2="850" y2="295" stroke="hsl(220 14% 88%)" strokeDasharray="6 6" />
              <line x1="450" y1="510" x2="850" y2="510" stroke="hsl(220 14% 88%)" strokeDasharray="6 6" />

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
                      rx={12}
                      style={{ transition: "all 0.15s", filter: isHover || isSel ? "brightness(0.97)" : undefined }}
                    />
                    <text x={z.cx} y={z.cy - 6} textAnchor="middle" fontSize="15" fontWeight="700"
                          fill="hsl(220 39% 18%)" pointerEvents="none">
                      {z.name}
                    </text>
                    <text x={z.cx} y={z.cy + 14} textAnchor="middle" fontSize="11" fontWeight="500"
                          fill="hsl(220 9% 40%)" pointerEvents="none">
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
                  <div className="text-xs text-muted-foreground">{sel.city} · {sel.county} County</div>
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

          <div className="mt-6 pt-4 border-t border-border">
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
                  <span className="text-xs text-muted-foreground">{z.city}</span>
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
