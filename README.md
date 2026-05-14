# Wasalni (وصّلني)

> توصيلتك علينا — your ride, by your neighbours

Local ride-hailing platform for Bagour city (El-Menofia, Egypt) and 47
surrounding villages. Serves ~350 000 residents.

## Status — May 2026

Web-only platform. Both apps are feature-complete, tested, and ready to
ship behind a domain.

| Surface | Stack | Status |
|---|---|---|
| **passenger-web** (PWA) | Next.js 16 + Tailwind 4 + MapLibre + Serwist | ✅ Ready |
| **driver-web** (PWA) | Next.js 16 + Tailwind 4 + Wake Lock + Serwist | ✅ Ready |
| backend | Node.js + Express + Socket.io + MongoDB + Redis | ✅ Unchanged |
| admin-dashboard | Next.js 16 + Tailwind | ✅ Unchanged |

**New here?** Read [`docs/web-migration/ONBOARDING.md`](./docs/web-migration/ONBOARDING.md)
first — it covers everything you need to be productive in 30 minutes.

---

## Quick start

```bash
# 1. Install workspace deps (pnpm + Turborepo)
pnpm install

# 2. Bring up Mongo + Redis for local dev
docker compose -f docker-compose.dev.yml up -d mongodb redis

# 3. Run the backend API
cd backend && cp .env.example .env && pnpm dev   # :3000

# 4. Run a web app (pick one, or both in separate terminals)
pnpm --filter=@wasalni/passenger-web dev          # :3100
pnpm --filter=@wasalni/driver-web    dev          # :3200
```

Open <http://localhost:3100/ar> (passenger) or <http://localhost:3200/ar>
(driver). Both default to Arabic; flip via the header switcher.

---

## Repo map

```
wasalni/
├── apps/
│   ├── passenger-web/        Next.js 16 PWA — book, track, pay, rate
│   └── driver-web/           Next.js 16 PWA — go online, accept, drive
├── admin-dashboard/          Next.js admin panel (operator UI)
├── backend/                  Node.js + Express API (mongo/redis/socket.io)
├── packages/                 14 shared workspace packages:
│   ├── config-{tsconfig,eslint,tailwind,vitest}/   shared configs
│   ├── shared-types/         domain TS interfaces (used by every layer)
│   ├── schemas/              Zod runtime validators (forms + handlers)
│   ├── utils/                phone / currency / date / distance helpers
│   ├── i18n/                 AR/EN catalogues + locale primitives
│   ├── ui/                   shadcn-style primitives (Button, OtpInput…)
│   ├── map/                  MapLibre wrappers + autocomplete + routes
│   ├── api-client/           typed REST client + endpoint groups
│   ├── socket-client/        typed socket.io wrapper + React hooks
│   ├── auth/                 cookie session + CSRF + Next server helpers
│   └── pwa/                  install / wake-lock / SW-update / FCM / web-vitals
├── shared/                   Legacy TS types (re-exported by @wasalni/shared-types)
├── docs/web-migration/       Migration plan, deployment guide, onboarding
├── deploy/nginx/             Production reverse-proxy config
└── docker-compose.web.yml    Full production stack
```

---

## Features

### Passenger PWA

- Phone + OTP sign-in, profile editor
- Book a ride: pickup + dropoff autocomplete, 5 ride types, live fare
  estimate, promo codes, payment method (cash / wallet / card via Paymob)
- Live trip tracking: driver pin with heading + ETA, route polyline,
  in-trip chat, **SOS** button (long-press, alerts safety team + emergency
  contacts), **shareable** trip URL for family/friends
- Trip lifecycle: completion screen with fare breakdown + rating + history
- Wallet: balance, transactions, EGP formatting
- Notifications: FCM web push (env-gated)
- Offline shell + installable on every modern browser
- AR + EN with full RTL

### Driver PWA

- Phone + OTP, registration with vehicle + national ID
- Pending approval screen
- Home: live map, online/offline toggle, **Wake Lock** keeps screen on
  during shift, earnings preview
- Incoming ride requests: full-screen modal with countdown, accept/decline
- Active trip: navigation to pickup → trip start → trip complete
  progression, in-trip chat, **SOS**
- Earnings: today / week / month, withdrawal flow, transactions list
- Trips history
- Honest disclosure: web cannot do true background tracking; UX says so

### Both

- Installable PWA (manifest + Serwist service worker + offline fallback)
- Strict CSP, HSTS, frame-ancestors none, COOP/CORP
- httpOnly cookie session + CSRF double-submit
- Web-Vitals → `/api/metrics` (swap for Sentry by editing the route)
- next-intl AR/EN, light/dark/system theme

---

## Tech stack

| Concern | Choice |
|---|---|
| Framework | Next.js 16 (App Router, webpack, standalone output) |
| Styling | Tailwind CSS 4 + shadcn primitives + Cairo font + oklch palette |
| State | Zustand (client) + TanStack Query (server) |
| Forms | React Hook Form + Zod (same schemas server-side) |
| i18n | next-intl 4 — AR default, EN switchable, full RTL |
| Maps | MapLibre GL JS + OpenFreeMap tiles (no API key, MIT) |
| Real-time | socket.io-client 4 (typed event map mirroring backend) |
| Auth | JWT in httpOnly cookie via Next.js Route Handler proxy |
| Payments | Paymob iframe checkout |
| Push | Firebase Cloud Messaging Web (VAPID, env-gated) |
| PWA | Serwist (next-pwa successor) + Wake Lock API |
| Testing | Vitest + React Testing Library + Playwright |
| CI/CD | GitHub Actions — typecheck, lint, format, test, build, e2e, lighthouse, security |
| Deploy | Docker + nginx (host A/B/C/D for the 4 subdomains) |

---

## Service area + pricing

- **Primary**: Bagour city centre + 47 surrounding villages
- **Planned expansion**: Shebin El-Kom, Ashmoun, Menouf
- **Ride types**: Economy, Comfort, Family (7-seater), Tuk-Tuk, Motorcycle
- **Commission**: 20% per completed trip
- **Fees**: booking fee, surge pricing, scheduled-ride premium,
  intercity trip premium (+25%), cancellation fee

---

## Documentation

| Doc | Audience |
|---|---|
| [`docs/web-migration/ONBOARDING.md`](./docs/web-migration/ONBOARDING.md) | New contributors |
| [`docs/web-migration/PLAN.md`](./docs/web-migration/PLAN.md) | Architecture + decision log |
| [`docs/web-migration/DEPLOY.md`](./docs/web-migration/DEPLOY.md) | Operators — production deploy |
| [`SECURITY.md`](./SECURITY.md) | Researchers / security audits |
| [`docs/API.md`](./docs/API.md), [`docs/REALTIME_EVENTS.md`](./docs/REALTIME_EVENTS.md) | Backend integration |

---

## License

Private — all rights reserved.

## Contact

ops@wasalni.app · security@wasalni.app · help@wasalni.app

---

Built with care for the people of Bagour and El-Menofia.
