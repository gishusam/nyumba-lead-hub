import { apiRequest } from "./api";

export type CommunicationsOverview = {
  total_messages: number;
  queued_messages: number;
  processing_messages: number;
  sent_messages: number;
  delivered_messages: number;
  failed_messages: number;
  dead_letter_messages: number;
  bounced_messages: number;
  complained_messages: number;
  unsubscribed_messages: number;
  opens: number;
  clicks: number;
  active_campaigns: number;
  active_newsletters: number;
  suppressed_contacts: number;
};

export type CommunicationsSchemaAudit = {
  ready: boolean;
  missing_tables: string[];
  missing_columns: string[];
  missing_indexes: string[];
  mismatched_constraints: string[];
  error?: string;
};

export type CommunicationsReadiness = {
  ready: boolean;
  environment: string;
  issues: string[];
  schema: CommunicationsSchemaAudit;
  checked_at: string;
};

export type ProviderEventType =
  | "delivered"
  | "hard_bounce"
  | "soft_bounce"
  | "complaint"
  | "unsubscribe"
  | "opened"
  | "clicked";

export type ProviderEvent = {
  id: number;
  provider: string;
  provider_event_id: string;
  email_message_id: number | null;
  provider_message_id: string;
  event_type: ProviderEventType;
  recipient_email: string | null;
  bounce_type: "hard" | "soft" | null;
  reason: string | null;
  url: string | null;
  occurred_at: string;
  signature_verified: boolean;
  status: string;
  created_at: string;
};

export type ApiRequester = <T>(
  path: string,
  init?: RequestInit & { auth?: boolean },
) => Promise<T>;

export function createCommunicationsApi(
  requester: ApiRequester = apiRequest,
) {
  return {
    overview: () =>
      requester<CommunicationsOverview>(
        "/api/communications/overview",
      ),

    readiness: () =>
      requester<CommunicationsReadiness>(
        "/api/communications/readiness",
      ),

    events: ({ limit = 8 }: { limit?: number } = {}) =>
      requester<ProviderEvent[]>(
        `/api/communications/events?limit=${limit}`,
      ),
  };
}

export const communicationsApi = createCommunicationsApi();
