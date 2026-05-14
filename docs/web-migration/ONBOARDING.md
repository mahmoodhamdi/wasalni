# Onboarding — Wasalni web

You just cloned the repo. Here's everything you need to be productive in
the next 30 minutes.

## TL;DR

```bash
# 1. Install
pnpm install                                  # ~2 min the first time

# 2. Start the backend (mongo + redis + the API)
cp .env.example .env                          # set MONGODB_URI, JWT_SECRET, etc.
docker compose -f docker-compose.dev.yml up -d mongodb redis
cd backend && pnpm dev &                       # API on :3000
cd ..

# 3. Start a web app (pick one or both)
pnpm --filter=@wasalni/passenger-web dev      # :3100
pnpm --filter=@wasalni/driver-web    dev      # :3200

# 4. Open
open http://localhost:3100/ar                 # passenger PWA
open http://localhost:3200/ar                 # driver PWA
```

## Repo map

```
wasalni/
├── apps/
│   ├── passenger-web/      <- Next.js 16 PWA, port 3100  (the future)
│   └── driver-web/         <- Next.js 16 PWA, port 3200  (the future)
├── admin-dashboard/        <- Existing Next.js admin panel
├── backend/                <- Node.js + Express API
├── passenger-app/          <- DEPRECATED Flutter app
├── driver-app/             <- DEPRECATED Flutter app
├── packages/               <- 14 shared workspace packages
│   ├── config-{tsconfig,eslint,tailwind,vitest}/  <- shared configs
│   ├── shared-types/   types/   <- domain interfaces
│   ├── schemas/        Zod runtime validators
│   ├── utils/          phone/currency/date/distance helpers
│   ├── i18n/           AR/EN message catalogues + locale primitives
│   ├── ui/             shadcn-style primitives (Button, OtpInput, …)
│   ├── map/            MapLibre wrappers (WasalniMap, PinMarker, …)
│   ├── api-client/     typed REST client + endpoint groups
│   ├── socket-client/  typed socket.io wrapper + React hooks
│   ├── auth/           cookie session + CSRF + Next-server helpers
│   └── pwa/            install/wake-lock/SW-update/FCM/web-vitals
└── docs/web-migration/
    ├── PLAN.md         <- THE migration source of truth
    ├── DEPLOY.md       <- Production deployment guide
    ├── ONBOARDING.md   <- you are here
    └── README.md
```

## Architecture (one diagram)

```
┌──────────────────────────────────────────────────────────────┐
│  Browser (passenger or driver PWA)                            │
│   ├── React 19 + Next 16 App Router                           │
│   ├── TanStack Query + Zustand                                │
│   ├── socket.io-client → live trip events                     │
│   └── Service Worker (Serwist) → offline shell + push (FCM)   │
└──────────────────────────────────────────────────────────────┘
                            │
                            │  httpOnly JWT cookie + CSRF header
                            ▼
┌──────────────────────────────────────────────────────────────┐
│  Next.js Route Handlers (proxy layer in /apps/*-web/app/api)  │
│   • Validates input with Zod schemas (@wasalni/schemas)       │
│   • Reads JWT from cookie, forwards as Bearer                 │
│   • Returns the backend envelope {success,data,error}         │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│  Wasalni Backend (existing Express API)                       │
│   MongoDB · Redis · Socket.io · Paymob · Firebase Admin       │
└──────────────────────────────────────────────────────────────┘
```

## Common commands

| Command                    | Purpose                         |
| -------------------------- | ------------------------------- |
| `pnpm install`             | Install workspace deps          |
| `pnpm dev` (in an app dir) | Hot-reloading dev server        |
| `pnpm turbo run typecheck` | All packages + apps             |
| `pnpm turbo run lint`      | All packages + apps             |
| `pnpm turbo run test`      | All Vitest suites               |
| `pnpm turbo run test:e2e`  | Playwright across both apps     |
| `pnpm format`              | Auto-format the migration scope |
| `pnpm turbo run build`     | Production build                |

## Where to find what

| Task                          | Path                                                                                           |
| ----------------------------- | ---------------------------------------------------------------------------------------------- |
| Change the AR/EN copy         | `packages/i18n/messages/{ar,en}.json` + per-app `apps/*/messages/`                             |
| Add a new design token        | `packages/config-tailwind/tokens.css`                                                          |
| Add a new shared UI component | `packages/ui/src/components/<name>.tsx` + export in `src/index.ts`                             |
| Add a new domain field        | `shared/types/index.ts` then mirror in `packages/schemas/src/<area>.ts`                        |
| Add a new backend endpoint    | `packages/api-client/src/endpoints/<area>.ts` + a Route Handler under `apps/*-web/app/api/...` |
| Add a new translation key     | per-app `messages/<locale>.json`, then use `useTranslations('namespace')`                      |

## Testing

### Unit + component (Vitest)

```bash
pnpm --filter=@wasalni/utils test            # one package
pnpm turbo run test '--filter=./packages/*'  # all packages
pnpm --filter=@wasalni/ui test:coverage      # with coverage
```

Tests live under `packages/<pkg>/test/`. Configs in `@wasalni/config-vitest`:

- `base` — Node env, 80/80/80/75 thresholds (logic-heavy)
- `react` — jsdom + React Testing Library + 75/75/75/70 thresholds

### E2E (Playwright)

```bash
pnpm --filter=@wasalni/passenger-web test:e2e
pnpm --filter=@wasalni/driver-web    test:e2e --ui   # interactive
```

Tests in `apps/*-web/e2e/`. Two projects per app: `mobile-arabic`
(Pixel 7, Bagour geolocation) and `desktop-english` (Chrome 1280×720).

## Code style

- TypeScript **strict** + `noUncheckedIndexedAccess`. No `any`.
- ESLint flat config from `@wasalni/config-eslint`. No `--max-warnings 0`
  exceptions on PRs.
- Prettier auto-formats: 100-col, single quotes, trailing commas.
- All new strings get an AR and EN translation. We RTL-test
  every UI change in Chrome DevTools' "Locale: ar-EG" emulation.
- Forms: React Hook Form + Zod (the same schemas used in the backend
  route handlers — single source of truth).

## Locale + RTL

Layout sets `<html dir="rtl" lang="ar">` for AR locale and flips
automatically via CSS logical properties (`ms-*`, `me-*`, `start-*`,
`end-*`). Use `rtl:rotate-180` on directional icons (arrows).

## How a feature lands

1. Cut a branch `web/NN-short-slug` from `main`.
2. Edit code. Run `pnpm format && pnpm turbo run typecheck && pnpm turbo run lint`.
3. Add tests. Hit `pnpm turbo run test`.
4. Open a PR. CI runs typecheck, lint, format:check, tests, build,
   Lighthouse, security (Gitleaks + npm audit + CodeQL).
5. After ≥1 review + green CI, merge.

## When the PWA is broken

1. Open browser DevTools → Application → Service Workers
2. Click **Unregister** for `wasalni.session` and reload (hard refresh
   with cache disabled)
3. The new SW will fetch, install, and the SW update banner offers
   "Update" on the next request

For driver Wake Lock issues: check `chrome://flags` → "Generic Sensor"
enabled, screen-wake-lock requires HTTPS in production.

## Read next

- [`docs/web-migration/PLAN.md`](./PLAN.md) — architecture decisions and
  the 22-PR roadmap (now complete)
- [`docs/web-migration/DEPLOY.md`](./DEPLOY.md) — production deployment
- [`SECURITY.md`](../../SECURITY.md) — disclosure policy + defence-in-depth
