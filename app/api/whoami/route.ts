// Reports the caller's IP as seen by the server (after proxy headers). Handy for
// figuring out what value to put in ADMIN_IP_WHITELIST when locking down access.
// Unauthenticated and side-effect free.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export function GET(req: NextRequest) {
  const xff = req.headers.get("x-forwarded-for");
  const ip =
    (xff ? xff.split(",")[0]!.trim() : null) ||
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") ||
    req.ip ||
    null;
  return NextResponse.json({
    ip,
    whitelist_enabled: Boolean((process.env.ADMIN_IP_WHITELIST || "").trim()),
  });
}
