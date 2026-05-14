# `passenger-app/` (Flutter) — DEPRECATED

> The Flutter passenger app is **no longer the primary surface**. New
> features land in [`apps/passenger-web`](../apps/passenger-web/) —
> the Next.js 16 PWA — instead.

## Why

- The PWA reaches passengers without an App Store install, ships in
  seconds via a URL, and is dramatically faster to iterate
  (hot-reload + Vercel-style preview deploys vs. native builds).
- See [`docs/web-migration/PLAN.md`](../docs/web-migration/PLAN.md) for
  the full rationale, architecture decisions, and migration trade-offs.

## Status

- Kept in-tree as a reference codebase and so we can still ship critical
  bug-fixes if a future need arises.
- **No new features.** Bug fixes only, by exception.
- Branch convention: `flutter/passenger/<short-slug>` (e.g. `flutter/passenger/hotfix-…`).

## Use the web app instead

- Development: `pnpm --filter=@wasalni/passenger-web dev` (port 3100)
- Deployment: see [`docs/web-migration/DEPLOY.md`](../docs/web-migration/DEPLOY.md)

## When this directory is removed

Once the Flutter apps have been off-app-store for **90 days** with no
critical issues against the PWAs, this directory will be moved to a
\`legacy/\` git-archive ref and deleted from `main`.
