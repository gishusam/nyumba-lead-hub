import { useQueries } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Building2, Briefcase, UserSquare2, Building } from "lucide-react";
import { leadsApi, type LeadType } from "@/lib/api";

type TypeMeta = {
  type: LeadType;
  label: string;
  to: string;
  icon: typeof Building2;
};

const TYPES: TypeMeta[] = [
  { type: "apartment", label: "Apartments", to: "/apartments", icon: Building2 },
  { type: "agency", label: "Agencies", to: "/agencies", icon: Briefcase },
  { type: "developer", label: "Developers", to: "/developers", icon: Building },
  { type: "landlord", label: "Landlords", to: "/landlords", icon: UserSquare2 },
];

function countQuery(lead_type: LeadType, status?: "called" | "won") {
  return {
    queryKey: ["leads", "count", lead_type, status ?? "all"],
    queryFn: () =>
      leadsApi.list({ lead_type, status: status as any, limit: 1, page: 1 }),
    staleTime: 60_000,
  };
}

export function LeadsSummaryStrip({ leadType }: { leadType: LeadType }) {
  const queries = useQueries({
    queries: TYPES.flatMap((t) => [
      countQuery(t.type),
      countQuery(t.type, "called"),
      countQuery(t.type, "won"),
    ]),
  });

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {TYPES.map((t, i) => {
        const total = queries[i * 3]?.data?.total;
        const contacted = queries[i * 3 + 1]?.data?.total;
        const won = queries[i * 3 + 2]?.data?.total;
        const loading = queries[i * 3]?.isLoading;
        const active = t.type === leadType;
        const Icon = t.icon;
        return (
          <Link
            key={t.type}
            to={t.to}
            className={`group rounded-xl border p-4 shadow-sm transition-colors ${
              active
                ? "border-primary bg-primary/5 ring-1 ring-primary/40"
                : "border-border bg-card hover:border-primary/40"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon
                  className={`h-4 w-4 ${active ? "text-primary" : "text-muted-foreground"}`}
                />
                <span
                  className={`text-sm font-medium ${
                    active ? "text-primary" : "text-foreground"
                  }`}
                >
                  {t.label}
                </span>
              </div>
            </div>
            <div className="mt-2 text-3xl font-semibold tabular-nums">
              {loading ? "…" : (total ?? "—")}
            </div>
            <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
              <span>
                Contacted{" "}
                <span className="font-medium tabular-nums text-foreground">
                  {loading ? "…" : (contacted ?? 0)}
                </span>
              </span>
              <span>
                Won{" "}
                <span className="font-medium tabular-nums text-success">
                  {loading ? "…" : (won ?? 0)}
                </span>
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
