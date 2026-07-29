import { Building2, LogOut, MapPin, Search, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { MobileSidebar } from "@/components/AppSidebar";
import { LeadDetailPanel } from "@/components/LeadDetailPanel";
import { clearAuth, getCurrentUser, leadsApi, type Lead } from "@/lib/api";

export function TopBar() {
  const navigate = useNavigate();
  // Read from localStorage client-side only to avoid SSR hydration mismatch
  const [user, setUser] = useState<ReturnType<typeof getCurrentUser>>(null);
  useEffect(() => {
    setUser(getCurrentUser());
  }, []);
  const initials =
    user?.name
      ?.split(" ")
      .map((s) => s[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() ?? "U";

  const [q, setQ] = useState("");
  const [results, setResults] = useState<
    Awaited<ReturnType<typeof leadsApi.search>>
  >([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchFailed, setSearchFailed] = useState(false);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const term = q.trim();
    if (!term) {
      setResults([]);
      setLoading(false);
      setSearchFailed(false);
      return;
    }

    if (term.length < 2) {
      setResults([]);
      setLoading(false);
      setSearchFailed(false);
      setOpen(true);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setSearchFailed(false);
    setOpen(true);
    const t = setTimeout(async () => {
      try {
        const data = await leadsApi.search(term);
        if (cancelled) return;
        setResults(data);
      } catch {
        if (cancelled) return;
        setResults([]);
        setSearchFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [q]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const handleLogout = () => {
    clearAuth();
    navigate({ to: "/signin" });
  };

  const handleSelectResult = (lead: Lead) => {
    setActiveLead(lead);
    setOpen(false);
    setQ("");
  };

  return (
    <>
      <header className="flex h-16 w-full shrink-0 items-center gap-2 border-b border-border bg-card/60 px-3 backdrop-blur sm:gap-3 sm:px-4 lg:px-6">
        <MobileSidebar />

        <div className="relative min-w-0 flex-1" ref={ref}>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setOpen(false);
            }}
            placeholder="Search by lead name, owner, or area…"
            aria-label="Search apartments, agencies, developers, and landlords"
            aria-expanded={open}
            aria-controls="global-search-results"
            className="h-11 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 sm:h-10"
          />
          {open && (
            <div
              id="global-search-results"
              role="region"
              aria-label="Search guidance and results"
              className="absolute left-0 top-12 z-50 max-h-[calc(100vh-5rem)] w-full overflow-y-auto rounded-xl border border-border bg-popover shadow-xl"
            >
              {q.trim().length < 2 && (
                <>
                  <div className="px-4 pb-3 pt-4 sm:px-5">
                    <div className="text-sm font-semibold text-foreground">Search leads</div>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      Find a lead by property or company name, owner name, or area.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-2 px-4 pb-4 sm:grid-cols-3 sm:px-5">
                    <div className="rounded-lg border border-border bg-muted/25 px-3 py-2.5">
                      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        <Building2 className="h-3.5 w-3.5 text-primary" />
                        Lead name
                      </div>
                      <div className="mt-1 truncate text-xs font-medium text-foreground">
                        Greenview Apartments
                      </div>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/25 px-3 py-2.5">
                      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        <UserRound className="h-3.5 w-3.5 text-primary" />
                        Owner
                      </div>
                      <div className="mt-1 truncate text-xs font-medium text-foreground">
                        Samuel
                      </div>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/25 px-3 py-2.5">
                      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 text-primary" />
                        Area
                      </div>
                      <div className="mt-1 truncate text-xs font-medium text-foreground">
                        Westlands
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/20 px-4 py-2 text-[11px] text-muted-foreground sm:px-5">
                    <span className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      {q.trim().length === 1
                        ? "Enter 1 more character"
                        : "Enter at least 2 characters"}
                    </span>
                    <span className="hidden sm:inline">
                      <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-sans">
                        Esc
                      </kbd>{" "}
                      to close
                    </span>
                  </div>
                </>
              )}
              {q.trim().length >= 2 && loading && (
                <div className="px-4 py-3 text-xs text-muted-foreground" aria-live="polite">
                  Searching…
                </div>
              )}
              {q.trim().length >= 2 && !loading && searchFailed && (
                <div className="px-4 py-3 text-xs text-destructive" aria-live="polite">
                  Search is unavailable. Try again.
                </div>
              )}
              {q.trim().length >= 2 &&
                !loading &&
                !searchFailed &&
                results.length === 0 && (
                  <div className="px-4 py-3 text-xs text-muted-foreground" aria-live="polite">
                    No results
                  </div>
                )}
              {q.trim().length >= 2 &&
                !loading &&
                !searchFailed &&
                results.map((result) => (
                  <button
                    type="button"
                    key={result.id}
                    onClick={() => handleSelectResult(result)}
                    className="flex w-full cursor-pointer items-center justify-between gap-4 px-4 py-2 text-left text-sm hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-medium">{result.name}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {result.lead_type} · {result.area ?? "—"} ·{" "}
                        {result.phone ?? "no phone"}
                      </div>
                    </div>
                    <span className="shrink-0 text-[11px] uppercase tracking-wide text-muted-foreground">
                      {result.status}
                    </span>
                  </button>
                ))}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2 sm:border-l sm:border-border sm:pl-3">
          <div className="hidden h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary sm:flex">
            {initials}
          </div>
          <div className="hidden leading-tight lg:block">
            <div className="text-sm font-medium">{user?.name ?? "User"}</div>
            <div className="text-xs capitalize text-muted-foreground">
              {user?.role ?? "Sales"}
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title="Sign out"
            aria-label="Sign out"
            className="rounded-full p-2 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <LogOut className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </header>

      <LeadDetailPanel lead={activeLead} onClose={() => setActiveLead(null)} />
    </>
  );
}
