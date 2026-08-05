import { createFileRoute } from "@tanstack/react-router";

import { BulkMailWorkspace } from "@/features/communications/BulkMailWorkspace";

export const Route = createFileRoute("/_app/communications/bulk-mail")({
  head: () => ({ meta: [{ title: "Bulk Mail — Nyumba Zetu" }] }),
  component: BulkMailWorkspace,
});
