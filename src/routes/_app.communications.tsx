import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/communications")({
  component: CommunicationsLayout,
});

function CommunicationsLayout() {
  return <Outlet />;
}
