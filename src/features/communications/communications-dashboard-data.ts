import type {
  CampaignPerformanceRecipient,
  CommunicationsCampaign,
} from "@/lib/api";

export type DashboardCampaignStatus =
  | "Draft"
  | "Ready"
  | "Sending"
  | "Sent"
  | "Failed";

export type DashboardCampaignType =
  | "Cold Outreach"
  | "Newsletter"
  | "Unknown";

export type DashboardCampaign = {
  id: number;
  name: string;
  subject: string;

  type: DashboardCampaignType;
  status: DashboardCampaignStatus;

  recipients: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  failed: number;

  owner: string;
  audience: string;
  sentAt: string | null;
};

function mapStatus(
  status: string,
): DashboardCampaignStatus {
  switch (status) {
    case "draft":
      return "Draft";
    case "reviewed":
      return "Ready";
    case "sending":
      return "Sending";
    case "failed":
      return "Failed";
    case "sent":
    default:
      return "Sent";
  }
}

function mapType(
  type: CommunicationsCampaign["communication_type"],
): DashboardCampaignType {
  if (type === "newsletter") {
    return "Newsletter";
  }

  if (type === "cold_outreach") {
    return "Cold Outreach";
  }

  return "Unknown";
}

function mapAudience(
  recipientType: CommunicationsCampaign["recipient_type"],
): string {
  switch (recipientType) {
    case "mailing_list":
      return "Mailing list";
    case "csv_upload":
      return "CSV upload";
    case "leads":
    default:
      return "Sales leads";
  }
}

export function toDashboardCampaign(
  campaign: CommunicationsCampaign,
): DashboardCampaign {
  return {
    id: campaign.id,
    name: campaign.name,
    subject: campaign.subject,

    type: mapType(campaign.communication_type),
    status: mapStatus(campaign.status),

    recipients: campaign.total_recipients ?? 0,
    sent: campaign.sent_count ?? 0,
    delivered: campaign.delivered_count ?? 0,
    opened: campaign.opened_count ?? 0,
    clicked: campaign.clicked_count ?? 0,
    bounced: campaign.bounced_count ?? 0,
    failed: campaign.failed_count ?? 0,

    owner: campaign.created_by ?? "—",
    audience: mapAudience(campaign.recipient_type),
    sentAt:
      campaign.finished_at ??
      campaign.created_at ??
      null,
  };
}

type CampaignSummaryInput = Pick<
  CommunicationsCampaign,
  | "status"
  | "total_recipients"
  | "delivered_count"
  | "bounced_count"
  | "failed_count"
>;

export function summarizeCampaigns(
  campaigns: CampaignSummaryInput[],
) {
  return campaigns
    .filter(
      (campaign) =>
        campaign.status !== "draft" &&
        campaign.status !== "reviewed",
    )
    .reduce(
      (summary, campaign) => ({
        recipients:
          summary.recipients +
          (campaign.total_recipients ?? 0),

        delivered:
          summary.delivered +
          (campaign.delivered_count ?? 0),

        bounced:
          summary.bounced +
          (campaign.bounced_count ?? 0),

        failed:
          summary.failed +
          (campaign.failed_count ?? 0),
      }),
      {
        recipients: 0,
        delivered: 0,
        bounced: 0,
        failed: 0,
      },
    );
}


export type DomainDeliveryRow = {
  domain: string;
  recipients: number;
  delivered: number;
  bounced: number;
  failed: number;
  deliveryRate: number;
};

export function buildDomainRows(
  recipients: CampaignPerformanceRecipient[],
): DomainDeliveryRow[] {
  const domains = new Map<string, DomainDeliveryRow>();

  for (const recipient of recipients) {
    const domain =
      recipient.email.split("@")[1]?.toLowerCase() ??
      "unknown";

    const row = domains.get(domain) ?? {
      domain,
      recipients: 0,
      delivered: 0,
      bounced: 0,
      failed: 0,
      deliveryRate: 0,
    };

    row.recipients += 1;

    if (recipient.delivered_at) {
      row.delivered += 1;
    }

    if (recipient.bounced_at) {
      row.bounced += 1;
    }

    if (recipient.failed_at) {
      row.failed += 1;
    }

    domains.set(domain, row);
  }

  return Array.from(domains.values()).map((row) => ({
    ...row,
    deliveryRate: row.recipients
      ? Number(
          (
            (row.delivered / row.recipients) *
            100
          ).toFixed(1),
        )
      : 0,
  }));
}

type DeliveryEventType =
  | "delivered"
  | "bounced"
  | "failed";

type DeliveryEvent = {
  timestamp: string;
  type: DeliveryEventType;
};

export type DeliveryTimelinePoint = {
  time: string;
  delivered: number;
  bounced: number;
  failed: number;
};

export function buildDeliveryTimeline(
  recipients: CampaignPerformanceRecipient[],
): DeliveryTimelinePoint[] {
  const events: DeliveryEvent[] = [];

  for (const recipient of recipients) {
    if (recipient.delivered_at) {
      events.push({
        timestamp: recipient.delivered_at,
        type: "delivered",
      });
    }

    if (recipient.bounced_at) {
      events.push({
        timestamp: recipient.bounced_at,
        type: "bounced",
      });
    }

    if (recipient.failed_at) {
      events.push({
        timestamp: recipient.failed_at,
        type: "failed",
      });
    }
  }

  events.sort(
    (a, b) =>
      new Date(a.timestamp).getTime() -
      new Date(b.timestamp).getTime(),
  );

  let delivered = 0;
  let bounced = 0;
  let failed = 0;

  return events.map((event) => {
    if (event.type === "delivered") {
      delivered += 1;
    }

    if (event.type === "bounced") {
      bounced += 1;
    }

    if (event.type === "failed") {
      failed += 1;
    }

    const date = new Date(event.timestamp);

    return {
      time: Number.isNaN(date.getTime())
        ? event.timestamp
        : new Intl.DateTimeFormat("en-KE", {
            hour: "2-digit",
            minute: "2-digit",
          }).format(date),
      delivered,
      bounced,
      failed,
    };
  });
}

export function paginateRows<T>(
  rows: T[],
  requestedPage: number,
  pageSize = 10,
) {
  const total = rows.length;
  const safePageSize = Math.max(1, pageSize);

  const totalPages = Math.max(
    1,
    Math.ceil(total / safePageSize),
  );

  const page = Math.min(
    Math.max(1, requestedPage),
    totalPages,
  );

  const start = (page - 1) * safePageSize;
  const end = start + safePageSize;

  return {
    items: rows.slice(start, end),
    page,
    pageSize: safePageSize,
    total,
    totalPages,
    from: total === 0 ? 0 : start + 1,
    to: Math.min(end, total),
  };
}
