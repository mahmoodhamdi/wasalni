# Wasalni Web Migration Plan

> **Status (May 2026):** ✅ **Migration complete.** Both PWAs are
> feature-complete, tested, and packaged for production deployment. The
> legacy Flutter apps have been removed from the repo (their history is
> still available in git).
>
> **Goal (historic):** Replace the two legacy native mobile apps with two
> installable Progressive Web Apps (PWAs). Backend (`backend`) and
> `admin-dashboard` were absorbed into a pnpm + Turborepo monorepo with
> no contract changes.

This document was the **single source of truth** for the migration. It now
captures the final architecture, decisions, and PR roadmap.

---

## 1. Why we migrated to Web PWAs

| Criterion                       | Native mobile (previous)           | Web PWA (current)                           |
| ------------------------------- | ---------------------------------- | ------------------------------------------- |
| Iteration speed                 | rebuild + reinstall per device     | hot‑reload, single URL, instant rollout     |
| Testing surface                 | emulator + device matrix           | Playwright on real browsers, mocked sensors |
| Customisation per‑city          | rebuild + Play/AppStore review     | edit a config, push, every client updates   |
| Onboarding friction (passenger) | install from store, ~30 MB         | open URL, optional "Add to Home Screen"     |
| Engineering pool                | Mobile-specific (smaller)          | TS/React (larger)                           |
| Existing in‑repo expertise      | admin-dashboard is already Next.js | reuses stack, no new toolchain              |

Proven precedent: **m.uber.com**, **ride.lyft.com**, **Twitter Lite**, **Pinterest**,
**Starbucks** — all production PWAs replacing or supplementing native apps.

### Honest trade‑offs we accept

1. **No true background geolocation.** When a driver tab is closed/backgrounded
   by the OS, the browser stops emitting `geolocation` events. Mitigations:
   - Screen Wake Lock API to keep screen on while driving
   - Persistent‑notification install nudges
   - Clear UX copy ("keep the app open while you drive")
   - Foreground‑service‑equivalent is not possible on the web; this is a known
     limitation we communicate to drivers, not a bug
2. **iOS PWA quirks.** No background sync, geolocation re‑prompts per session,
   100 MB storage cap. Acceptable for passengers; for drivers we recommend
   Android. iOS users can still use the site without installing.
3. **Push on iOS** requires the PWA to be installed to the home screen
   (Safari 16.4+). We surface an install card before requesting push.

---

## 2. Architecture decisions (final)

### 2.1 Stack

| Concern       | Choice                                                             | Reason                                                                            |
| ------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| Framework     | **Next.js 16 (App Router)**                                        | Same as `admin-dashboard`; server components, image opt, ISR, file‑system routing |
| Language      | **TypeScript strict**                                              | Type‑safety + reuse of `shared/types`                                             |
| Styling       | **Tailwind CSS 4** + **shadcn/ui**                                 | Same as admin; Radix primitives are accessible by default                         |
| Client state  | **Zustand**                                                        | Same as admin; minimal API, RTL/SSR friendly                                      |
| Server state  | **TanStack Query v5**                                              | Caching, retries, optimistic updates, suspense‑ready                              |
| Forms         | **React Hook Form + Zod**                                          | Same as admin; one schema, type‑safe                                              |
| i18n          | **next-intl**                                                      | Native App Router support, ICU messages, full RTL, AOT compilation                |
| Maps          | **MapLibre GL JS** (via `react-map-gl/maplibre`)                   | WebGL, smooth route animation, no API key, beats Leaflet on perf                  |
| Tiles         | **OpenFreeMap** primary, OSM fallback                              | Free, no key, MIT‑licensed                                                        |
| Geocoding     | Backend `maps.service.ts` (Nominatim/Google)                       | Already abstracted server‑side; no client API keys                                |
| Real‑time     | **socket.io-client 4**                                             | Backend already uses Socket.io                                                    |
| HTTP          | **TanStack Query + native fetch** wrapped by `@wasalni/api-client` | One typed client across both apps                                                 |
| PWA           | **@serwist/next** (next‑pwa successor)                             | Maintained, App Router native, typed SW                                           |
| Push          | **Firebase Cloud Messaging Web (VAPID)**                           | Backend already wired to FCM                                                      |
| Payments      | **Paymob iFrame** (server‑issued payment key)                      | Egypt‑first; backend already integrates Paymob                                    |
| Auth          | **JWT in httpOnly cookies** via Next.js Route Handler proxy        | XSS‑proof; backend JWT untouched                                                  |
| Monorepo      | **pnpm workspaces + Turborepo**                                    | Industry standard 2026                                                            |
| Testing       | **Vitest** (unit/component) + **Playwright** (E2E)                 | Speed (Vitest), real‑browser coverage (Playwright)                                |
| Perf gates    | **Lighthouse CI**                                                  | Hard gates on every PR                                                            |
| Security      | **OWASP ZAP**, `npm audit`, **Snyk**, **Gitleaks**                 | Layered: deps, secrets, runtime                                                   |
| Observability | **Sentry** + **web-vitals** + (optional) **PostHog**               | Errors, perf, product analytics                                                   |
| Container     | **Docker** multi‑stage (consistent with existing)                  | Same deploy pattern as backend/admin                                              |
| CI/CD         | **GitHub Actions**                                                 | Repo already on GitHub                                                            |

### 2.2 Monorepo layout

```
/wasalni
├── apps/
│   ├── passenger-web/     ← NEW PWA (this migration)
│   └── driver-web/        ← NEW PWA (this migration)
├── packages/
│   ├── ui/                ← shadcn/ui base + Wasalni tokens
│   ├── api-client/        ← typed REST client + React Query hooks
│   ├── socket-client/     ← typed socket.io wrapper + React hooks
│   ├── map/               ← MapLibre wrappers, route rendering, autocomplete
│   ├── i18n/              ← shared AR/EN messages
│   ├── auth/              ← auth proxy helpers (cookies, CSRF, hooks)
│   ├── pwa/               ← service worker primitives, push, install, wake-lock
│   ├── config-eslint/     ← shared eslint
│   ├── config-tsconfig/   ← shared tsconfig bases
│   └── config-tailwind/   ← shared tailwind preset + design tokens
├── admin-dashboard/       ← EXISTING (joins workspace, unchanged otherwise)
├── backend/               ← EXISTING (joins workspace)
├── shared/                ← EXISTING TS types (re-exported by packages/api-client)
├── config/                ← city configs (untouched)
├── docs/web-migration/    ← this directory
├── pnpm-workspace.yaml
├── turbo.json
└── package.json           ← root workspace
```

Existing top‑level dirs (`admin-dashboard/`, `backend/`, `shared/`) are **not
moved** in PR 1 — they join the workspace via `pnpm-workspace.yaml` patterns.
That keeps PR 1 small and avoids touching ten thousand lines.

### 2.3 Per‑app layout (passenger‑web and driver‑web are symmetric)

```
apps/{app}/
├── app/
│   ├── [locale]/
│   │   ├── (public)/            ← unauthenticated (auth flow)
│   │   ├── (authed)/            ← authenticated app shell
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── api/                     ← Next.js Route Handlers (auth proxy, FCM register, CSRF)
│   ├── manifest.ts              ← PWA manifest (Next 16 metadata API)
│   ├── icon.tsx                 ← dynamic icon
│   ├── apple-icon.tsx
│   └── global-error.tsx
├── components/
│   ├── ui/                      ← thin app-level shadcn overrides
│   └── features/                ← booking/, trip/, earnings/, …
├── lib/
├── hooks/
├── stores/                      ← Zustand
├── messages/
│   ├── ar.json
│   └── en.json
├── public/
│   ├── icons/                   ← PWA icons
│   └── firebase-messaging-sw.js
├── sw.ts                        ← Serwist service worker
├── e2e/                         ← Playwright tests
├── tests/                       ← Vitest unit + component
├── lighthouserc.json
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### 2.4 Security baseline

| Control       | Implementation                                                                                                                                                                        |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Token storage | JWT in `Secure; HttpOnly; SameSite=Lax` cookie set by Next.js Route Handler                                                                                                           |
| CSRF          | Double‑submit cookie + `Origin`/`Sec-Fetch-Site` checks on Route Handlers                                                                                                             |
| CSP           | `default-src 'self'`; `script-src 'self' 'strict-dynamic' 'nonce-…'`; map tiles & FCM endpoints allow‑listed                                                                          |
| Headers       | `Strict-Transport-Security`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: geolocation=(self)`, `X-Content-Type-Options: nosniff` |
| Rate limit    | At Next.js Route Handler proxy + backend `express-rate-limit`                                                                                                                         |
| Dep scanning  | `npm audit` + Snyk on every PR                                                                                                                                                        |
| Secret scan   | Gitleaks on every PR                                                                                                                                                                  |
| Runtime       | OWASP ZAP baseline scan against preview deploys (nightly)                                                                                                                             |
| Input         | Zod validation on every Route Handler boundary                                                                                                                                        |
| Output        | DOMPurify for any rich text rendering                                                                                                                                                 |

### 2.5 Performance budget (per page, mobile 4G)

| Metric                      | Budget                              |
| --------------------------- | ----------------------------------- |
| LCP                         | ≤ 2.5 s                             |
| INP                         | ≤ 200 ms                            |
| CLS                         | ≤ 0.1                               |
| TBT                         | ≤ 200 ms                            |
| JS (initial route)          | ≤ 200 KB gzipped                    |
| Image bytes (initial route) | ≤ 150 KB                            |
| Lighthouse perf             | ≥ 90                                |
| Lighthouse a11y             | ≥ 95                                |
| Lighthouse best‑practices   | ≥ 95                                |
| Lighthouse SEO              | ≥ 90                                |
| Lighthouse PWA              | passes installable + offline checks |

Lighthouse CI gates fail the PR if any budget regresses by > 5 points.

### 2.6 Accessibility (WCAG 2.1 AA)

- All interactive elements keyboard reachable, focus visible
- ARIA labels on icon‑only buttons
- `lang` and `dir` attributes set per locale (`ar` → `rtl`)
- Color contrast ≥ 4.5:1 for body, 3:1 for large text
- `prefers-reduced-motion` respected for map animations and skeletons
- Screen‑reader manual smoke test before each PR that adds UI

### 2.7 PWA capabilities matrix

| Capability         | Passenger         | Driver            | API/Notes                                        |
| ------------------ | ----------------- | ----------------- | ------------------------------------------------ |
| Installable        | ✓                 | ✓                 | manifest + valid SW                              |
| Offline shell      | ✓                 | ✓                 | Serwist precache + offline fallback page         |
| Push notifications | ✓                 | ✓                 | FCM Web via VAPID, opt‑in card                   |
| Background sync    | ✓ where supported | ✓ where supported | queue rating, support messages                   |
| Periodic sync      | —                 | ✓ where supported | heartbeat reminder when offline                  |
| Wake Lock          | —                 | ✓                 | keep screen on while driving                     |
| Geolocation        | foreground        | foreground        | high‑accuracy, streamed via Socket.io for driver |
| Web Share          | ✓ trip share      | —                 | share live trip URL                              |
| File picker        | ✓ profile photo   | ✓ document upload | `<input type=file>` + image compression          |
| Web Push iOS       | requires install  | requires install  | Safari 16.4+                                     |

---

## 3. Roadmap (28 PRs)

Each PR is independently mergeable. Branch naming: `web/NN-short-slug`.
Commit style: Conventional Commits. Target diff size: ≤ 800 lines (test code
excluded from this target).

| #      | Title                    | Scope                                                                                                                          |
| ------ | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| **1**  | Monorepo skeleton + plan | pnpm-workspace.yaml, turbo.json, root package.json, this doc                                                                   |
| **2**  | Shared packages skeleton | `packages/{config-tsconfig,config-eslint,config-tailwind,types,ui,api-client,socket-client,auth,i18n,map,pwa}/` stubs + builds |
| **3**  | CI/CD pipeline           | GitHub Actions: lint, typecheck, test, build, Lighthouse, security                                                             |
| **4**  | Passenger scaffold       | Next.js 16 app, Tailwind, shadcn install, next-intl, theme, RTL                                                                |
| **5**  | Passenger auth           | phone+OTP+register+login flows, cookie session proxy, CSRF                                                                     |
| **6**  | Passenger PWA shell      | manifest, Serwist SW, offline page, install prompt                                                                             |
| **7**  | Map package              | MapLibre wrapper, place autocomplete, route rendering, marker primitives                                                       |
| **8**  | Passenger booking        | pickup/dropoff selection, ride type, fare estimation                                                                           |
| **9**  | Passenger live trip      | matching, driver tracking, ETA, in‑trip chat                                                                                   |
| **10** | Passenger lifecycle      | trip completion, rating, history, saved places                                                                                 |
| **11** | Passenger payments       | Paymob iframe, promos, wallet                                                                                                  |
| **12** | Passenger safety         | SOS, emergency contacts, live trip share link                                                                                  |
| **13** | Passenger profile        | FCM push opt‑in, profile, help, notifications inbox                                                                            |
| **14** | Driver scaffold          | Next.js 16 app reusing all packages                                                                                            |
| **15** | Driver auth              | phone+OTP+register+document upload+pending approval                                                                            |
| **16** | Driver PWA shell         | manifest, SW, Wake Lock, persistent notification                                                                               |
| **17** | Driver home              | online/offline toggle, foreground location streaming, earnings card                                                            |
| **18** | Driver ride requests     | incoming card, accept/decline, navigate to pickup with route                                                                   |
| **19** | Driver active trip       | in‑trip chat, route, passenger info, completion                                                                                |
| **20** | Driver back-office       | earnings, withdrawals, history, settings                                                                                       |
| **21** | Unit + component tests   | Vitest + RTL coverage for both apps, ≥ 80% target                                                                              |
| **22** | Integration tests        | api-client, socket-client, auth flows                                                                                          |
| **23** | E2E tests                | Playwright projects (mobile/desktop), golden paths both apps                                                                   |
| **24** | Lighthouse CI            | budgets + assertions wired to PRs                                                                                              |
| **25** | Security review          | ZAP baseline, Snyk, CSP polish, headers audit                                                                                  |
| **26** | Observability            | Sentry, web-vitals reporter, PostHog (optional)                                                                                |
| **27** | Production deploy        | Docker multi‑stage builds, nginx reverse proxy, compose updates                                                                |
| **28** | Final docs               | README updates, onboarding, deprecation banners on legacy apps                                                                 |

---

## 4. Execution rules

1. **One branch per PR.** Branch off the latest pushed state.
2. **PRs target `main`.** No long‑running integration branch.
3. **Conventional Commits.** `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`.
4. **CI must pass** before merge. CI gates: lint, typecheck, unit, build,
   Lighthouse (from PR 24 onwards), security (from PR 25 onwards).
5. **Tests with code.** Any PR that introduces logic ships with tests.
6. **No new lint or TS errors.** `--max-warnings 0`.
7. **Docs updated in‑PR.** If a decision changes, update this plan.
8. **Backend untouched** unless a contract gap is uncovered. Any backend change
   lands in its own PR with the integration that needed it.

---

## 5. Open questions deferred (decided unilaterally per user instruction)

These were resolved without pausing the user; rationale captured here so they
can be challenged later if needed.

| Question                    | Decision                                            | Rationale                                                              |
| --------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------- |
| Vite vs Next.js             | **Next.js 16**                                      | Stack parity with admin-dashboard, server components, ISR for help/FAQ |
| Leaflet vs MapLibre         | **MapLibre**                                        | WebGL, smoother route animation, ride‑hailing pattern                  |
| next-pwa vs Serwist         | **Serwist**                                         | Maintained, App Router native                                          |
| Cookie vs localStorage JWT  | **Cookie (httpOnly)**                               | XSS‑proof; Next.js Route Handler proxy hides Bearer tokens             |
| Vitest vs Jest              | **Vitest**                                          | 5–10× faster, ESM native, Vite ecosystem                               |
| Cypress vs Playwright       | **Playwright**                                      | Mobile emulation, multiple browsers, PWA install hooks                 |
| Mapbox vs OSM tiles         | **OpenFreeMap / OSM**                               | No API key, MIT, no per‑map‑load cost                                  |
| Self‑host vs Vercel         | **Docker self‑host** (Vercel optional for previews) | Backend already self‑hosted, sovereignty over data                     |
| Monolithic vs federated app | **Two separate apps, shared packages**              | Different update cadences, different perf budgets, independent deploy  |
| Driver background tracking  | **Foreground + Wake Lock + clear UX**               | True background isn't possible on web; documented limitation           |

---

## 6. Definition of Done (per PR)

- [ ] Branch is up to date with `main`
- [ ] Lint, typecheck, unit, integration, build all green
- [ ] New code covered by tests where applicable
- [ ] No regression in Lighthouse budgets (from PR 24)
- [ ] No new secret leaks (Gitleaks clean)
- [ ] No new high/critical vuln (`npm audit`)
- [ ] Plan doc updated if a decision changed
- [ ] PR description follows the template (Summary / Changes / Test plan / Screenshots)
- [ ] Manual smoke through golden path on the touched screen
