# SaaS Boilerplate

A full-stack SaaS starter built with TanStack Start, featuring multi-tenancy, role-based access control, authentication, and a production-ready infrastructure setup.

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | TanStack Start (React 19, SSR) |
| Routing | TanStack Router (file-based) |
| Data fetching | TanStack Query + oRPC |
| Auth | better-auth (email/password, Google OAuth) |
| Database | PostgreSQL 16 + Drizzle ORM |
| Cache | Redis 7 + ioredis |
| Styling | Tailwind CSS v4 + shadcn/ui |
| i18n | Paraglide v2 (EN + ID) |
| Analytics | PostHog |
| Linting | Biome |
| Dev environment | devenv.sh + direnv |

## Getting Started

### Prerequisites

Install [devenv](https://devenv.sh) and [direnv](https://direnv.net), then:

```bash
direnv allow   # starts Postgres + Redis automatically
pnpm install
```

Copy environment variables:

```bash
cp .env.example .env.local
```

Required variables:

```env
DATABASE_URL=postgresql://tanstack:tanstack@127.0.0.1:5432/tanstack_start_dev
REDIS_URL=redis://127.0.0.1:6379
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=   # pnpm dlx @better-auth/cli secret
```

Optional:

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
VITE_POSTHOG_KEY=
```

### Database

```bash
pnpm db:push     # apply schema
pnpm db:seed     # seed super-admin + demo user + demo org
```

Seed credentials:

| Email | Password | Role |
|-------|----------|------|
| superadmin@example.com | Password123! | super-admin |
| user@example.com | Password123! | member |

### Dev server

```bash
pnpm dev
```

## Production

### Docker (recommended)

```bash
docker compose up --build
```

Set the required env vars in a `.env` file at the project root before running. The compose file wires up app + Postgres + Redis automatically.

### Manual

```bash
pnpm build
pnpm start
```

The production server (`server.mjs`) uses `@hono/node-server` to serve static assets with immutable cache headers and SSR via the TanStack Start fetch handler.

## Project Structure

```
src/
  libs/
    drizzle/        # DB client, schema, seed
    redis/          # cache helpers (get/set/del)
    paraglide/      # i18n messages + generated runtime
  routes/
    __root.tsx      # root layout, session fetch, locale
    _public/        # unauthenticated routes (auth pages, org create)
    _authenticated/ # org-scoped routes (dashboard, users, roles, etc.)
  server/
    auth/           # better-auth config + permissions
    orpc/           # middleware, context, router client
    routers/        # oRPC procedure definitions
    activity.ts     # shared activity log helper
```

## Role System

Two layers:

- **Platform role** (`user.role`): `super-admin` only — bypasses all org checks, god mode across every org.
- **Org role** (`member.role`): `owner` / `admin` / `member` — per-org permissions, configurable via the permissions matrix in the UI.

## i18n

Language is set via the `?lang=` query param (`en` or `id`). Switch using the dropdown in the sidebar footer. Add messages to `src/libs/paraglide/messages/`.

## Database commands

```bash
pnpm db:generate   # generate migration files
pnpm db:migrate    # run migrations
pnpm db:push       # push schema directly (dev)
pnpm db:pull       # pull schema from DB
pnpm db:studio     # open Drizzle Studio
pnpm db:seed       # seed demo data
```

## Scripts

```bash
pnpm dev           # start dev server (port 3000)
pnpm build         # production build
pnpm start         # serve production build
pnpm lint          # biome lint
pnpm format        # biome format
pnpm check         # biome check
pnpm test          # vitest
```
