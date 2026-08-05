import { createFileRoute } from "@tanstack/react-router";

import { CommunicationsShell } from "@/features/communications/CommunicationsShell";

export const Route = createFileRoute("/_app/communications")({
  head: () => ({
    meta: [
      {
        title: "Communications — Nyumba Zetu Lead Intelligence",
      },
      {
        name: "description",
        content:
          "Manage outreach, follow-ups, newsletters, and delivery health.",
      },
    ],
  }),
  component: CommunicationsShell,
});
