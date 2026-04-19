# Maison Parfum — E-commerce premium

Monorepo : **Next.js 14** (web) + **NestJS 10** (api) + **PostgreSQL 16** + **Redis 7**.

## Stack

| Layer | Tech | Version |
|---|---|---|
| Runtime | Node.js | 22 LTS |
| Package manager | pnpm | 9.12.x |
| Build orchestrator | Turborepo | 2.x |
| Frontend | Next.js (App Router) + Tailwind | 14.2.x |
| Backend | NestJS + Prisma | 10.x / 5.20.x |
| Database | PostgreSQL | 16 |
| Cache | Redis | 7.4 |
| Logs | Pino | 9 |
| Errors | Sentry (front + back) | 8.x |

## Arborescence

```
apps/
  api/   — NestJS (REST API, Prisma, Pino, Sentry)
  web/   — Next.js (App Router, Tailwind, Sentry)
packages/
  config-eslint/     — ESLint flat configs partagés (base / nest / next)
  config-tsconfig/   — tsconfig bases partagés
  shared-types/      — DTOs / types partagés front <-> back
  ui/                — primitives UI (design system à venir S4)
```

## Démarrage local

### Prérequis

- Node.js **22 LTS** (`nvm use`)
- pnpm **9.x** (`corepack enable && corepack prepare pnpm@9.12.3 --activate`)
- Docker Desktop

### Installation

```bash
# 1. Cloner puis installer les deps
pnpm install

# 2. Copier les fichiers .env
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# 3. Démarrer l'infra (Postgres + Redis + Mailhog)
pnpm docker:dev

# 4. Générer le client Prisma + migrer la DB
pnpm --filter @ecommerce/api prisma:generate
pnpm --filter @ecommerce/api prisma:migrate

# 5. Lancer les apps en parallèle (HMR)
pnpm dev
```

Accès :

- Web : http://localhost:3000
- API : http://localhost:3001/api
- Health : http://localhost:3001/health
- Mailhog UI : http://localhost:8025
- Postgres : `localhost:5432` (user: `ecom`)
- Redis : `localhost:6379`

### Scripts utiles

| Commande | Description |
|---|---|
| `pnpm dev` | Lance web + api en HMR |
| `pnpm build` | Build complet via Turbo |
| `pnpm lint` | ESLint tout le monorepo |
| `pnpm typecheck` | TypeScript strict partout |
| `pnpm test` | Jest (api) |
| `pnpm format` | Prettier --write |
| `pnpm docker:dev` | Démarre l'infra Docker |
| `pnpm docker:dev:down` | Arrête l'infra |
| `pnpm docker:dev:logs` | Logs conteneurs |

### Husky / commitlint

Les commits suivent la convention **Conventional Commits** :

```
feat(products): ajoute le endpoint GET /products
fix(auth): corrige la rotation du refresh token
```

Types autorisés : `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.

## Déploiement

- `main` → image Docker `ghcr.io/<org>/api:staging-<sha>` (voir `.github/workflows/deploy.yml`)
- Tag `v*.*.*` → image production

Configurer les **Secrets GitHub** : `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`, plus les secrets de ta cible de déploiement.

## Sécurité (Sprint 0 posée, durcie en Sprint 1)

- Helmet + CORS stricts ✅
- `ValidationPipe` global strict (whitelist + forbidNonWhitelisted) ✅
- Logs Pino avec redaction des headers sensibles ✅
- Sentry capture uniquement 5xx (4xx = validation → pas de bruit) ✅
- À venir en Sprint 1 : JWT rotation, bcrypt 12, rate-limiting Redis.

## Sprint en cours

**Sprint 0 — Setup & Infra** ✅ terminé.

Prochain : **Sprint 1 — Auth, Users, Catalogue, Stock**.
