"use client";

import { useEffect, useState } from "react";
import { adminApi, ApiError } from "./api-client";
import { useAuth } from "./auth-context";
import { isTokenExpired } from "./jwt";
import type { AdminStats } from "./types";

export type AdminAccess =
  | { status: "loading"; stats: null; error: null }
  | { status: "granted"; stats: AdminStats; error: null }
  | { status: "denied"; stats: null; error: null }
  | { status: "error"; stats: null; error: string };

const LOADING: AdminAccess = { status: "loading", stats: null, error: null };
const DENIED: AdminAccess = { status: "denied", stats: null, error: null };

// Module-level cache + pub/sub so the layout guard and every admin page share a
// single probe per session. Keyed by token so switching accounts re-probes.
let cacheToken: string | null = null;
let cache: AdminAccess = LOADING;
let inflight = false;
const listeners = new Set<() => void>();

function set(next: AdminAccess) {
  cache = next;
  for (const listener of listeners) listener();
}

function probe(token: string) {
  if (inflight && cacheToken === token) return;
  cacheToken = token;
  inflight = true;
  set(LOADING);
  adminApi
    .stats()
    .then((stats) => set({ status: "granted", stats, error: null }))
    .catch((err: unknown) => {
      // 401/403/404 => not an admin: deny (render the access-denied gate), never
      // surface as a hard error and never sign the user out of their session.
      if (err instanceof ApiError && [401, 403, 404].includes(err.status)) {
        set(DENIED);
      } else {
        set({
          status: "error",
          stats: null,
          error:
            err instanceof Error
              ? err.message
              : "Couldn't reach the admin API.",
        });
      }
    })
    .finally(() => {
      inflight = false;
    });
}

/**
 * Probe GET /api/v1/admin/stats once per session and report whether the current
 * user may see the admin surface. The server is the authoritative gate: admin
 * status lives in the database, not in the JWT, so a 200 means admin and
 * 401/403/404 means not. We only short-circuit to "denied" locally when there's
 * no session at all (or the token is expired).
 */
export function useAdminAccess(): AdminAccess & { retry: () => void } {
  const { token, ready } = useAuth();
  const [, force] = useState(0);

  useEffect(() => {
    const tick = () => force((n) => n + 1);
    listeners.add(tick);

    if (!ready) {
      // Auth not hydrated yet — keep showing the loading skeleton.
    } else if (!token || isTokenExpired(token)) {
      // No session (or an expired one): deny without a call.
      cacheToken = null;
      if (cache.status !== "denied") set(DENIED);
    } else if (cacheToken !== token) {
      // Authenticated: the API is the authoritative gate. Admin status is not
      // carried in the JWT, so we must probe /admin/stats to know — a 200 means
      // admin, 401/403/404 means not.
      probe(token);
    }

    return () => {
      listeners.delete(tick);
    };
  }, [token, ready]);

  const retry = () => {
    if (!token) return;
    cacheToken = null;
    probe(token);
  };

  return { ...cache, retry };
}
