import { createFileRoute } from "@tanstack/react-router";
import { LeadsTable } from "./_app.apartments";

export const Route = createFileRoute("/_app/agencies")({
  head: () => ({ meta: [{ title: "Agencies — Nyumba Zetu" }] }),
  component: () => (
    <LeadsTable
      leadType="agency"
      title="Agencies"
      description="Property management companies ranked by opportunity score."
    />
  ),
});
