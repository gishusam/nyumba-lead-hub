// Browser-only API client for the Nyumba Zetu FastAPI backend.
// Reads token from localStorage and attaches it as Bearer.

export const API_BASE_URL =
  (import.meta as any).env?.VITE_API_BASE_URL ||
  "https://salesintelligence-production-8d1d.up.railway.app";

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
  const { auth = true, headers, ...rest } = init;
  const finalHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(headers as Record<string, string> | undefined),
  };
  if (auth) {
    const token = getToken();
    if (token) finalHeaders["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
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
  byArea: () =>
    request<Array<{ area: string; count: number }>>("/api/dashboard/by-area"),
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
export type LeadType = "apartment" | "agency" | "landlord";
export type LeadStatusApi =
  | "new"
  | "called"
  | "demo_booked"
  | "won"
  | "lost";

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
  status: LeadStatusApi;
  notes?: string | null;
  assigned_to?: string | null;
  last_contacted?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
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
  assigned_to?: string;
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

export const leadsApi = {
  list: (params: ListLeadsParams = {}) =>
    request<LeadListResponse>(`/api/leads${qs(params)}`),
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
