import { createFileRoute } from "@tanstack/react-router";

import { CommunicationsOverview } from "@/features/communications/CommunicationsOverview";

export const Route = createFileRoute("/_app/communications/")({
  component: CommunicationsOverview,
});
