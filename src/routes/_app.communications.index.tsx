import { createFileRoute } from "@tanstack/react-router";
import { CommunicationsDashboard } from "@/features/communications/CommunicationsDashboard";

export const Route = createFileRoute("/_app/communications/")({
  head: () => ({ meta: [{ title: "Communications — Nyumba Zetu" }] }),
  component: CommunicationsDashboard,
});
