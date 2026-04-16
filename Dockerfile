# ─── Stage 1: deps ────────────────────────────────────────────────────────────
FROM node:22-alpine AS deps

RUN corepack enable pnpm

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
RUN pnpm install --frozen-lockfile

# ─── Stage 2: build web ───────────────────────────────────────────────────────
FROM node:22-alpine AS build

RUN corepack enable pnpm

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY . .

RUN pnpm --filter @saas/web build

# ─── Stage 3: runner ──────────────────────────────────────────────────────────
FROM node:22-alpine AS runner

RUN corepack enable pnpm

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV WEB_DIST_PATH=/app/apps/web/dist

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
RUN pnpm install --frozen-lockfile --filter @saas/api...

COPY apps/api/src ./apps/api/src
COPY apps/api/tsconfig.json ./apps/api/
COPY --from=build /app/apps/web/dist ./apps/web/dist

EXPOSE 3000

WORKDIR /app/apps/api
CMD ["pnpm", "start"]
