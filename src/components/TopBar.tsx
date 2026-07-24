import { Bell, LogOut, RefreshCw, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { clearAuth, getCurrentUser, leadsApi } from "@/lib/api";

export function TopBar() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  // Read from localStorage client-side only to avoid SSR hydration mismatch
  const [user, setUser] = useState<ReturnType<typeof getCurrentUser>>(null);
  useEffect(() => { setUser(getCurrentUser()); }, []);
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
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const term = q.trim();
    if (!term) {
      setResults([]);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const data = await leadsApi.search(term);
        setResults(data);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
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

  const handleRefresh = () => {
    queryClient.invalidateQueries();
  };

  return (
    <header className="h-16 shrink-0 border-b border-border bg-card/60 backdrop-blur flex items-center gap-4 px-6">
      <div className="relative flex-1 max-w-xl" ref={ref}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => results.length && setOpen(true)}
          placeholder="Search apartments, agencies, landlords…"
          className="w-full h-10 rounded-lg border border-input bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
        />
        {open && (
          <div className="absolute left-0 right-0 top-12 z-50 rounded-lg border border-border bg-popover shadow-lg max-h-80 overflow-y-auto">
            {loading && (
              <div className="px-4 py-3 text-xs text-muted-foreground">Searching…</div>
            )}
            {!loading && results.length === 0 && (
              <div className="px-4 py-3 text-xs text-muted-foreground">No results</div>
            )}
            {results.map((r) => (
              <div
                key={r.id}
                className="px-4 py-2 hover:bg-muted/40 cursor-pointer text-sm flex items-center justify-between"
              >
                <div>
                  <div className="font-medium">{r.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {r.lead_type} · {r.area ?? "—"} · {r.phone ?? "no phone"}
                  </div>
                </div>
                <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <Button variant="outline" size="sm" className="gap-2" onClick={handleRefresh}>
        <RefreshCw className="h-4 w-4" />
        Refresh Data
      </Button>

      <button className="relative rounded-full p-2 hover:bg-muted">
        <Bell className="h-4 w-4 text-muted-foreground" />
        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
      </button>

      <div className="flex items-center gap-2 pl-3 border-l border-border">
        <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
          {initials}
        </div>
        <div className="hidden sm:block leading-tight">
          <div className="text-sm font-medium">{user?.name ?? "User"}</div>
          <div className="text-xs text-muted-foreground capitalize">
            {user?.role ?? "Sales"}
          </div>
        </div>
        <button
          onClick={handleLogout}
          title="Sign out"
          className="ml-1 rounded-full p-2 hover:bg-muted"
        >
          <LogOut className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </header>
  );
}
