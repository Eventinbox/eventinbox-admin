// Single typed fetch wrapper for the EventInbox API.
// - injects Authorization: Bearer <token> + JSON headers
// - parses error bodies into a thrown ApiError carrying { error }
// - on 401 clears the stored session and bounces to /signin

import { clearAuth, readToken } from "./storage";
import type {
  AdminFeedRow,
  AdminStats,
  AdminUsersResponse,
  ApiKey,
  AuthResponse,
  CreateApiKeyResponse,
  Delivery,
  DeliveryAttempt,
  Endpoint,
  RotateSecretResponse,
  StatsOverview,
  UsageStats,
  WebhookEvent,
} from "./types";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.eventinbox.pro";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export interface RequestOptions {
  method?: string;
  body?: unknown;
  // query params; undefined / empty values are dropped
  query?: Record<string, string | number | undefined>;
  // skip the Authorization header (public auth endpoints)
  auth?: boolean;
  // by default a 401 clears the session and bounces to /signin; set false to
  // surface it as a thrown ApiError instead (e.g. admin probes, where a 401
  // means "not an admin" — render 404 — not "your session expired").
  redirectOn401?: boolean;
  signal?: AbortSignal;
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = new URL(
    path.startsWith("http") ? path : `${API_BASE_URL}${path}`,
  );
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== "" && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

export async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, query, auth = true, redirectOn401 = true, signal } = opts;

  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (body !== undefined) headers["Content-Type"] = "application/json";

  if (auth) {
    const token = readToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
      cache: "no-store",
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new ApiError(
      "Network error — could not reach the API. Check your connection and try again.",
      0,
    );
  }

  if (res.status === 401 && auth && redirectOn401) {
    clearAuth();
    if (typeof window !== "undefined") {
      const here = window.location.pathname + window.location.search;
      const target = here && here !== "/signin" ? `?next=${encodeURIComponent(here)}` : "";
      window.location.assign(`/signin${target}`);
    }
    throw new ApiError("Your session has expired. Please sign in again.", 401);
  }

  // 204 / empty body
  const text = await res.text();
  const data = text ? safeJson(text) : null;

  if (!res.ok) {
    const message =
      (data && typeof data === "object" && "error" in data
        ? String((data as { error: unknown }).error)
        : undefined) || `Request failed (${res.status})`;
    throw new ApiError(message, res.status);
  }

  return data as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Typed endpoint surface (staging contract)
// ---------------------------------------------------------------------------

export const api = {
  // Auth (public)
  signin: (email: string, password: string) =>
    request<AuthResponse>("/api/v1/auth/signin", {
      method: "POST",
      auth: false,
      body: { email, password },
    }),

  // Signup now requires email verification before sign-in, so it no longer
  // returns a session token — only a confirmation (user/workspace may be
  // present depending on the API, but the dashboard doesn't rely on them).
  signup: (input: {
    email: string;
    password: string;
    full_name: string;
    workspace_name?: string;
  }) =>
    request<{ message?: string } & Partial<AuthResponse>>(
      "/api/v1/auth/signup",
      { method: "POST", auth: false, body: input },
    ),

  verifyEmail: (token: string) =>
    request<{ message: string }>("/api/v1/auth/verify-email", {
      method: "POST",
      auth: false,
      body: { token },
    }),

  resendVerification: (email: string) =>
    request<{ message: string }>("/api/v1/auth/resend-verification", {
      method: "POST",
      auth: false,
      body: { email },
    }),

  forgotPassword: (email: string) =>
    request<{ message: string }>("/api/v1/auth/forgot-password", {
      method: "POST",
      auth: false,
      body: { email },
    }),

  resetPassword: (token: string, newPassword: string) =>
    request<{ message: string }>("/api/v1/auth/reset-password", {
      method: "POST",
      auth: false,
      body: { token, new_password: newPassword },
    }),

  // Stats
  statsOverview: (signal?: AbortSignal) =>
    request<StatsOverview>("/api/v1/stats/overview", { signal }),
  statsUsage: (signal?: AbortSignal) =>
    request<UsageStats>("/api/v1/stats/usage", { signal }),

  // Endpoints
  listEndpoints: (signal?: AbortSignal) =>
    request<Endpoint[]>("/api/v1/endpoints", { signal }),
  getEndpoint: (id: string, signal?: AbortSignal) =>
    request<Endpoint>(`/api/v1/endpoints/${id}`, { signal }),
  createEndpoint: (input: {
    name: string;
    destination_url: string;
    max_attempts?: number;
    max_concurrency?: number;
    timeout_seconds?: number;
  }) => request<Endpoint>("/api/v1/endpoints", { method: "POST", body: input }),
  updateEndpoint: (
    id: string,
    input: {
      name?: string;
      destination_url?: string;
      max_attempts?: number;
      max_concurrency?: number;
      timeout_seconds?: number;
    },
  ) => request<Endpoint>(`/api/v1/endpoints/${id}`, { method: "PUT", body: input }),
  deleteEndpoint: (id: string) =>
    request<{ status: string }>(`/api/v1/endpoints/${id}`, { method: "DELETE" }),
  enableEndpoint: (id: string) =>
    request<{ status: string }>(`/api/v1/endpoints/${id}/enable`, {
      method: "POST",
    }),
  disableEndpoint: (id: string) =>
    request<{ status: string }>(`/api/v1/endpoints/${id}/disable`, {
      method: "POST",
    }),
  rotateSecret: (id: string) =>
    request<RotateSecretResponse>(`/api/v1/endpoints/${id}/rotate-secret`, {
      method: "POST",
    }),
  sendTestEvent: (id: string) =>
    request<{ delivery_id?: string; event_id?: string; status?: string }>(
      `/api/v1/endpoints/${id}/test-event`,
      { method: "POST" },
    ),

  // Events
  listEvents: (
    query?: { event_type?: string; endpoint_id?: string; status?: string; limit?: number },
    signal?: AbortSignal,
  ) => request<WebhookEvent[]>("/api/v1/events", { query, signal }),
  getEvent: (id: string, signal?: AbortSignal) =>
    request<WebhookEvent>(`/api/v1/events/${id}`, { signal }),
  replayEvent: (id: string) =>
    request<{ delivery_id: string; status: string }>(
      `/api/v1/events/${id}/replay`,
      { method: "POST" },
    ),

  // Deliveries
  listDeliveries: (
    query?: { status?: string; endpoint_id?: string; limit?: number },
    signal?: AbortSignal,
  ) => request<Delivery[]>("/api/v1/deliveries", { query, signal }),
  getDelivery: (id: string, signal?: AbortSignal) =>
    request<Delivery>(`/api/v1/deliveries/${id}`, { signal }),
  listDeliveryAttempts: (id: string, signal?: AbortSignal) =>
    request<DeliveryAttempt[]>(`/api/v1/deliveries/${id}/attempts`, { signal }),
  replayDelivery: (id: string) =>
    request<{ delivery_id: string; status: string }>(
      `/api/v1/deliveries/${id}/replay`,
      { method: "POST" },
    ),

  // Settings — API keys
  listApiKeys: (signal?: AbortSignal) =>
    request<ApiKey[]>("/api/v1/settings/api-keys", { signal }),
  createApiKey: (name: string) =>
    request<CreateApiKeyResponse>("/api/v1/settings/api-keys", {
      method: "POST",
      body: { name },
    }),
  revokeApiKey: (id: string) =>
    request<{ status: string }>(`/api/v1/settings/api-keys/${id}`, {
      method: "DELETE",
    }),

  // Admin (cross-tenant). Gated by the API — 401/404 for non-admins. These
  // never trigger the global 401 -> /signin bounce: a non-admin probing the
  // admin surface must see a 404, not get signed out of their own session.
  adminStats: (signal?: AbortSignal) =>
    request<AdminStats>("/api/v1/admin/stats", { signal, redirectOn401: false }),
  adminUsers: (
    query?: { limit?: number; offset?: number; q?: string },
    signal?: AbortSignal,
  ) =>
    request<AdminUsersResponse>("/api/v1/admin/users", {
      query,
      signal,
      redirectOn401: false,
    }),
  adminFeed: (query?: { limit?: number }, signal?: AbortSignal) =>
    request<AdminFeedRow[]>("/api/v1/admin/feed", {
      query,
      signal,
      redirectOn401: false,
    }),
};
