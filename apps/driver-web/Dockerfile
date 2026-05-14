# syntax=docker/dockerfile:1.7

# ────────────────────────────────────────────────────────────────────
# Wasalni Driver Web (PWA)  — multi-stage Docker build
# ────────────────────────────────────────────────────────────────────
# docker build -f apps/driver-web/Dockerfile -t wasalni/driver-web .
# ────────────────────────────────────────────────────────────────────

ARG NODE_VERSION=20

FROM node:${NODE_VERSION}-alpine AS base
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@11.0.9 --activate
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml .npmrc package.json ./
COPY apps/passenger-web/package.json apps/passenger-web/
COPY apps/driver-web/package.json apps/driver-web/
COPY admin-dashboard/package.json admin-dashboard/
COPY backend/package.json backend/
COPY shared/package.json shared/
COPY packages packages
RUN find packages -mindepth 2 -maxdepth 2 -name 'src' -exec rm -rf {} +
RUN pnpm install --frozen-lockfile --filter @wasalni/driver-web... --filter @wasalni/driver-web

FROM base AS builder
ENV NEXT_OUTPUT_FILE_TRACING_ROOT=/app
COPY --from=deps /app /app
COPY . .
RUN pnpm --filter=@wasalni/driver-web build

FROM node:${NODE_VERSION}-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3200
RUN addgroup --system --gid 1001 nextjs && \
    adduser  --system --uid 1001 nextjs
COPY --from=builder --chown=nextjs:nextjs /app/apps/driver-web/public ./public
COPY --from=builder --chown=nextjs:nextjs /app/apps/driver-web/.next/standalone ./
COPY --from=builder --chown=nextjs:nextjs /app/apps/driver-web/.next/static ./apps/driver-web/.next/static
USER nextjs
EXPOSE 3200
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3200/api/healthz | grep -q '"status":"ok"' || exit 1
CMD ["node", "apps/driver-web/server.js"]
