# `driver-app/` (Flutter) — DEPRECATED

> The Flutter driver app is **no longer the primary surface**. New
> features land in [`apps/driver-web`](../apps/driver-web/) — the
> Next.js 16 PWA — instead.

## Why

- The PWA reaches drivers via a URL — no Play Store delays, no APK
  side-loading, no per-update review.
- Live-rolled feature flags + same-day patches without recompiling APKs.
- See [`docs/web-migration/PLAN.md`](../docs/web-migration/PLAN.md) for
  the full rationale + the documented trade-offs around background
  geolocation (the PWA needs the app open; Wake Lock keeps the screen
  awake during shifts).

## Status

- Kept in-tree as a reference codebase. Bug fixes only, by exception.
- Branch convention: `flutter/driver/<short-slug>`.

## Use the web app instead

- Development: `pnpm --filter=@wasalni/driver-web dev` (port 3200)
- Deployment: see [`docs/web-migration/DEPLOY.md`](../docs/web-migration/DEPLOY.md)

## Background-geolocation honesty

The driver PWA cannot stream location while the tab/PWA is closed —
this is a browser limitation, documented up-front in the landing page
banner. The Wake Lock API keeps the screen on during an active shift,
and the auth flow nudges Android drivers to install the PWA so it sits
as a standalone window above other apps.

## When this directory is removed

Once the Flutter driver app has been off the Play Store for **90 days**
with no critical issues against the PWA, this directory will be moved to
a \`legacy/\` git-archive ref and deleted from `main`.
