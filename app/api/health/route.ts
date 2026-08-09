// Lightweight liveness probe for container orchestration / reverse proxies.
// Returns 200 unauthenticated with no redirects so a healthcheck can rely on it.

export const dynamic = "force-dynamic";

export function GET() {
  return new Response("ok", {
    status: 200,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
