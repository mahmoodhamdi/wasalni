# `packages/`

Shared libraries consumed by `apps/`. All packages are private (`"private": true`)
and consumed via the `workspace:*` protocol.

| Package                    | Purpose                                             | Status                 |
| -------------------------- | --------------------------------------------------- | ---------------------- |
| `@wasalni/config-tsconfig` | Shared `tsconfig.json` bases                        | Planned — PR 2         |
| `@wasalni/config-eslint`   | Shared ESLint configs                               | Planned — PR 2         |
| `@wasalni/config-tailwind` | Tailwind preset + design tokens                     | Planned — PR 2         |
| `@wasalni/types`           | Shared TypeScript types (re‑exports `/shared`)      | Planned — PR 2         |
| `@wasalni/ui`              | shadcn/ui primitives + Wasalni components           | Planned — PR 2         |
| `@wasalni/api-client`      | Typed REST client + TanStack Query hooks            | Planned — PR 2         |
| `@wasalni/socket-client`   | Typed socket.io‑client wrapper + hooks              | Planned — PR 2         |
| `@wasalni/auth`            | Cookie session, CSRF, auth hooks                    | Planned — PR 2         |
| `@wasalni/i18n`            | Shared AR/EN message catalogues                     | Planned — PR 2         |
| `@wasalni/map`             | MapLibre wrappers, autocomplete, route rendering    | Planned — PR 7         |
| `@wasalni/pwa`             | Service worker primitives, push, install, wake‑lock | Planned — PR 6 / PR 16 |

See [docs/web-migration/PLAN.md](../docs/web-migration/PLAN.md).
