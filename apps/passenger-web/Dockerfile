# syntax=docker/dockerfile:1.7

# ────────────────────────────────────────────────────────────────────
# Wasalni Passenger Web (PWA)  — multi-stage Docker build
# ────────────────────────────────────────────────────────────────────
# Build is run from the repo root:
#   docker build -f apps/passenger-web/Dockerfile -t wasalni/passenger-web .
# Standalone output keeps the final image small (~150 MB).
# ────────────────────────────────────────────────────────────────────

ARG NODE_VERSION=20

FROM node:${NODE_VERSION}-alpine AS base
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@11.0.9 --activate
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# ─── 1. install ──────────────────────────────────────────────────────
FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml .npmrc package.json ./
COPY apps/passenger-web/package.json apps/passenger-web/
COPY apps/driver-web/package.json apps/driver-web/
COPY admin-dashboard/package.json admin-dashboard/
COPY backend/package.json backend/
COPY shared/package.json shared/
COPY packages packages
# (We copy package.json files first so this layer caches across source edits.)
RUN find packages -mindepth 2 -maxdepth 2 -name 'src' -exec rm -rf {} +
RUN pnpm install --frozen-lockfile --filter @wasalni/passenger-web... --filter @wasalni/passenger-web

# ─── 2. build ────────────────────────────────────────────────────────
FROM base AS builder
ENV NEXT_OUTPUT_FILE_TRACING_ROOT=/app
COPY --from=deps /app /app
COPY . .
RUN pnpm --filter=@wasalni/passenger-web build

# ─── 3. runtime ──────────────────────────────────────────────────────
FROM node:${NODE_VERSION}-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3100
RUN addgroup --system --gid 1001 nextjs && \
    adduser  --system --uid 1001 nextjs
COPY --from=builder --chown=nextjs:nextjs /app/apps/passenger-web/public ./public
COPY --from=builder --chown=nextjs:nextjs /app/apps/passenger-web/.next/standalone ./
COPY --from=builder --chown=nextjs:nextjs /app/apps/passenger-web/.next/static ./apps/passenger-web/.next/static
USER nextjs
EXPOSE 3100
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3100/api/healthz | grep -q '"status":"ok"' || exit 1
CMD ["node", "apps/passenger-web/server.js"]
