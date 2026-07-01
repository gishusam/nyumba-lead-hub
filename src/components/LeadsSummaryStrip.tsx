import { useQuery } from "@tanstack/react-query";
import { Users, PhoneCall, CalendarCheck2, Trophy, TrendingUp } from "lucide-react";
import { leadsApi, type LeadType, type LeadsSummary } from "@/lib/api";

export function LeadsSummaryStrip({ leadType }: { leadType: LeadType }) {
  const q = useQuery({
    queryKey: ["leads", "summary", leadType],
    queryFn: () => leadsApi.summary(leadType),
  });

  const raw: LeadsSummary | undefined = q.data;
  // Fallback: some backends return { by_type: { apartment: {...}, ... } }
  const s: Partial<LeadsSummary> =
    raw?.by_type?.[leadType] ?? raw ?? {};

  const items = [
    { label: "Total", value: s.total, icon: Users },
    { label: "Contacted", value: s.contacted, icon: PhoneCall },
    { label: "Demo Booked", value: s.demo_booked, icon: CalendarCheck2 },
    { label: "Won", value: s.won, icon: Trophy },
    {
      label: "Conversion Rate",
      value: s.conversion_rate != null ? `${s.conversion_rate}%` : undefined,
      icon: TrendingUp,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
      {items.map((k) => {
        const Icon = k.icon;
        return (
          <div key={k.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">{k.label}</div>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-2 text-2xl font-semibold tabular-nums">
              {q.isLoading ? "…" : (k.value ?? "—")}
            </div>
          </div>
        );
      })}
    </div>
  );
}
