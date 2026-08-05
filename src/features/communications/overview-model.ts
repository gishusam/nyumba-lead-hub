import type {
  CommunicationsOverview,
  CommunicationsReadiness,
} from "../../lib/communications-api";

export const emptyOverview: CommunicationsOverview = {
  total_messages: 0,
  queued_messages: 0,
  processing_messages: 0,
  sent_messages: 0,
  delivered_messages: 0,
  failed_messages: 0,
  dead_letter_messages: 0,
  bounced_messages: 0,
  complained_messages: 0,
  unsubscribed_messages: 0,
  opens: 0,
  clicks: 0,
  active_campaigns: 0,
  active_newsletters: 0,
  suppressed_contacts: 0,
};

export type OverviewMetricId =
  | "total"
  | "delivered"
  | "campaigns"
  | "newsletters"
  | "suppressed";

export type OverviewMetric = {
  id: OverviewMetricId;
  label: string;
  value: number;
};

export type OverviewRateId = "delivery" | "open" | "click";

export type OverviewRate = {
  id: OverviewRateId;
  label: string;
  value: number;
  numerator: number;
  denominator: number;
  denominatorLabel: string;
};

export type DeliveryStatusId =
  | "queued"
  | "processing"
  | "sent"
  | "delivered"
  | "failed"
  | "dead-letter"
  | "bounced"
  | "complained"
  | "unsubscribed";

export type DeliveryStatus = {
  id: DeliveryStatusId;
  label: string;
  value: number;
  percentage: number;
};

export type OverviewReadiness = {
  status: "healthy" | "degraded";
  label: "Ready" | "Needs attention";
  environment: string;
  issues: string[];
  schemaReady: boolean;
  checkedAt: string;
};

export type CommunicationsOverviewViewModel = {
  isEmpty: boolean;
  metrics: OverviewMetric[];
  rates: OverviewRate[];
  deliveryStatuses: DeliveryStatus[];
  readiness: OverviewReadiness;
};

function count(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function percentage(
  numerator: number,
  denominator: number,
): number {
  const safeNumerator = count(numerator);
  const safeDenominator = count(denominator);

  if (safeDenominator === 0) {
    return 0;
  }

  const raw = (safeNumerator / safeDenominator) * 100;
  return Math.round(Math.min(raw, 100) * 10) / 10;
}

function statusItem(
  id: DeliveryStatusId,
  label: string,
  value: number,
  total: number,
): DeliveryStatus {
  const safeValue = count(value);

  return {
    id,
    label,
    value: safeValue,
    percentage: percentage(safeValue, total),
  };
}

export function buildOverviewViewModel(
  overview: CommunicationsOverview,
  readiness: CommunicationsReadiness,
): CommunicationsOverviewViewModel {
  const totalMessages = count(overview.total_messages);
  const sentMessages = count(overview.sent_messages);
  const deliveredMessages = count(overview.delivered_messages);
  const opens = count(overview.opens);
  const clicks = count(overview.clicks);

  const values = Object.values(overview).map(count);
  const isEmpty = values.every((value) => value === 0);

  const readinessHealthy =
    readiness.ready &&
    readiness.issues.length === 0 &&
    readiness.schema.ready;

  return {
    isEmpty,

    metrics: [
      {
        id: "total",
        label: "Total messages",
        value: totalMessages,
      },
      {
        id: "delivered",
        label: "Delivered",
        value: deliveredMessages,
      },
      {
        id: "campaigns",
        label: "Active campaigns",
        value: count(overview.active_campaigns),
      },
      {
        id: "newsletters",
        label: "Active newsletters",
        value: count(overview.active_newsletters),
      },
      {
        id: "suppressed",
        label: "Suppressed contacts",
        value: count(overview.suppressed_contacts),
      },
    ],

    rates: [
      {
        id: "delivery",
        label: "Delivery rate",
        value: percentage(deliveredMessages, sentMessages),
        numerator: deliveredMessages,
        denominator: sentMessages,
        denominatorLabel: "sent",
      },
      {
        id: "open",
        label: "Open rate",
        value: percentage(opens, deliveredMessages),
        numerator: opens,
        denominator: deliveredMessages,
        denominatorLabel: "delivered",
      },
      {
        id: "click",
        label: "Click rate",
        value: percentage(clicks, deliveredMessages),
        numerator: clicks,
        denominator: deliveredMessages,
        denominatorLabel: "delivered",
      },
    ],

    deliveryStatuses: [
      statusItem(
        "queued",
        "Queued",
        overview.queued_messages,
        totalMessages,
      ),
      statusItem(
        "processing",
        "Processing",
        overview.processing_messages,
        totalMessages,
      ),
      statusItem(
        "sent",
        "Sent",
        overview.sent_messages,
        totalMessages,
      ),
      statusItem(
        "delivered",
        "Delivered",
        overview.delivered_messages,
        totalMessages,
      ),
      statusItem(
        "failed",
        "Failed",
        overview.failed_messages,
        totalMessages,
      ),
      statusItem(
        "dead-letter",
        "Dead letter",
        overview.dead_letter_messages,
        totalMessages,
      ),
      statusItem(
        "bounced",
        "Bounced",
        overview.bounced_messages,
        totalMessages,
      ),
      statusItem(
        "complained",
        "Complained",
        overview.complained_messages,
        totalMessages,
      ),
      statusItem(
        "unsubscribed",
        "Unsubscribed",
        overview.unsubscribed_messages,
        totalMessages,
      ),
    ],

    readiness: {
      status: readinessHealthy ? "healthy" : "degraded",
      label: readinessHealthy ? "Ready" : "Needs attention",
      environment: readiness.environment,
      issues: readiness.issues,
      schemaReady: readiness.schema.ready,
      checkedAt: readiness.checked_at,
    },
  };
}
