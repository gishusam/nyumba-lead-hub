import { LogOut, Search } from "lucide-react";
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
      setOpen(false);
      setLoading(false);
      setSearchFailed(false);
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
            onFocus={() => q.trim() && setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setOpen(false);
            }}
            placeholder="Search leads…"
            aria-label="Search apartments, agencies, developers, and landlords"
            aria-expanded={open}
            aria-controls="global-search-results"
            className="h-11 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 sm:h-10"
          />
          {open && (
            <div
              id="global-search-results"
              className="absolute left-0 top-12 z-50 max-h-80 w-full max-w-2xl overflow-y-auto rounded-lg border border-border bg-popover shadow-lg"
            >
              {loading && (
                <div className="px-4 py-3 text-xs text-muted-foreground">Searching…</div>
              )}
              {!loading && searchFailed && (
                <div className="px-4 py-3 text-xs text-destructive">
                  Search is unavailable. Try again.
                </div>
              )}
              {!loading && !searchFailed && results.length === 0 && (
                <div className="px-4 py-3 text-xs text-muted-foreground">No results</div>
              )}
              {!loading &&
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
