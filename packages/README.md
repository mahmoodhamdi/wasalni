# `packages/`

Shared libraries consumed by `apps/`. All packages are private
(`"private": true`) and consumed via the `workspace:*` protocol.

| Package                    | Purpose                                           | Status         |
| -------------------------- | ------------------------------------------------- | -------------- |
| `@wasalni/config-tsconfig` | Shared `tsconfig.json` bases                      | Ready — PR 2   |
| `@wasalni/config-eslint`   | Shared ESLint flat configs                        | Ready — PR 2   |
| `@wasalni/config-tailwind` | Tailwind preset + design tokens                   | Ready — PR 2   |
| `@wasalni/shared-types`    | Domain TS interfaces (located in `/shared`)       | Ready — PR 2   |
| `@wasalni/utils`           | Phone / currency / date / distance helpers        | Ready — PR 2   |
| `@wasalni/schemas`         | Zod runtime validators for forms + Route Handlers | Ready — PR 2   |
| `@wasalni/i18n`            | AR/EN message catalogues + locale primitives      | Ready — PR 2   |
| `@wasalni/api-client`      | Typed REST client (auth wired; others by feature) | Ready — PR 2   |
| `@wasalni/socket-client`   | Typed socket.io-client wrapper + event map        | Ready — PR 2   |
| `@wasalni/auth`            | Session cookie, CSRF primitives                   | Ready — PR 2   |
| `@wasalni/ui`              | shadcn/ui primitives + Wasalni components         | Stub — PR 4    |
| `@wasalni/map`             | MapLibre wrappers, autocomplete, route rendering  | Stub — PR 7    |
| `@wasalni/pwa`             | Service-worker, push, install, wake-lock helpers  | Stub — PR 6/16 |

See [docs/web-migration/PLAN.md](../docs/web-migration/PLAN.md).
