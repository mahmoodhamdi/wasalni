# `@wasalni/passenger-web`

The passenger-facing PWA. Built with Next.js 16 App Router, Tailwind 4,
shadcn-style primitives from `@wasalni/ui`, and `next-intl` with full RTL
support for Arabic and English.

## Develop

```bash
pnpm install            # from the repo root
pnpm --filter=@wasalni/passenger-web dev
```

The dev server runs on **<http://localhost:3100>**.

`/` redirects to `/ar` (default locale). To switch locale, use the header
toggle or visit `/en` directly.

## Environment

Default values are wired so the app boots without any `.env` set. Override
by creating `apps/passenger-web/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3100
# Server-only secrets:
BACKEND_URL=http://localhost:3000/api/v1
SESSION_SECRET=replace-me
```

## Scripts

| Script | Purpose |
|---|---|
| `pnpm dev` | Next.js dev server on port 3100 |
| `pnpm build` | Production build |
| `pnpm start` | Production server (port 3100) |
| `pnpm lint` | `next lint` (eslint flat config from `@wasalni/config-eslint/next`) |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | Placeholder until PR 21 |

## Structure

```
apps/passenger-web/
├── app/
│   ├── [locale]/        ← localised routes (AR/EN)
│   ├── api/             ← Next.js Route Handlers
│   ├── globals.css      ← Tailwind + Wasalni preset
│   └── global-error.tsx
├── components/          ← app-specific composites (header, switchers)
├── i18n/                ← next-intl routing + request config
├── lib/                 ← typed env, utilities
├── messages/            ← AR/EN catalogues (merged with @wasalni/i18n)
├── public/              ← static assets
├── middleware.ts        ← next-intl locale middleware
├── next.config.ts
├── postcss.config.mjs
├── tsconfig.json
└── package.json
```

What's coming next: auth (PR 5), PWA shell (PR 6), booking (PR 8).
See [`docs/web-migration/PLAN.md`](../../docs/web-migration/PLAN.md).
