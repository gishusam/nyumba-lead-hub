export const SOURCE_LABELS: Record<string, string> = {
  google_maps: "Scraped · Maps",
  apartment_discovery: "Scraped · Maps",
  kpda_directory: "Scraped · Directory",
  buyrentkenya: "Scraped · BuyRentKenya",
  jiji: "Scraped · Jiji",
  bulk_upload: "Bulk Upload",
  manual: "Manual Entry",
};

export function sourceLabel(source?: string | null) {
  if (!source) return null;
  return SOURCE_LABELS[source] ?? source;
}

export function SourceBadge({ source }: { source?: string | null }) {
  const label = sourceLabel(source);
  if (!label) return <span className="text-muted-foreground text-xs">—</span>;
  return (
    <span className="inline-flex items-center rounded-md bg-muted text-muted-foreground border border-border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap">
      {label}
    </span>
  );
}
