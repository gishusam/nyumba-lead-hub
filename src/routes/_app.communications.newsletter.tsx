import { createFileRoute } from "@tanstack/react-router";

import { NewsletterWorkspace } from "@/features/communications/NewsletterWorkspace";

export const Route = createFileRoute("/_app/communications/newsletter")({
  head: () => ({ meta: [{ title: "Newsletter — Nyumba Zetu" }] }),
  component: NewsletterWorkspace,
});
