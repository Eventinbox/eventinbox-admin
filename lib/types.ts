// Types mirror the EventInbox API schemas (Eventinbox/ei-server, staging).

export interface User {
  id: string;
  email: string;
  full_name: string;
  created_at?: string;
  updated_at?: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug?: string;
  created_at?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  workspace: Workspace;
}

export interface Endpoint {
  id: string;
  tenant_id?: string;
  workspace_id?: string;
  name: string;
  destination_url: string;
  is_active?: boolean;
  is_enabled?: boolean;
  max_attempts?: number;
  max_concurrency?: number;
  timeout_seconds?: number;
  created_at?: string;
  updated_at?: string;
}

export type EventStatus = "pending" | "delivered" | "failed";

export interface WebhookEvent {
  id: string;
  tenant_id?: string;
  endpoint_id?: string;
  event_type?: string;
  payload_hash?: string;
  payload_size_bytes?: number;
  content_type?: string;
  status?: EventStatus;
  received_at?: string;
  delivery_count?: number;
}

export type DeliveryStatus = "pending" | "processing" | "delivered" | "failed";

export interface Delivery {
  id: string;
  event_id?: string;
  endpoint_id?: string;
  status?: DeliveryStatus;
  attempt_count?: number;
  max_attempts?: number;
  next_attempt_at?: string | null;
  last_error?: string | null;
  delivered_at?: string | null;
  failed_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface DeliveryAttempt {
  id: string;
  delivery_id?: string;
  attempt_number?: number;
  response_status?: number | null;
  error_message?: string | null;
  duration_ms?: number | null;
  attempted_at?: string;
}

export interface StatsOverview {
  events_today: number;
  delivery_rate: number;
  active_endpoints: number;
  failed_last_24h: number;
  pending_now: number;
  delivered_total: number;
  failed_total: number;
}

// Current billing-period event usage vs. the free-tier monthly cap, from
// GET /api/v1/stats/usage. Drives the plan/usage meter in Settings.
export interface UsageStats {
  // billing period the counts belong to, e.g. "2026-06"
  period: string;
  events_count: number;
  limit: number;
}

export interface ApiKey {
  id: string;
  name: string;
  key_prefix?: string;
  last_used_at?: string | null;
  created_at?: string;
}

export interface CreateApiKeyResponse {
  api_key: ApiKey;
  key: string;
  note?: string;
}

export interface RotateSecretResponse {
  signing_secret: string;
  note?: string;
}

// ---------------------------------------------------------------------------
// Admin (cross-tenant). The whole admin surface is gated by the API: every
// admin endpoint returns 401/404 for non-admins, which the dashboard renders
// as the standard 404 (see lib/use-admin.ts).
// ---------------------------------------------------------------------------

// Mirrors handlers.adminStatsResponse (GET /api/v1/admin/stats). Counts are
// global (cross-workspace). success_rate_24h is a ratio in [0,1] over settled
// deliveries (delivered / (delivered + failed)) in the last 24h, and is null
// when nothing settled in the window.
export interface AdminStats {
  users: number;
  verified_users: number;
  workspaces: number;
  endpoints: number;
  events: {
    total: number;
    last_24h: number;
  };
  deliveries: {
    total: number;
    last_24h: number;
    delivered_24h: number;
    failed_24h: number;
    success_rate_24h: number | null;
  };
}

// Mirrors handlers.adminUserRow (GET /api/v1/admin/users). No id is returned;
// email is the stable key. email_verified_at is null until the user verifies.
export interface AdminUser {
  email: string;
  full_name: string;
  created_at: string;
  email_verified_at: string | null;
  workspace_count: number;
  // Optional, forward-looking fields. Reflected in the UI when the API returns
  // them (admin flag toggle, suspended badge); undefined otherwise.
  is_admin?: boolean;
  suspended_at?: string | null;
}

// Mirrors handlers.adminUsersResponse. `total` counts every user matching the
// `q` filter (not just the returned page), so the UI can paginate.
export interface AdminUsersResponse {
  users: AdminUser[];
  total: number;
}

// Mirrors handlers.adminFeedRow (GET /api/v1/admin/feed) — cross-workspace
// delivery metadata only (no ids, no payload). endpoint_host is the
// destination URL reduced to its host server-side.
export interface AdminFeedRow {
  event_type: string;
  endpoint_host: string;
  status: string;
  attempts: number;
  created_at: string;
}
