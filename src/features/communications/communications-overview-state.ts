import type { ProviderEventType } from "../../lib/communications-api";

export type OverviewCoreState = "loading" | "error" | "ready";

export type OverviewCoreStateInput = {
  overviewPending: boolean;
  readinessPending: boolean;
  overviewFailed: boolean;
  readinessFailed: boolean;
};

export function resolveOverviewState({
  overviewPending,
  readinessPending,
  overviewFailed,
  readinessFailed,
}: OverviewCoreStateInput): OverviewCoreState {
  if (overviewPending || readinessPending) {
    return "loading";
  }

  if (overviewFailed || readinessFailed) {
    return "error";
  }

  return "ready";
}

export function canManageCommunications(
  role: string | undefined,
): boolean {
  return role === "admin" || role === "manager";
}

const providerEventLabels: Record<ProviderEventType, string> = {
  delivered: "Delivered",
  hard_bounce: "Hard bounce",
  soft_bounce: "Soft bounce",
  complaint: "Complaint",
  unsubscribe: "Unsubscribed",
  opened: "Opened",
  clicked: "Clicked",
};

export function providerEventLabel(
  eventType: ProviderEventType,
): string {
  return providerEventLabels[eventType];
}

export function formatCommunicationsTimestamp(
  value: string,
): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown time";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
