# EventInbox Admin

Internal admin console for [EventInbox](https://eventinbox.pro) — a separate
Next.js 14 app, deployed standalone at **admin.eventinbox.pro**. It shares the
dashboard's dark "infra" design system and its JWT session (the same token from
`localStorage`), but exposes only the cross-tenant admin surface.

## Features

- **Stats** (`/admin/stats`) — cross-tenant system overview: total events,
  24h delivery success rate, endpoints, users, workspaces, and a 7-day
  delivery-success trend chart, with a manual refresh.
- **Users** (`/admin/users`) — searchable, paginated directory of every
  account (10/page) with per-user actions: toggle admin, suspend / unsuspend,
  delete — each behind a confirm dialog with toast feedback.
- **Feed** (`/admin/feed`) — live cross-tenant delivery stream auto-refreshing
  every 5s, filterable by endpoint, with a per-row replay action.

## Access control (three layers)

| Layer | Where | Checks |
| --- | --- | --- |
| Network | `middleware.ts` | Optional IP allow-list (`ADMIN_IP_WHITELIST`) enforced server-side before any `/admin` page renders. Default: allow all. |
| Identity (fast) | `lib/auth-guard.tsx` + `lib/jwt.ts` | Authenticated (non-expired token) **and** `is_admin` claim present. A local UX short-circuit only. |
| Identity (authoritative) | `lib/use-admin-access.ts` → `GET /api/v1/admin/stats` | The API gates every admin route (401/403/404 for non-admins). This is the real boundary. |

Any failure redirects to `/signin?message=Access%20denied`. Visit
`/api/whoami` to see the IP the server sees for your connection when configuring
the whitelist.

## Local development

```bash
pnpm install
cp .env.example .env.local   # set NEXT_PUBLIC_API_URL
pnpm dev                     # http://localhost:3000  → redirects to /admin/stats
```

Sign in with an **admin** account. Non-admin credentials are rejected at the
sign-in screen (and would be denied by the API regardless).

## Environment

| Var | Required | Default | Notes |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | yes | `https://api.eventinbox.pro` | Inlined at **build time** into the client bundle. |
| `ADMIN_IP_WHITELIST` | no | _(empty = allow all)_ | Server-only. Comma-separated; exact IPv4/IPv6 or `10.0.` prefixes. |

> `NEXT_PUBLIC_*` is baked in during `pnpm build`, so it must be passed as a
> Docker **build arg**, not just a runtime env var.

## Build & run (Docker)

```bash
docker build --build-arg NEXT_PUBLIC_API_URL=https://api.eventinbox.pro -t eventinbox-admin .
docker run -p 3000:3000 -e ADMIN_IP_WHITELIST="" eventinbox-admin
```

Or with Compose:

```bash
NEXT_PUBLIC_API_URL=https://api.eventinbox.pro docker compose up --build
```

The image uses Next.js `output: "standalone"` on `node:20-alpine`, runs as a
non-root user, and exposes `:3000` with a `/api/health` healthcheck.

## Deploying to admin.eventinbox.pro (Dokploy)

1. **Create the application**
   - Dokploy → _Create_ → _Application_ → name it `eventinbox-admin`.
   - Source: this Git repository (branch `main`), or a Docker build from the
     included `Dockerfile`. Build type: **Dockerfile**.

2. **Build arguments** (Build → Args)
   - `NEXT_PUBLIC_API_URL=https://api.eventinbox.pro`
   - This is mandatory — the client bundle is compiled against it.

3. **Environment variables** (Environment)
   - `NEXT_PUBLIC_API_URL=https://api.eventinbox.pro`
   - `ADMIN_IP_WHITELIST=` — set to your office/VPN egress IPs to lock the
     console to trusted networks, or leave empty to allow all.

4. **Domain** (Domains → Add Domain)
   - Host: `admin.eventinbox.pro`
   - Container port: `3000`
   - Enable HTTPS (Let's Encrypt). Point a DNS `A`/`CNAME` record for
     `admin.eventinbox.pro` at the Dokploy host first.

5. **Health check**
   - Path: `/api/health` (returns `200 ok`, unauthenticated). The bundled
     `docker-compose.yml` already wires a wget probe if you deploy via Compose.

6. **Deploy** — Dokploy builds the Dockerfile, runs the standalone server, and
   fronts it with its Traefik proxy on the domain above. Redeploy on each push.

### CORS / API note

The admin app calls the EventInbox API directly from the browser with a Bearer
token. Ensure the API's CORS policy allows the `https://admin.eventinbox.pro`
origin (in addition to the dashboard origin).

## Project layout

```
app/
  admin/
    layout.tsx        AuthGuard + admin shell
    stats/page.tsx    system overview + trend chart
    users/page.tsx    user management (search, paginate, actions)
    feed/page.tsx     live cross-tenant delivery feed
    error.tsx         in-shell error boundary
  signin/page.tsx     admin sign-in
  api/health          liveness probe
  api/whoami          reports caller IP (for whitelist setup)
  error.tsx           root error boundary
  page.tsx            → redirects to /admin/stats
middleware.ts         server-side IP allow-list for /admin
components/
  admin/              shell, nav, logo, tables, trend chart
  ui/                 shared design system (ported from eventinbox-dashboard)
lib/
  api.ts              shared typed API client (verbatim from dashboard)
  api-client.ts       admin reads + mutations layered on api.ts
  auth-guard.tsx      the access gate
  use-admin-access.ts session-shared admin probe
  jwt.ts              local is_admin / expiry decode
```

## API surface used

Reads are live today: `GET /api/v1/admin/{stats,users,feed}`. The user
**mutations** (`setAdmin`, `suspend`, `unsuspend`, `delete`) and cross-tenant
**replay** in `lib/api-client.ts` follow the conventional REST shape the server
is expected to expose; each surfaces a clear error toast if a route isn't live
yet. The admin-flag toggle and suspended badge render from optional
`is_admin` / `suspended_at` fields the users payload may include.
