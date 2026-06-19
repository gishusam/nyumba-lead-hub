import { createFileRoute } from "@tanstack/react-router";
import { LeadsTable } from "./_app.apartments";

export const Route = createFileRoute("/_app/landlords")({
  head: () => ({ meta: [{ title: "Landlords — Nyumba Zetu" }] }),
  component: () => (
    <LeadsTable
      leadType="landlord"
      title="Landlords"
      description="Self-managing landlords sourced from listing platforms."
    />
  ),
});
