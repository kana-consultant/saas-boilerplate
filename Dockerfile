# ─── Stage 1: deps ────────────────────────────────────────────────────────────
FROM node:22-alpine AS deps

RUN corepack enable pnpm

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ─── Stage 2: build ───────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

RUN corepack enable pnpm

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN pnpm build

# ─── Stage 3: runner ──────────────────────────────────────────────────────────
FROM node:22-alpine AS runner

RUN corepack enable pnpm

WORKDIR /app

ENV NODE_ENV=production

# Only production deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

# Server entrypoint + build output
COPY server.mjs ./
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "server.mjs"]
