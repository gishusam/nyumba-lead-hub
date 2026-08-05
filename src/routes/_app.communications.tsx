import { createFileRoute } from "@tanstack/react-router";

import { CommunicationsShell } from "@/features/communications/CommunicationsShell";

export const Route = createFileRoute("/_app/communications")({
  head: () => ({
    meta: [
      { title: "Communications — Nyumba Zetu Lead Intelligence" },
      {
        name: "description",
        content: "Send personalised bulk mail, create newsletters, and track delivery performance.",
      },
    ],
  }),
  component: CommunicationsShell,
});
