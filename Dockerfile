# syntax=docker/dockerfile:1

# ---- Base: pnpm via corepack -------------------------------------------------
FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /app

# ---- Dependencies ------------------------------------------------------------
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ---- Build -------------------------------------------------------------------
FROM base AS builder
# NEXT_PUBLIC_* values are inlined at build time, so the API URL must be present
# during `pnpm build`, not just at runtime.
ARG NEXT_PUBLIC_API_URL=https://api.eventinbox.pro
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# ---- Runner: minimal standalone image ----------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
# Carried through so it's also available to the running server.
ARG NEXT_PUBLIC_API_URL=https://api.eventinbox.pro
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
# Optional server-only IP allow-list enforced by middleware.ts (comma-separated).
# Leave unset to allow all networks.
ENV ADMIN_IP_WHITELIST=""

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# `output: "standalone"` emits a self-contained server with a pruned node_modules.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
