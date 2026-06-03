import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Building2,
  Briefcase,
  UserSquare2,
  Inbox,
  BarChart3,
  Settings,
  Building,
} from "lucide-react";

const items = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/apartments", label: "Apartments", icon: Building2 },
  { to: "/agencies", label: "Agencies", icon: Briefcase },
  { to: "/landlords", label: "Landlords", icon: UserSquare2 },
  { to: "/leads", label: "My Leads", icon: Inbox },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppSidebar() {
  const path = useRouterState({ select: (r) => r.location.pathname });

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex items-center gap-2 px-5 h-16 border-b border-sidebar-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Building className="h-5 w-5" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold text-sidebar-foreground">Nyumba Zetu</div>
          <div className="text-[11px] text-muted-foreground">Lead Intelligence</div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {items.map((item) => {
          const active = item.exact ? path === item.to : path.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <div className="rounded-lg bg-accent p-3 text-xs">
          <div className="font-semibold text-accent-foreground">Lead pipeline tip</div>
          <div className="mt-1 text-muted-foreground">
            Focus on Large Portfolio landlords — they convert 2.1× faster.
          </div>
        </div>
      </div>
    </aside>
  );
}
