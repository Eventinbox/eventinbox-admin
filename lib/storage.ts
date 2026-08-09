// Client-only persistence of the auth session. Guarded so it is safe to import
// from modules that may be evaluated during SSR (it simply no-ops on the server).

import type { AuthResponse } from "./types";

export const AUTH_STORAGE_KEY = "ei.auth";

export function readAuth(): AuthResponse | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthResponse;
  } catch {
    return null;
  }
}

export function writeAuth(auth: AuthResponse): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
}

export function clearAuth(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function readToken(): string | null {
  return readAuth()?.token ?? null;
}
