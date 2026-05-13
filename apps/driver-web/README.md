# `@wasalni/driver-web`

The driver-facing PWA. Mirrors `@wasalni/passenger-web` in stack and patterns
(Next.js 16, Tailwind 4, shadcn primitives from `@wasalni/ui`, `next-intl`
with full RTL). Diverges only in branding and flows: documents upload,
online/offline toggle, ride requests, Wake Lock during driving.

## Develop

```bash
pnpm --filter=@wasalni/driver-web dev
```

Runs on **<http://localhost:3200>**.

## Environment

Default values boot the app without `.env`. Override with
`apps/driver-web/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3200
BACKEND_URL=http://localhost:3000/api/v1
SESSION_SECRET=replace-me
```

## Background-tracking honesty

A web app **cannot** track location while the tab is closed/backgrounded.
The driver app makes this explicit on the landing page and will use the
Screen Wake Lock API (PR 7) to keep the screen on during a shift.
