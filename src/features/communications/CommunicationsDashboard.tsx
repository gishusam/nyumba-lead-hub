import { Link } from "@tanstack/react-router";
import { FileEdit, MailCheck, Plus, Send, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CampaignTable } from "./CampaignTable";
import { PREVIEW_CAMPAIGNS } from "./preview-data";

export function CommunicationsDashboard() {
  const total = PREVIEW_CAMPAIGNS.length;
  const drafts = PREVIEW_CAMPAIGNS.filter((c) => c.status === "draft").length;
  const sent = PREVIEW_CAMPAIGNS.filter((c) => c.status === "sent").length;
  const recipients = PREVIEW_CAMPAIGNS.reduce((sum, c) => sum + c.audience, 0);

  const cards = [
    { label: "Total campaigns", value: total, icon: MailCheck },
    { label: "Draft", value: drafts, icon: FileEdit },
    { label: "Sent", value: sent, icon: Send },
    { label: "Audience in preview", value: recipients, icon: UsersRound },
  ];

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 inline-flex rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
            UI preview
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Communications</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Create cold outreach and newsletter campaigns for Nyumba Zetu prospects and customers.
          </p>
        </div>

        <Button asChild>
          <Link to="/communications/new">
            <Plus className="h-4 w-4" />
            New Campaign
          </Link>
        </Button>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">{card.label}</span>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="mt-3 text-2xl font-semibold tabular-nums">{card.value}</div>
            </div>
          );
        })}
      </div>

      <CampaignTable />
    </div>
  );
}
