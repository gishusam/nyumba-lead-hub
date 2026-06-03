import { Bell, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TopBar() {
  return (
    <header className="h-16 shrink-0 border-b border-border bg-card/60 backdrop-blur flex items-center gap-4 px-6">
      <div className="relative flex-1 max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          placeholder="Search apartments, agencies, landlords…"
          className="w-full h-10 rounded-lg border border-input bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
        />
      </div>

      <Button variant="outline" size="sm" className="gap-2">
        <RefreshCw className="h-4 w-4" />
        Refresh Data
      </Button>

      <button className="relative rounded-full p-2 hover:bg-muted">
        <Bell className="h-4 w-4 text-muted-foreground" />
        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
      </button>

      <div className="flex items-center gap-2 pl-3 border-l border-border">
        <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
          BO
        </div>
        <div className="hidden sm:block leading-tight">
          <div className="text-sm font-medium">Brian Otieno</div>
          <div className="text-xs text-muted-foreground">Sales Lead</div>
        </div>
      </div>
    </header>
  );
}
