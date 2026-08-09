// Edge middleware: server-side IP whitelist for the entire admin surface.
//
// This is the one access check that genuinely belongs on the server — it reads
// the real client IP from the proxy headers before any page renders, so a
// non-whitelisted network never even receives the admin HTML. The in-app
// AuthGuard handles *who* you are (admin or not); this handles *where from*.
//
// Configure with ADMIN_IP_WHITELIST (server-only env, comma-separated). Leave it
// empty/unset to allow all IPs — the safe default for local dev and for setups
// that gate by network elsewhere (VPN, Cloudflare Access, etc.). Supports exact
// IPv4/IPv6 matches and CIDR-less prefix matches like "10.0." for convenience.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function clientIp(req: NextRequest): string | null {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return (
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") ||
    req.ip ||
    null
  );
}

function parseWhitelist(): string[] {
  return (process.env.ADMIN_IP_WHITELIST || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function isAllowed(ip: string | null, whitelist: string[]): boolean {
  if (whitelist.length === 0) return true; // default: allow all
  if (!ip) return false;
  // Normalize the IPv4-mapped IPv6 form (::ffff:127.0.0.1 -> 127.0.0.1).
  const normalized = ip.startsWith("::ffff:") ? ip.slice(7) : ip;
  return whitelist.some(
    (entry) =>
      normalized === entry ||
      ip === entry ||
      // "10.0." style prefix allow
      (entry.endsWith(".") && normalized.startsWith(entry)),
  );
}

export function middleware(req: NextRequest) {
  const whitelist = parseWhitelist();
  if (isAllowed(clientIp(req), whitelist)) {
    return NextResponse.next();
  }
  return new NextResponse(
    "Access denied — your network is not permitted to reach this admin console.",
    { status: 403, headers: { "content-type": "text/plain; charset=utf-8" } },
  );
}

// Run on the admin pages only — never on health checks, static assets, or the
// whoami helper (which must stay reachable to report the caller's own IP).
export const config = {
  matcher: ["/admin/:path*"],
};
