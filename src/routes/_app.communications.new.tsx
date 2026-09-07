import { createFileRoute } from "@tanstack/react-router";
import { NewCampaignWizard } from "@/features/communications/NewCampaignWizard";

export const Route = createFileRoute("/_app/communications/new")({
  head: () => ({
    meta: [
      {
        title: "New Campaign — Nyumba Zetu",
      },
    ],
  }),
  component: NewCampaignWizard,
});
