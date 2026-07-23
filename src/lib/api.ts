// Browser-only API client for the Nyumba Zetu FastAPI backend.
// Reads token from localStorage and attaches it as Bearer.

// Empty string means "use Vite proxy" (dev on Replit).
// Explicit URL means "call backend directly" (production / Vercel).
export const API_BASE_URL: string =
  (import.meta as any).env?.VITE_API_BASE_URL ??
  "https://sales-intelligence-api-2c4dpa66cq-ew.a.run.app";

const TOKEN_KEY = "nzetu_token";
const USER_KEY = "nzetu_user";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role?: string;
};

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function getCurrentUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: AuthUser) {
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, body: unknown, message?: string) {
    super(message ?? `Request failed with status ${status}`);
    this.status = status;
    this.body = body;
  }
}

async function request<T>(
  path: string,
  init: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const { auth = true, headers, signal: callerSignal, ...rest } = init;
  const finalHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(headers as Record<string, string> | undefined),
  };
  if (auth) {
    const token = getToken();
    if (token) finalHeaders["Authorization"] = `Bearer ${token}`;
  }

  // 20-second timeout per request; caller can pass a tighter signal
  const timeoutSignal = AbortSignal.timeout(20_000);
  const signal = callerSignal
    ? AbortSignal.any([callerSignal, timeoutSignal])
    : timeoutSignal;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    signal,
    headers: finalHeaders,
  });

  if (res.status === 401) {
    clearAuth();
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/signin")) {
      window.location.href = "/signin";
    }
    throw new ApiError(401, null, "Unauthorized");
  }

  if (!res.ok) {
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      // ignore
    }
    throw new ApiError(res.status, body, `Request failed: ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// ============= Auth =============
export async function login(email: string, password: string) {
  const data = await request<{
    access_token: string;
    token_type: string;
    must_change_password?: boolean;
    user: AuthUser;
  }>("/api/auth/login", {
    method: "POST",
    auth: false,
    body: JSON.stringify({ email, password }),
  });
  setToken(data.access_token);
  setCurrentUser(data.user);
  return data;
}

export async function changePassword(current_password: string, new_password: string) {
  return request<{ success?: boolean; message?: string }>(
    "/api/auth/change-password",
    {
      method: "POST",
      body: JSON.stringify({ current_password, new_password }),
    },
  );
}

// ============= Dashboard =============
export type DashboardSummary = {
  total_leads: number;
  new_leads: number;
  calls_this_week: number;
  demos_booked: number;
  won_customers: number;
  conversion_rate: number;
};

export const dashboardApi = {
  summary: () => request<DashboardSummary>("/api/dashboard/summary"),
  bySource: () =>
    request<Array<{ type: string; count: number }>>("/api/dashboard/by-source"),
  funnel: () =>
    request<Array<{ status: string; count: number }>>("/api/dashboard/funnel"),
  byArea: (lead_type?: string) =>
    request<Array<{ area: string; count: number }>>(
      `/api/dashboard/by-area${lead_type ? `?lead_type=${lead_type}` : ""}`,
    ),
  activity: () =>
    request<
      Array<{
        id: string;
        name: string;
        lead_type: string;
        area: string;
        status: string;
        assigned_to: string;
        updated_at: string;
      }>
    >("/api/dashboard/activity"),
};

// ============= Leads =============
export type LeadType = "apartment" | "agency" | "landlord" | "developer";
export type LeadStatusApi =
  | "new"
  | "called"
  | "demo_booked"
  | "won"
  | "lost";

export type AiScoreLabel =
  | "LOW_HANGING_FRUIT"
  | "WARM_PROSPECT"
  | "EXECUTIVE_LEAD"
  | "NURTURE"
  | "NOT_QUALIFIED";

export type Lead = {
  id: string;
  name: string;
  owner_name?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  area?: string | null;
  lead_type: LeadType;
  source?: string | null;
  score?: number | null;
  ai_score?: number | null;
  ai_score_label?: AiScoreLabel | string | null;
  status: LeadStatusApi;
  notes?: string | null;
  assigned_to?: string | null;
  last_contacted?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  ai_score_reason?: string | null;
  
  contact_attempts?: number | null;
  google_rating?: number | null;
  review_count?: number | null;
  lead_quality?: string | null;
  signals?: string[] | null;
  contact_person?: string | null;
  contact_person_role?: string | null;
  follow_up_date?: string | null;
};

export type LeadNote = {
  id?: string | number;
  note: string;
  created_by?: string | null;
  created_at?: string | null;
  ai_score?: number | null;
  ai_score_label?: string | null;
  ai_score_reason?: string | null;
};

export type LeadListResponse = {
  total: number;
  page: number;
  limit: number;
  pages: number;
  data: Lead[];
};

export type ListLeadsParams = {
  lead_type?: LeadType;
  status?: LeadStatusApi;
  area?: string;
  source?: string;
  assigned_to?: string;
  ai_score?: AiScoreLabel | string;
  page?: number;
  limit?: number;
};

function qs(params: Record<string, string | number | undefined>) {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== "" && v !== null,
  );
  if (entries.length === 0) return "";
  const u = new URLSearchParams();
  entries.forEach(([k, v]) => u.append(k, String(v)));
  return `?${u.toString()}`;
}

export type LeadsSummary = {
  total?: number;
  contacted?: number;
  demo_booked?: number;
  won?: number;
  conversion_rate?: number;
  by_type?: Record<string, Partial<LeadsSummary>>;
};

export type LeadImportInsertedRecord = {
  row: number;
  name: string;
  area?: string | null;
  phone?: string | null;
  lead_type?: string | null;
};
export type LeadImportUpdatedRecord = {
  row: number;
  name: string;
  what_changed?: string | null;
};
export type LeadImportIssueRecord = {
  row: number;
  name?: string | null;
  reason: string;
};
export type LeadImportReport = {
  total_rows?: number;
  inserted: number;
  updated?: number;
  duplicates: number;
  rejected: number;
  errors: number;
  summary?: string;
  messages?: string[];
  /** Canonical location — backend nests per-row details here */
  audit?: {
    inserted?: LeadImportInsertedRecord[];
    updated?: LeadImportUpdatedRecord[];
    duplicates?: LeadImportIssueRecord[];
    rejected?: LeadImportIssueRecord[];
    errors?: LeadImportIssueRecord[];
  };
  /** Legacy fallback location some versions of the backend use */
  records?: {
    inserted?: LeadImportInsertedRecord[];
    updated?: LeadImportUpdatedRecord[];
    duplicates?: LeadImportIssueRecord[];
    rejected?: LeadImportIssueRecord[];
    errors?: LeadImportIssueRecord[];
  };
};

export type LeadTimelineItem = {
  type: "event" | "note";
  event_type?: "status_change" | "assigned" | "note_added" | string;
  changed_by?: string | null;
  from_value?: string | null;
  to_value?: string | null;
  note?: string | null;
  created_by?: string | null;
  ai_score?: number | null;
  ai_score_label?: string | null;
  ai_score_reason?: string | null;
  follow_up_date?: string | null;
  signals?: string[] | null;
  timestamp?: string | null;
  created_at?: string | null;
};

export type AiNoteResult = {
  ai_score?: number | null;
  ai_score_label?: string | null;
  ai_score_reason?: string | null;
  follow_up_date?: string | null;
  signals?: string[] | null;
  note?: string | null;
};

export type LeadTimelineResponse = {
  lead?: Lead;
  timeline: LeadTimelineItem[];
};

export const leadsApi = {
  list: (params: ListLeadsParams = {}) =>
    request<LeadListResponse>(`/api/leads${qs(params)}`),
  mine: (page = 1, limit = 20) =>
    request<LeadListResponse | Lead[]>(`/api/leads/mine${qs({ page, limit })}`),
  get: (id: string) => request<Lead>(`/api/leads/${id}`),
  notes: (id: string) =>
    request<LeadNote[] | { data: LeadNote[]; notes?: LeadNote[] }>(
      `/api/leads/${id}/notes`,
    ),
  search: (q: string) =>
    request<Array<Pick<Lead, "id" | "name" | "owner_name" | "phone" | "area" | "lead_type" | "status" | "score">>>(
      `/api/leads/search${qs({ q })}`,
    ),
  updateStatus: (id: string, status: LeadStatusApi, notes?: string) =>
    request<{ id: string; name: string; status: LeadStatusApi }>(
      `/api/leads/${id}/status`,
      { method: "PATCH", body: JSON.stringify({ status, notes }) },
    ),
  updateNotes: (id: string, notes: string, assigned_to?: string) =>
    request<{ id: string; name: string; updated: boolean }>(
      `/api/leads/${id}/notes`,
      { method: "PATCH", body: JSON.stringify({ notes, assigned_to }) },
    ),
  updateContact: (
    id: string,
    payload: { contact_person?: string | null; contact_person_role?: string | null },
  ) =>
    request<{ id: string; updated: boolean }>(`/api/leads/${id}/notes`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  summary: (lead_type?: LeadType) =>
    request<LeadsSummary>(`/api/leads/summary${qs({ lead_type })}`),
  timeline: (id: string) =>
    request<LeadTimelineResponse>(`/api/leads/${id}/timeline`),
  addNote: (id: string, note: string, created_by?: string) =>
    request<AiNoteResult>(`/api/leads/${id}/notes`, {
      method: "POST",
      body: JSON.stringify({ note, created_by }),
    }),
  assign: (id: string) =>
    request<{ id: string; name: string; assigned_to: string; message?: string }>(
      `/api/leads/${id}/assign`,
      { method: "PATCH" },
    ),
  import: async (file: File, lead_type?: LeadType) => {
    const fd = new FormData();
    fd.append("file", file);
    if (lead_type) fd.append("lead_type", lead_type);
    const token = getToken();
    const res = await fetch(`${API_BASE_URL}/api/leads/import`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd,
    });
    if (!res.ok) {
      let body: unknown = null;
      try { body = await res.json(); } catch {}
      throw new ApiError(res.status, body, `Import failed: ${res.status}`);
    }
    return (await res.json()) as LeadImportReport;
  },
};

// ============= Reports =============
export type WeeklyReport = {
  activity?: {
    new_leads?: number;
    calls_made?: number;
    demos_booked?: number;
    won?: number;
  };
  top_performer?: {
    name: string;
    calls?: number;
    demos?: number;
    won?: number;
  } | null;
  developers_tracked?: number;
  follow_ups_due?: Array<{
    id?: string;
    name: string;
    area?: string | null;
    lead_type?: string;
    days_overdue: number;
    urgency?: "overdue" | "due_today" | "upcoming";
    follow_up_date?: string | null;
  }>;
  coverage?: Array<{
    area: string;
    apartments?: number;
    agencies?: number;
    landlords?: number;
    total?: number;
  }>;
  untapped_areas?: string[];
  scraped_this_week?: Array<{
    area: string;
    type?: string;
    records_found?: number;
    imported?: number;
    duplicates?: number;
    rejected?: number;
    last_run?: string | null;
  }>;
  untapped_this_week?: string[];
  follow_up_next_7_days?: Array<{
    date: string;
    day_label: string;
    days_from_today: number;
    count: number;
    leads: Array<{
      id: string;
      name: string;
      phone?: string | null;
      area?: string | null;
      lead_type?: LeadType | string;
      ai_score?: number | null;
      ai_score_label?: AiScoreLabel | string | null;
      status?: LeadStatusApi | string;
    }>;
  }>;
};

export type WeeklyNarrative = {
  narrative?: string;
  text?: string;
  generated_at?: string;
};

export const reportsApi = {
  weekly: () => request<WeeklyReport>("/api/reports/weekly"),
  narrative: () => request<WeeklyNarrative>("/api/reports/weekly/narrative"),
};


// ============= Scraper Pipeline =============
export type ScraperType = "apartments" | "agencies" | "developers";
export type ScraperRunStatus = "running" | "success" | "failed";

export type ScraperRun = {
  id: number;
  scraper_type: ScraperType;
  areas?: string[] | null;
  area?: string | null;
  status: ScraperRunStatus;
  records_found?: number | null;
  with_contacts?: number | null;
  imported?: number | null;
  updated?: number | null;
  duplicates?: number | null;
  rejected?: number | null;
  started_at?: string | null;
  finished_at?: string | null;
  created_at?: string | null;
  duration_seconds?: number | null;
  error?: string | null;
};

export type ScraperRunRecordOutcome = "imported" | "rejected" | "duplicate";

export type ScraperRunRecord = {
  id: number;
  name: string;
  area: string;
  phone: string | null;
  website: string | null;
  category: string | null;
  outcome: ScraperRunRecordOutcome;
  reason: string | null;
};

export type ScraperRunRecords = {
  run_id: number;
  summary: { imported: number; rejected: number; duplicate: number; total: number };
  records: ScraperRunRecord[];
};

export const scraperApi = {

  run: (scraper_type: ScraperType, areas: string[]) =>
    request<{ success: boolean; run_id: number }>("/api/scraper/run", {
      method: "POST",
      body: JSON.stringify({ scraper_type, areas }),
    }),
  runs: () => request<ScraperRun[] | { data: ScraperRun[] }>("/api/scraper/runs"),
  run_detail: (id: number | string) =>
    request<ScraperRun>(`/api/scraper/runs/${id}`),
  records: (id: number | string) =>
    request<ScraperRunRecords>(`/api/scraper/runs/${id}/records`),

};

// ============= Outreach (email status filtering) =============
export type OutreachFilter = "all" | "emailed" | "not_emailed";

export type OutreachLead = Lead & {
  email_status: "emailed" | "not_emailed";
  last_email_type?: string | null;
  last_email_at?: string | null;
  last_email_sent_by?: string | null;
};

export type OutreachResponse = {
  counts: { all: number; emailed: number; not_emailed: number };
  data: OutreachLead[];
  total: number;
  page: number;
  pages: number;
  limit: number;
};

export const outreachApi = {
  list: (leadType: LeadType, filterBy: OutreachFilter = "all", page = 1, limit = 20) =>
    request<OutreachResponse>(
      `/api/leads/outreach${qs({ lead_type: leadType, filter_by: filterBy, page, limit })}`,
    ),
};

// ============= Email Outreach =============
export type EmailType = "cold" | "followup";
export type TemplateName = "template_1" | "template_2" | "template_3";

export type EmailPreviewRequest =
  | { email_type: "cold"; template_name: TemplateName }
  | { email_type: "followup" };

export type EmailPreviewResponse = {
  email_id: string | number;
  subject: string;
  body: string;
  has_email: boolean;
  to_email?: string | null;
};

export type EmailSendRequest = {
  email_id: string | number;
  final_body: string;
  to_email?: string | null;
  final_subject?: string;
};

export type EmailSendResponse = {
  success: boolean;
  message?: string;
  follow_up_date?: string | null;
};

export type LeadEmail = {
  id: string | number;
  sent_at?: string | null;
  created_at?: string | null;
  email_type: EmailType;
  sent_by?: string | null;
  status?: string | null;
  subject?: string | null;
  body?: string | null;
};

export const emailApi = {
  preview: (leadId: string, payload: EmailPreviewRequest) =>
    request<EmailPreviewResponse>(`/api/leads/${leadId}/email/preview`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  send: (leadId: string, payload: EmailSendRequest) =>
    request<EmailSendResponse>(`/api/leads/${leadId}/email/send`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  sendWithFile: async (
    leadId: string,
    payload: EmailSendRequest,
    attachment: File,
  ): Promise<EmailSendResponse> => {
    const token = getToken();
    const fd = new FormData();
    fd.append("email_id", String(payload.email_id));
    fd.append("final_body", payload.final_body);
    if (payload.to_email) fd.append("to_email", payload.to_email);
    fd.append("attachment", attachment);
    const res = await fetch(
      `${API_BASE_URL}/api/leads/${leadId}/email/send-with-file`,
      {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      },
    );
    if (!res.ok) {
      let body: unknown = null;
      try { body = await res.json(); } catch {}
      throw new ApiError(res.status, body, `Request failed: ${res.status}`);
    }
    return res.json() as Promise<EmailSendResponse>;
  },
  list: (leadId: string) =>
    request<LeadEmail[] | { data: LeadEmail[] }>(`/api/leads/${leadId}/emails`),
};

// ============= Helpers =============
export const STATUS_LABEL: Record<LeadStatusApi, string> = {
  new: "New",
  called: "Called",
  demo_booked: "Demo Booked",
  won: "Won",
  lost: "Lost",
};

export const STATUS_OPTIONS: LeadStatusApi[] = [
  "new",
  "called",
  "demo_booked",
  "won",
  "lost",
];

