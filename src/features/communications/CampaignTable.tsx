import { BadgeCheck, Clock3, FileEdit, Send } from "lucide-react";
import { PREVIEW_CAMPAIGNS } from "./preview-data";

const statusStyles = {
  draft: "border-amber-200 bg-amber-50 text-amber-700",
  sent: "border-emerald-200 bg-emerald-50 text-emerald-700",
} as const;

export function CampaignTable() {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <h2 className="font-semibold">Recent campaigns</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Cold outreach and newsletter activity in one place.
          </p>
        </div>
        <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
          Preview data
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr className="text-left">
              <th className="px-5 py-3 font-medium">Campaign</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Audience</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Sent</th>
              <th className="px-4 py-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {PREVIEW_CAMPAIGNS.map((campaign) => {
              const TypeIcon = campaign.type === "newsletter" ? BadgeCheck : Send;
              const StatusIcon = campaign.status === "sent" ? Clock3 : FileEdit;
              return (
                <tr key={campaign.id} className="hover:bg-muted/20">
                  <td className="px-5 py-4 font-medium">{campaign.name}</td>
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <TypeIcon className="h-4 w-4" />
                      {campaign.type === "newsletter" ? "Newsletter" : "Cold Outreach"}
                    </span>
                  </td>
                  <td className="px-4 py-4 tabular-nums">{campaign.audience}</td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${
                        statusStyles[campaign.status]
                      }`}
                    >
                      <StatusIcon className="h-3.5 w-3.5" />
                      {campaign.status === "sent" ? "Sent" : "Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-4 tabular-nums">{campaign.sent}</td>
                  <td className="px-4 py-4 text-muted-foreground">{campaign.date}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
