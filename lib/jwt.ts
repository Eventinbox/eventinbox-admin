// Best-effort decode of the JWT *payload* for a fast, client-side admin hint.
//
// This is NOT a security boundary — we never trust it for access control. The
// authoritative gate is the API itself: every /api/v1/admin/* route returns
// 401/403/404 to non-admins (see lib/auth-guard.tsx, which probes adminStats).
// Decoding the claim here just lets us deny instantly when the token plainly
// isn't an admin token, avoiding a flash of admin UI before the probe resolves.

export interface JwtClaims {
  sub?: string;
  email?: string;
  is_admin?: boolean;
  exp?: number;
  [key: string]: unknown;
}

function base64UrlDecode(segment: string): string {
  const pad = segment.length % 4 === 0 ? "" : "=".repeat(4 - (segment.length % 4));
  const base64 = segment.replace(/-/g, "+").replace(/_/g, "/") + pad;
  if (typeof atob === "function") return atob(base64);
  // SSR fallback (this module is only meaningfully used client-side).
  return Buffer.from(base64, "base64").toString("binary");
}

export function decodeJwt(token?: string | null): JwtClaims | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const json = decodeURIComponent(
      base64UrlDecode(parts[1])
        .split("")
        .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, "0")}`)
        .join(""),
    );
    return JSON.parse(json) as JwtClaims;
  } catch {
    return null;
  }
}

/** True only when the token carries an explicit `is_admin: true` claim. */
export function tokenLooksAdmin(token?: string | null): boolean {
  return decodeJwt(token)?.is_admin === true;
}

/** True when the token has an `exp` claim already in the past. */
export function isTokenExpired(token?: string | null): boolean {
  const exp = decodeJwt(token)?.exp;
  if (typeof exp !== "number") return false;
  return exp * 1000 <= Date.now();
}
