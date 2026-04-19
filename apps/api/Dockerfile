# syntax=docker/dockerfile:1.7
# ---------- Stage 1 : deps ----------
FROM node:22-alpine AS deps
RUN corepack enable && corepack prepare pnpm@9.12.3 --activate
WORKDIR /repo

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/config-tsconfig/package.json ./packages/config-tsconfig/
COPY packages/config-eslint/package.json ./packages/config-eslint/
COPY packages/shared-types/package.json ./packages/shared-types/

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm config set store-dir /pnpm/store && \
    pnpm install --frozen-lockfile

# ---------- Stage 2 : build ----------
FROM node:22-alpine AS build
RUN corepack enable && corepack prepare pnpm@9.12.3 --activate
WORKDIR /repo

COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/apps/api/node_modules ./apps/api/node_modules
COPY . .

RUN pnpm --filter @ecommerce/api prisma:generate
RUN pnpm --filter @ecommerce/api build

# Prune dev deps for runtime
RUN pnpm --filter @ecommerce/api deploy --prod /out

# ---------- Stage 3 : runtime ----------
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
RUN apk add --no-cache dumb-init curl && \
    addgroup -S app && adduser -S app -G app
WORKDIR /app

COPY --from=build --chown=app:app /out/node_modules ./node_modules
COPY --from=build --chown=app:app /repo/apps/api/dist ./dist
COPY --from=build --chown=app:app /repo/apps/api/prisma ./prisma
COPY --from=build --chown=app:app /repo/apps/api/package.json ./package.json

USER app
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fsS http://localhost:3001/health/live || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
