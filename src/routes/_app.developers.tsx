import { createFileRoute } from "@tanstack/react-router";
import { LeadsTable } from "./_app.apartments";

export const Route = createFileRoute("/_app/developers")({
  head: () => ({ meta: [{ title: "Property Developers — Nyumba Zetu" }] }),
  component: () => (
    <LeadsTable
      leadType="developer"
      title="Property Developers"
      description="KPDA registered developers — Kenya's verified property development companies."
      showTier
    />
  ),
});
