import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MapPin, Database, Loader2, CheckCircle2, Building2, Globe2 } from "lucide-react";

export const Route = createFileRoute("/_app/scrape")({
  head: () => ({ meta: [{ title: "Data Scraper — Nyumba Zetu" }] }),
  component: ScrapePage,
});

interface Location {
  id: string;
  name: string;
  county: string;
  image: string;
  listings: number;
  lastScraped: string;
  status: "ready" | "recent" | "stale";
}

const LOCATIONS: Location[] = [
  {
    id: "kiambu",
    name: "Kiambu",
    county: "Kiambu County",
    image: "https://images.unsplash.com/photo-1568454537842-d933259bb258?w=800&q=70",
    listings: 342,
    lastScraped: "2 days ago",
    status: "ready",
  },
  {
    id: "ruiru",
    name: "Ruiru",
    county: "Kiambu County",
    image: "https://images.unsplash.com/photo-1448630360428-65456885c650?w=800&q=70",
    listings: 218,
    lastScraped: "5 hours ago",
    status: "recent",
  },
  {
    id: "westlands",
    name: "Westlands",
    county: "Nairobi County",
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=70",
    listings: 487,
    lastScraped: "1 day ago",
    status: "ready",
  },
  {
    id: "kilimani",
    name: "Kilimani",
    county: "Nairobi County",
    image: "https://images.unsplash.com/photo-1567496898669-ee935f5f647a?w=800&q=70",
    listings: 521,
    lastScraped: "3 hours ago",
    status: "recent",
  },
  {
    id: "karen",
    name: "Karen",
    county: "Nairobi County",
    image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=70",
    listings: 156,
    lastScraped: "1 week ago",
    status: "stale",
  },
  {
    id: "thika",
    name: "Thika",
    county: "Kiambu County",
    image: "https://images.unsplash.com/photo-1494526585095-c41746248156?w=800&q=70",
    listings: 189,
    lastScraped: "3 days ago",
    status: "ready",
  },
  {
    id: "lavington",
    name: "Lavington",
    county: "Nairobi County",
    image: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=70",
    listings: 274,
    lastScraped: "6 hours ago",
    status: "recent",
  },
  {
    id: "runda",
    name: "Runda",
    county: "Nairobi County",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=70",
    listings: 98,
    lastScraped: "2 weeks ago",
    status: "stale",
  },
];

const COUNTIES = ["All Counties", "Nairobi County", "Kiambu County"];

function ScrapePage() {
  const [country] = useState("Kenya");
  const [county, setCounty] = useState("All Counties");
  const [city, setCity] = useState<string>("");
  const [scraping, setScraping] = useState<string | null>(null);
  const [completed, setCompleted] = useState<Record<string, number>>({});

  const filtered = LOCATIONS.filter((l) => county === "All Counties" || l.county === county);

  const runScrape = (id: string) => {
    setScraping(id);
    setTimeout(() => {
      const newRecords = 20 + Math.floor(Math.random() * 80);
      setCompleted((c) => ({ ...c, [id]: newRecords }));
      setScraping(null);
    }, 2200);
  };

  const statusStyle = {
    ready: "bg-warning/10 text-warning",
    recent: "bg-success/10 text-success",
    stale: "bg-destructive/10 text-destructive",
  };
  const statusLabel = { ready: "Ready to refresh", recent: "Recently updated", stale: "Needs update" };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Data Scraper</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pull fresh property listings from any location with one click — no scripts required.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-card border border-border px-3 py-2 text-sm">
          <Database className="h-4 w-4 text-primary" />
          <span className="font-medium">{LOCATIONS.reduce((s, l) => s + l.listings, 0).toLocaleString()}</span>
          <span className="text-muted-foreground">records collected</span>
        </div>
      </div>

      {/* Location selectors */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Country</label>
            <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-input bg-background px-3 h-10">
              <Globe2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{country}</span>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">County</label>
            <select
              value={county}
              onChange={(e) => { setCounty(e.target.value); setCity(""); }}
              className="mt-1.5 w-full h-10 rounded-lg border border-input bg-background px-3 text-sm font-medium"
            >
              {COUNTIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">City / Area</label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="mt-1.5 w-full h-10 rounded-lg border border-input bg-background px-3 text-sm font-medium"
            >
              <option value="">All cities</option>
              {filtered.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
        </div>

        {city && (
          <div className="mt-4 flex items-center justify-between rounded-lg bg-primary/5 border border-primary/20 px-4 py-3">
            <div className="text-sm">
              <span className="text-muted-foreground">Selected: </span>
              <span className="font-semibold">{LOCATIONS.find((l) => l.id === city)?.name}</span>
            </div>
            <button
              onClick={() => runScrape(city)}
              disabled={scraping === city}
              className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-4 h-9 text-sm font-medium hover:bg-primary/90 disabled:opacity-60"
            >
              {scraping === city ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
              Scrape selected city
            </button>
          </div>
        )}
      </div>

      {/* Location grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Available Locations ({filtered.length})
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((loc) => {
            const isLoading = scraping === loc.id;
            const justDone = completed[loc.id];
            return (
              <div key={loc.id} className="group rounded-xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="relative h-36 overflow-hidden bg-muted">
                  <img
                    src={loc.image}
                    alt={loc.name}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0" />
                  <div className="absolute top-2 left-2">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusStyle[loc.status]}`}>
                      {statusLabel[loc.status]}
                    </span>
                  </div>
                  <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between text-white">
                    <div>
                      <div className="text-base font-semibold leading-tight flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {loc.name}
                      </div>
                      <div className="text-[11px] opacity-90">{loc.county}</div>
                    </div>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Building2 className="h-3.5 w-3.5" />
                      <span className="tabular-nums font-medium text-foreground">{loc.listings}</span> listings
                    </div>
                    <span className="text-muted-foreground">Updated {loc.lastScraped}</span>
                  </div>

                  {justDone && !isLoading && (
                    <div className="flex items-center gap-2 rounded-md bg-success/10 text-success px-2.5 py-1.5 text-xs font-medium">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {justDone} new records added
                    </div>
                  )}

                  <button
                    onClick={() => runScrape(loc.id)}
                    disabled={isLoading}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground h-9 text-sm font-medium hover:bg-primary/90 disabled:opacity-60"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Scraping {loc.name}…
                      </>
                    ) : (
                      <>
                        <Database className="h-4 w-4" />
                        Scrape data for {loc.name}
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
