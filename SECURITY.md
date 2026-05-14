# Security Policy

## Reporting a vulnerability

Please **do not** open public GitHub issues for security problems. Instead,
email **security@wasalni.app** with:

1. Affected component (passenger-web, driver-web, backend, admin-dashboard,
   infra, etc.)
2. Steps to reproduce — exact request payload, expected vs actual behaviour
3. Impact assessment (read PII, escalate auth, drain funds, etc.)
4. Suggested mitigation, if you have one

We acknowledge reports within **48 hours**, target a patch within
**14 days** for high-severity issues, and credit reporters in the
release notes unless you ask otherwise.

## Scope

In-scope:

- `apps/passenger-web` and `apps/driver-web` (the two PWAs)
- `apps/admin-dashboard` (legacy admin)
- `backend/` (the Node.js API)
- The shared `packages/*`

Out-of-scope:

- Third-party services (Paymob, Firebase, OpenFreeMap, OSM, MongoDB
  Atlas, Twilio/Unifonic) — report to those vendors directly

## Defence-in-depth posture

| Layer            | What's enforced                                                                                                                          |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Transport        | HSTS preload, `upgrade-insecure-requests`                                                                                                |
| Auth             | JWT in `Secure; HttpOnly; SameSite=Lax` cookie set only by the Next.js Route Handler proxy. No JS access. 7-day TTL matching backend.    |
| CSRF             | Double-submit cookie (`wasalni.csrf`) echoed back via `X-Wasalni-Csrf` on every state-changing route handler. Constant-time compare.     |
| CSP              | Strict CSP per app (`default-src 'self'`, scoped `script/style/img/connect/frame-src` allow-lists, `frame-ancestors 'none'`).            |
| XSS              | React's default escaping + Zod validation at every route handler boundary.                                                               |
| Clickjacking     | `X-Frame-Options: DENY` + `frame-ancestors 'none'`.                                                                                      |
| MIME sniffing    | `X-Content-Type-Options: nosniff`.                                                                                                       |
| Referrer leakage | `Referrer-Policy: strict-origin-when-cross-origin`.                                                                                      |
| Permissions      | `Permissions-Policy` whitelists only geolocation (self), camera (self), payment (passenger only). Microphone/USB/etc. all disabled.      |
| Rate limit       | `pnpm audit` on every PR (high/critical fails CI); Gitleaks on every PR; CodeQL on every PR; OWASP ZAP baseline nightly against staging. |
| Dependencies     | Dependabot grouped weekly updates. Lockfile committed.                                                                                   |

## Known caveats

1. **Web cannot do true background geolocation.** When a driver tab is
   closed or backgrounded by the OS the browser stops emitting position
   events. Mitigations:
   - Screen Wake Lock API while a shift is active
   - Clear UX copy ("keep the app open while you drive")
   - No silent failure — the driver app shows a "you're offline" banner
2. **iOS PWA limitations.** No background sync, geolocation re-prompts
   per session, 100 MB storage cap. Documented in the install card.
3. **Push on iOS** requires the PWA to be installed (Safari 16.4+).

## Coordinated disclosure timeline

| Step                  | Default SLA                                                              |
| --------------------- | ------------------------------------------------------------------------ |
| Acknowledge           | 48 h                                                                     |
| Initial triage        | 5 business days                                                          |
| Fix for High/Critical | 14 days                                                                  |
| Fix for Medium        | 30 days                                                                  |
| Public disclosure     | 90 days after report, or 30 days after a fix ships, whichever is earlier |
