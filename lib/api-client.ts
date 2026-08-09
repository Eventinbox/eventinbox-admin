// Admin API surface for the EventInbox admin dashboard.
//
// Re-exports the shared, typed fetch client (lib/api.ts — copied verbatim from
// eventinbox-dashboard) and layers the admin-only *mutations* on top: toggling
// an account's admin flag, suspending / unsuspending, deleting, and replaying a
// delivery cross-tenant.
//
// Read endpoints (stats / users / feed) already live on the base `api` object
// and are gated by the server — they return 401/403/404 to non-admins, which we
// translate into a clean "access denied" rather than signing the user out.
//
// NOTE on the mutations below: the read surface (GET /admin/stats|users|feed) is
// the part of the API the dashboard already consumes today. The write surface is
// modelled on the conventional REST shape the server is expected to expose; each
// call surfaces a precise ApiError (e.g. 404 "not implemented") if a route isn't
// live yet, so the UI degrades to a clear toast instead of failing silently.
// Users are keyed by email — the admin users payload returns no id.

import { api, ApiError, request } from "./api";
import type { AdminFeedRow, AdminStats, AdminUsersResponse } from "./types";

export { ApiError };
export { API_BASE_URL } from "./api";

function userPath(email: string, suffix = ""): string {
  return `/api/v1/admin/users/${encodeURIComponent(email)}${suffix}`;
}

export const adminApi = {
  // ---- Reads (already server-gated) ---------------------------------------
  stats: (signal?: AbortSignal): Promise<AdminStats> => api.adminStats(signal),

  users: (
    query?: { limit?: number; offset?: number; q?: string },
    signal?: AbortSignal,
  ): Promise<AdminUsersResponse> => api.adminUsers(query, signal),

  feed: (
    query?: { limit?: number },
    signal?: AbortSignal,
  ): Promise<AdminFeedRow[]> => api.adminFeed(query, signal),

  // ---- Mutations -----------------------------------------------------------
  // Flip an account's admin flag.
  setAdmin: (email: string, isAdmin: boolean) =>
    request<{ email: string; is_admin: boolean }>(userPath(email, "/admin"), {
      method: "POST",
      body: { is_admin: isAdmin },
      redirectOn401: false,
    }),

  // Suspend an account (blocks sign-in / API access without deleting data).
  suspendUser: (email: string) =>
    request<{ email: string; status: string }>(userPath(email, "/suspend"), {
      method: "POST",
      redirectOn401: false,
    }),

  // Lift a suspension.
  unsuspendUser: (email: string) =>
    request<{ email: string; status: string }>(userPath(email, "/unsuspend"), {
      method: "POST",
      redirectOn401: false,
    }),

  // Permanently delete an account and its workspaces. Irreversible.
  deleteUser: (email: string) =>
    request<{ status: string }>(userPath(email), {
      method: "DELETE",
      redirectOn401: false,
    }),

  // Re-dispatch a delivery by event id (cross-tenant). The current /admin/feed
  // payload is metadata-only and exposes no id, so the feed wires this up but
  // keeps the per-row button disabled until the API surfaces event ids.
  replayEvent: (eventId: string) =>
    request<{ delivery_id: string; status: string }>(
      `/api/v1/admin/events/${encodeURIComponent(eventId)}/replay`,
      { method: "POST", redirectOn401: false },
    ),
};

// Convenience re-export so pages can do `import { api } from "@/lib/api-client"`.
export { api };
