# 📘 Backlog — Maison Parfum

> **Source of truth** du projet e-commerce premium (Next.js + NestJS + PostgreSQL).
> Toute évolution du périmètre technique doit passer par ce fichier.

**Stack** : Node 22 LTS · pnpm 9 · Turborepo 2 · Next.js 14.2 · NestJS 10 · Prisma 5 · PostgreSQL 16 · Redis 7.4 · Stripe · Algolia · Cloudinary · Sentry 8.

---

## Table des matières

- [🚨 Priorités critiques](#-priorités-critiques)
- [⚠️ Risques techniques](#️-risques-techniques)
- [📏 Règles du projet](#-règles-du-projet)
- [🗺️ Vue d'ensemble des sprints](#️-vue-densemble-des-sprints)
- [📦 Sprints](#-sprints)
  - [Sprint 0 — Setup & Infra](#sprint-0--setup--infra)
  - [Sprint 1 — Auth, Users, Catalogue, Stock](#sprint-1--auth-users-catalogue-stock)
  - [Sprint 2 — Panier, Checkout, Stripe](#sprint-2--panier-checkout-stripe)
  - [Sprint 3 — Admin Panel](#sprint-3--admin-panel)
  - [Sprint 4 — SEO & UX Premium](#sprint-4--seo--ux-premium)
  - [Sprint 5 — Marketing](#sprint-5--marketing)
  - [Sprint 6 — Différenciation](#sprint-6--différenciation)
  - [Sprint 7 — Performance & Scale](#sprint-7--performance--scale)
  - [Sprint 8 — Premium & i18n](#sprint-8--premium--i18n)
- [🔗 Dépendances inter-sprints](#-dépendances-inter-sprints)
- [🗓️ Roadmap par version](#️-roadmap-par-version)

---

## 🚨 Priorités critiques

Ces points doivent être **irréprochables** avant toute mise en production. Un échec sur l'un d'eux bloque le go-live.

| # | Point critique | Sprint | Motivation |
|---|---|---|---|
| 1 | **Webhook Stripe idempotent** (table `WebhookEvent`, signature vérifiée, raw body) | S2 | Une double commande facturée = incident majeur |
| 2 | **Stock server-side transactionnel** (`UPDATE ... WHERE stock >= qty`) | S1/S2 | Survente = perte d'image de marque + remboursements |
| 3 | **Recalcul total côté serveur** (jamais faire confiance au panier client) | S2/S5 | Fraude prix / contournement promo |
| 4 | **Rate limiting auth** (login 5/min, register 3/min) via Redis | S1 | Prévention brute-force / énumération comptes |
| 5 | **Validation env au boot** (Zod fail-fast) | S0 | Éviter démarrage avec config invalide en prod |
| 6 | **Admin panel opérationnel** avant ouverture au public | S3 | Gérer commandes/stock/refunds au quotidien |
| 7 | **Emails transactionnels fiables** (confirmation, expédition, livraison) | S2/S5 | Confiance client + obligations légales |
| 8 | **Monitoring en place** (Sentry + logs Pino + health checks) | S0 | Detection & diagnostic des incidents |
| 9 | **Backups PostgreSQL automatiques** + tests de restauration | S7 | Continuité d'activité |
| 10 | **SEO technique** (sitemap, robots, metadata produits, JSON-LD) | S4 | Acquisition organique indispensable |

---

## ⚠️ Risques techniques

| Risque | Probabilité | Impact | Mitigation |
|---|---|---|---|
| Double traitement webhook Stripe | Moyenne | Critique | Table `WebhookEvent` avec `eventId` UNIQUE ; check avant traitement |
| Survente (race condition stock) | Élevée sans parade | Élevé | Transaction Prisma avec `where: { stock: { gte: qty } }` + `update` atomique |
| Fraude sur prix/promo (manipulation client) | Élevée | Critique | **Aucun** calcul de prix côté client ; promo code revalidé serveur |
| Commande orpheline PENDING (user abandonne après PaymentIntent) | Élevée | Moyen | Job BullMQ : cancel + release stock après 15 min |
| Emails non délivrés (bounce, spam) | Moyenne | Élevé | Resend webhooks → table `EmailLog` + alertes > 2% bounce |
| Saturation DB (requêtes N+1) | Moyenne | Élevé | Audit `EXPLAIN ANALYZE` S7 ; Prisma `select` ciblés ; PgBouncer |
| Fuite secrets dans repo | Faible | Critique | `.gitignore` strict, `git-secrets` hook, secret manager en prod |
| Images lourdes → LCP dégradé | Élevée | Moyen | Cloudinary transforms `f_auto,q_auto,w_auto` ; `next/image` obligatoire |
| Index Algolia désynchronisé de la DB | Moyenne | Moyen | Middleware Prisma → queue BullMQ idempotente ; script `reindex` nightly |
| Rupture CDN Cloudinary | Faible | Moyen | Fallback URL d'origine + cache long côté Vercel |
| Mot de passe admin compromis | Faible | Critique | 2FA TOTP obligatoire sur rôle ADMIN (S3) |
| RGPD non respecté (export/delete) | Moyenne | Critique | Endpoints `/users/me/export` + `/users/me/delete` (S8, pousser plus tôt si marché EU) |
| Écart devise / arrondis | Moyenne | Élevé | **Tout** en `Int` centimes. Jamais de `Float` sur l'argent |
| Time drift serveur (Stripe rejette les webhooks) | Faible | Moyen | NTP actif sur VPS + Docker `--synchronization-mode` |

---

## 📏 Règles du projet

Règles **non négociables** appliquées systématiquement par toute l'équipe.

### 💰 Monnaie & arithmétique

- **Tous les prix sont stockés et manipulés en `Int` (centimes)**. Pas de `Float`. Pas de `Decimal` côté app (on le laisse à Postgres `NUMERIC` uniquement si nécessaire).
- Affichage final : conversion en `Intl.NumberFormat` côté front.
- Aucune opération arithmétique sur les prix côté client → tout calculé serveur.

### 🛒 Commande & Paiement

- **Idempotence Stripe obligatoire** : table `WebhookEvent` avec `eventId UNIQUE`, check avant traitement.
- **Raw body** sur `/payments/webhook` (mount avant le JSON parser global).
- **Signature webhook** vérifiée via `stripe.webhooks.constructEvent(rawBody, sig, secret)` — rejet si invalide.
- **Recalcul total 100% server-side** : subtotal, discount, shipping, tax, total. Le client peut proposer, jamais décider.
- **Snapshots immutables** : `OrderItem.productName`, `OrderItem.unitPriceCents`, `Order.shippingAddress` sont figés à la création. Un changement produit ne réécrit pas l'historique.
- **États Order** transitent via une state machine explicite : `PENDING → PAID → PROCESSING → SHIPPED → DELIVERED`. Transitions invalides rejetées.

### 📦 Stock

- Décrément stock **toujours** en transaction Prisma avec `where: { stock: { gte: quantity } }`. Si 0 ligne affectée → `OutOfStockException`.
- **Réservation** au moment de la création du Order `PENDING` (log `StockMovement` reason=`RESERVATION`).
- **Décrément définitif** sur webhook `payment_intent.succeeded` (idempotent).
- **Release** sur webhook `payment_intent.payment_failed` OU sur job cron `PENDING > 15 min`.
- **Jamais de stock négatif** : contrainte DB + check applicatif.

### 🔐 Sécurité

- Aucun secret hardcodé. Tous les secrets en env + secret manager en prod.
- Passwords : **bcrypt rounds 12** minimum.
- JWT : access 15 min, refresh 7 j **hashé en DB**, rotation à chaque usage.
- Validation : `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })` global. Aucun DTO sans décorateurs `class-validator`.
- Sanitization : tous les champs free-text user-generated (reviews, notes) passent par DOMPurify server-side.
- Rate limiting : Throttler NestJS avec storage Redis.
- Uploads : **signed upload Cloudinary direct front**. Pas de proxy upload via API.
- Admin : **2FA TOTP obligatoire** (S3). Tous les endpoints `/admin/*` passent par `AuditLogInterceptor`.

### 🧪 Code & Qualité

- **TypeScript strict** : `strict: true`, `noUncheckedIndexedAccess`, `noImplicitOverride`.
- **Pas de `any` implicite**. `any` explicite toléré en dernier recours avec commentaire justificatif.
- **ESLint + Prettier bloquants** (CI fail si warning).
- **Conventional Commits** obligatoires (bloqué par commitlint).
- **Pas de code mort**. Suppression via `unused-imports` plugin.
- **DTOs partagés** entre front et back via `packages/shared-types`.
- **Prisma `select` ciblés** systématiquement (jamais d'`include` total sur endpoint public).

### 🚀 Déploiement

- **Migrations DB** : jamais de `migrate dev` en prod. Toujours `migrate deploy`.
- **Rolling deploy** côté API (health check avant bascule).
- **Feature flags** pour activer/désactiver Algolia, Quiz, WhatsApp sans redeploy.
- **Pas de downtime** : migrations backward-compatible (ajout de colonnes nullable, suppression différée).

### 📊 Observabilité

- **Logs structurés JSON** (Pino) en prod. Correlation ID (`x-request-id`) propagé.
- **Sentry** : front + back. Capture 5xx uniquement (pas 4xx validation).
- **Alerting** sur : 5xx > 1%, webhook Stripe fail, stock faible produits top 20.
- **Audit log** sur toute action admin mutante.

---

## 🗺️ Vue d'ensemble des sprints

| # | Sprint | Durée | Objectif | Dépend de |
|---|---|---|---|---|
| S0 | Setup & Infra | 4 j | Monorepo, Docker, CI/CD, Sentry, Pino | — |
| S1 | Auth, Users, Catalogue, Stock | 1 sem | Navigation catalogue authentifiée, stock tracké | S0 |
| S2 | Panier, Checkout, Stripe | 1 sem | Première commande payée fiable | S1 |
| S3 | Admin Panel | 1,5 sem | Autonomie équipe métier | S2 |
| S4 | SEO & UX Premium | 1 sem | Indexation Google + marque premium | S3 |
| S5 | Marketing | 1 sem | Codes promo, relance panier, emails complets | S3 |
| S6 | Différenciation | 2 sem | Algolia, quiz, reviews, tracking | S3, S5 |
| S7 | Performance & Scale | 1 sem | Site rapide sous charge | S4, S5, S6 |
| S8 | Premium & i18n | 2 sem | Reco, WhatsApp, multi-langue | S7 |

---

## 📦 Sprints

---

### Sprint 0 — Setup & Infra

**Durée** : 4 jours
**Dépendances** : aucune
**Objectif** : fondation technique solide avec observabilité dès le jour 1.

#### 🏗️ Infra & Outillage

- [ ] **T0.1** — Init monorepo `pnpm` + Turborepo (`apps/web`, `apps/api`, `packages/shared-types`, `packages/ui`, `packages/config-*`)
- [ ] **T0.2** — ESLint + Prettier + Husky + lint-staged + commitlint (Conventional Commits)
- [ ] **T0.3** — `tsconfig` strict partagé (`strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`)
- [ ] **T0.9** — Dockerfile multi-stage API (deps → build → runtime non-root, dumb-init PID 1, HEALTHCHECK)
- [ ] **T0.10** — `docker-compose.dev.yml` (Postgres 16 + Redis 7.4 + Mailhog) + `docker-compose.prod.yml`
- [ ] **T0.14** — `.env.example` documenté (racine + api + web) + `README.md` démarrage

#### ⚙️ Backend (NestJS)

- [ ] **T0.5** — NestJS 10 + `ConfigModule` + **validation Zod fail-fast** des variables d'env
- [ ] **T0.6** — Prisma 5 + `PrismaService` (OnModuleInit/Destroy) + schéma placeholder
- [ ] **T0.7** — Logger Pino (`nestjs-pino`) : JSON prod, pretty dev, **correlation ID** `x-request-id`, redaction headers sensibles
- [ ] **T0.8** — Sentry NestJS (`@sentry/node` + profiling) via `instrument.ts` chargé en premier
- [ ] **T0.13** — Endpoint `/health` (terminus : DB ping + Redis TCP) + `/health/live` (uptime)
- [ ] Filter global `AllExceptionsFilter` (Sentry capture 5xx, response normalisée)
- [ ] `ValidationPipe` global strict (`whitelist`, `forbidNonWhitelisted`, `transform`)

#### 🎨 Frontend (Next.js)

- [ ] **T0.4** — Next.js 14.2 App Router + Tailwind 3 + PostCSS + design tokens initiaux
- [ ] **T0.8 bis** — Sentry Next.js (client + server + edge) via `instrumentation.ts` + sourcemaps upload conditionnel

#### 🤖 CI/CD

- [ ] **T0.11** — GitHub Actions `ci.yml` : lint, typecheck, test (avec services Postgres/Redis), build, docker build API
- [ ] **T0.12** — GitHub Actions `deploy.yml` : staging sur `main`, production sur tags `v*.*.*`, push image GHCR

#### ✅ Definition of Done — Sprint 0

- `pnpm install` réussit sur Node 22.
- `pnpm dev` lance api + web en parallèle.
- `pnpm build` / `pnpm lint` / `pnpm typecheck` / `pnpm test` passent avec 0 warning.
- `docker compose -f docker-compose.dev.yml up -d` démarre Postgres + Redis + Mailhog healthy.
- `GET http://localhost:3001/health` retourne `status: ok` avec DB et Redis `up`.
- `GET http://localhost:3000` affiche la homepage Tailwind.
- Un commit non-conventional est **rejeté** par commitlint.
- Un env manquant fait **échouer le boot** avec message explicite.
- Un push déclenche le workflow CI sur GitHub Actions (tous jobs verts).
- README permet à un nouveau dev de démarrer en < 15 minutes.

---

### Sprint 1 — Auth, Users, Catalogue, Stock

**Durée** : 1 semaine
**Dépendances** : S0 complet
**Objectif** : catalogue consultable, authentification fonctionnelle, stock tracké avec traçabilité.

#### 🔐 Backend — Auth & Users

- [ ] **T1.1** — Schéma Prisma : `User`, `Address`, `RefreshToken`, enum `Role`
- [ ] **T1.2** — Module `users` : service + repository
- [ ] **T1.3** — Module `auth` : `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`
- [ ] **T1.4** — `JwtStrategy` (passport) + `JwtAuthGuard` + `RolesGuard`
- [ ] **T1.5** — Décorateurs `@Public()`, `@Roles('ADMIN')`, `@CurrentUser()`
- [ ] **T1.6** — Bcrypt rounds 12, refresh token **hashé en DB**, rotation à chaque usage, révocation sur logout
- [ ] **T1.7** — Email verification : token signé + endpoint `/auth/verify-email` + envoi mail
- [ ] **T1.8** — Password reset : `/auth/forgot-password` + `/auth/reset-password`

#### 🛡️ Backend — Sécurité globale

- [ ] **T1.9** — `ValidationPipe` global strict (déjà posé S0, vérifier DTO couverts)
- [ ] **T1.10** — Helmet + CORS whitelist stricte (origin depuis env)
- [ ] **T1.11** — Rate limiting (`@nestjs/throttler` + storage Redis) : global 60/min, `/auth/login` 5/min, `/auth/register` 3/min
- [ ] **T1.12** — Sanitization DOMPurify server-side sur champs free-text

#### 📦 Backend — Catalogue & Stock

- [ ] **T1.13** — Schéma : `Category` (self-reference tree), `Product`, `ProductVariant`, `ProductImage`, `StockMovement`, enums `Gender`, `StockStatus`, `StockReason`
- [ ] **T1.14** — Module `categories` : `GET /categories`, `GET /categories/:slug` (public) ; mutations admin
- [ ] **T1.15** — Module `products` : `GET /products` (pagination cursor, filtres `category`, `gender`, `minPrice`, `maxPrice`, `sort`), `GET /products/:slug`, `GET /products/featured`, `GET /products/:id/related`
- [ ] **T1.16** — Module `stock` : service avec méthodes `reserveStock`, `releaseStock`, `decrementStock` — **toutes** en transaction Prisma avec `where: { stock: { gte: qty } }`
- [ ] **T1.17** — Middleware/hook Prisma : update `Product.stockStatus` selon `stock` vs `lowStockThreshold`
- [ ] **T1.18** — Seed script : 3 catégories + 20 produits démo + images placeholder

#### 🎨 Frontend — Auth & Catalogue

- [ ] **T1.19** — Layout global : Header (nav, search icon, cart, compte) + Footer
- [ ] **T1.20** — Pages `/connexion`, `/inscription`, `/compte` + middleware Next.js protégeant `/compte/*`
- [ ] **T1.21** — Page `/produits` (Server Component, `generateMetadata` dynamique)
- [ ] **T1.22** — Page `/produits/[slug]` (SSG + `revalidate: 60`, `generateStaticParams`)
- [ ] **T1.23** — Badge "Plus que X en stock" / "Rupture de stock" sur fiche et card
- [ ] **T1.24** — Client API typé (`lib/api-client.ts`) avec refresh token automatique sur 401

#### ✅ Definition of Done — Sprint 1

- Un utilisateur peut s'inscrire, vérifier son email, se connecter, rafraîchir son token, se déconnecter.
- Les endpoints `/auth/login` et `/auth/register` sont rate-limités (test : > 5 tentatives/min → 429).
- Les listes de produits paginent correctement (cursor-based) avec filtres fonctionnels.
- Une fiche produit est accessible en SSG avec metadata dynamique.
- Un test unitaire prouve que `decrementStock` refuse si `stock < quantity`.
- Un test unitaire prouve qu'un DTO avec champ non-whitelisté est rejeté.
- Le seed produit 20 produits visibles sur la page `/produits`.
- Lighthouse sur fiche produit : Accessibilité ≥ 90.

---

### Sprint 2 — Panier, Checkout, Stripe

**Durée** : 1 semaine
**Dépendances** : S1 complet
**Objectif** : flow d'achat complet et fiable, webhook Stripe idempotent, emails de confirmation.

#### 🛒 Backend — Panier

- [ ] **T2.1** — Store Zustand `cartStore` (persist localStorage) + drawer panier *(frontend)*
- [ ] **T2.2** — Module `cart` backend : table `Cart` (associée `userId` ou `sessionId` pour invité)
- [ ] **T2.3** — Endpoint `POST /cart/sync` : sync panier client → serveur
- [ ] **T2.4** — Endpoint `POST /cart/validate` : revérifie stock + prix actuels + retourne subtotal recalculé

#### 💳 Backend — Orders & Stripe

- [ ] **T2.5** — Schéma : `Order`, `OrderItem`, `Payment`, **`WebhookEvent`** (idempotence), enums `OrderStatus`, `PaymentProvider`, `PaymentStatus`, `WebhookEventStatus`
- [ ] **T2.6** — `POST /orders` flow complet :
  1. Validation DTO
  2. **Transaction** : lock produits, check stock, `reserveStock` (log `StockMovement` `RESERVATION`)
  3. Recalcul **total server-side**
  4. Create Order `PENDING` + Payment `PENDING`
  5. Create Stripe `PaymentIntent` (metadata: `orderId`)
  6. Return `client_secret` + `orderId`
- [ ] **T2.7** — Job BullMQ `expire-pending-orders` : cancel Order `PENDING` > 15 min + `releaseStock`
- [ ] **T2.8** — Module `payments` : endpoint webhook `/payments/webhook`
- [ ] **T2.9** — **Idempotence webhook Stripe** :
  - Raw body via `express.raw({ type: 'application/json' })` mounté **avant** le JSON parser global
  - `stripe.webhooks.constructEvent(rawBody, sig, secret)` — rejet si signature invalide
  - Check `WebhookEvent.eventId` UNIQUE → si existe, return 200 sans retraitement
  - Insert `WebhookEvent` (status `RECEIVED`) en transaction
  - Traitement + update status → `PROCESSED` ou `FAILED` avec `error`
- [ ] **T2.10** — Handlers webhook :
  - `payment_intent.succeeded` : Order → PAID, `decrementStock` définitif, enqueue email confirmation
  - `payment_intent.payment_failed` : Order → CANCELLED, `releaseStock`
  - `charge.refunded` : Order → REFUNDED, rétablir stock (`StockMovement` RETURN)

#### 🎨 Frontend — Checkout

- [ ] **T2.11** — Page `/checkout` Stripe Elements + gestion erreurs
- [ ] **T2.12** — Page `/confirmation/[orderId]` avec polling court ou SSE pour statut paiement

#### 📧 Backend — Emails transactionnels (base)

- [ ] **T2.13** — Module `notifications` + provider Resend + templates React Email
- [ ] **T2.14** — Queue BullMQ `email-queue` + worker (envoi non-bloquant)
- [ ] **T2.15** — Template `order_confirmation` envoyé depuis handler webhook `payment_intent.succeeded`
- [ ] **T2.16** — Table `EmailLog` : status tracking (QUEUED → SENT → DELIVERED/BOUNCED)

#### ✅ Definition of Done — Sprint 2

- Une commande complète est créée et payée via Stripe en test mode.
- Un webhook rejoué 3× consécutives ne crée qu'**une seule** commande PAID (idempotence prouvée).
- Une signature webhook invalide renvoie 400 et n'est pas traitée.
- Un paiement échoué libère le stock dans la minute.
- Un Order resté `PENDING` 16 min est auto-cancellé par le job.
- L'email de confirmation arrive dans Mailhog en dev avec les bons items et total.
- Test e2e Playwright : `add-to-cart → checkout → paid → order in /compte/commandes`.
- Aucun prix n'est recalculé côté client (test : manipulation localStorage panier → total serveur inchangé).

---

### Sprint 3 — Admin Panel

**Durée** : 1,5 semaine
**Dépendances** : S2 complet
**Objectif** : autonomie complète de l'équipe métier. Sans admin, pas de mise en production.

#### 🏗️ Architecture Admin

- [ ] **T3.1** — Route group Next.js `(admin)` avec layout dédié + middleware vérifiant `role === 'ADMIN'`
- [ ] **T3.2** — Composants UI admin : DataTable (TanStack Table), forms (react-hook-form + Zod), confirm dialogs, toasts
- [ ] **T3.3** — Layout admin : sidebar (dashboard, produits, commandes, clients, promos, reviews, audit log)

#### 📊 Dashboard

- [ ] **T3.4** — `GET /admin/metrics/overview?period=7d|30d|90d` : CA, nb commandes, panier moyen, taux conversion, top produits
- [ ] **T3.5** — `GET /admin/metrics/timeseries?metric=revenue&period=30d` : séries temporelles
- [ ] **T3.6** — Page `/admin` : cards KPI + graphiques Recharts + tableau top 10 produits + alertes stock faible

#### 📦 CRUD Produits + Upload

- [ ] **T3.7** — Module `uploads` : `POST /admin/uploads/sign` retournant signature Cloudinary (upload direct front non-bloquant)
- [ ] **T3.8** — `POST /admin/products`, `PATCH /admin/products/:id`, `DELETE /admin/products/:id` (soft delete via `isActive=false`)
- [ ] **T3.9** — `POST /admin/products/:id/images` : URL Cloudinary + position + `isMain`
- [ ] **T3.10** — `PATCH /admin/products/:id/images/reorder` (drag & drop)
- [ ] **T3.11** — `POST /admin/products/:id/stock` : ajustement avec `reason` + `note` → `StockMovement`
- [ ] **T3.12** — Pages admin : liste produits (filtres + search) + form create/edit + upload multi-images drag-drop + gestion variants + gestion stock

#### 🧾 Gestion commandes

- [ ] **T3.13** — `GET /admin/orders?status=&from=&to=`, `GET /admin/orders/:id`, `PATCH /admin/orders/:id/status`
- [ ] **T3.14** — State machine status : PAID → PROCESSING → SHIPPED (requis : trackingNumber) → DELIVERED. Transitions invalides rejetées.
- [ ] **T3.15** — `POST /admin/orders/:id/refund` (partial/total via Stripe Refund API)
- [ ] **T3.16** — Page admin commandes : tableau filtrable + détail + timeline statuts + actions refund

#### 👥 Gestion utilisateurs

- [ ] **T3.17** — `GET /admin/users` (pagination + search email), `GET /admin/users/:id` (profil + commandes + LTV), `PATCH /admin/users/:id` (role, block)
- [ ] **T3.18** — Page admin utilisateurs avec détail LTV

#### ⭐ Modération reviews

- [ ] **T3.19** — Module `reviews` : modèle + `POST /products/:id/reviews` (🔒 user ayant commande `DELIVERED` du produit)
- [ ] **T3.20** — `GET /admin/reviews?status=pending`, `PATCH /admin/reviews/:id/approve`, `DELETE /admin/reviews/:id`
- [ ] **T3.21** — Page admin modération

#### 🔒 Sécurité admin & audit

- [ ] **T3.22** — Intercepteur `AuditLogInterceptor` sur routes `/admin/*` : persist `AuditLog` (user, action, resource, before, after, ip, ua)
- [ ] **T3.23** — Page `/admin/audit-log` filtrable (user, resource, action, date)
- [ ] **T3.24** — **2FA TOTP obligatoire** pour role ADMIN (bibliothèque `otpauth`)

#### ✅ Definition of Done — Sprint 3

- Un admin peut créer/éditer/désactiver un produit avec upload multi-images drag-drop.
- Un admin peut ajuster le stock avec traçabilité complète dans `StockMovement`.
- Un admin peut changer le statut d'une commande ; transitions invalides rejetées avec message clair.
- Un admin peut rembourser une commande partiellement ou totalement (Stripe sync).
- Toute action admin mutante apparaît dans `/admin/audit-log`.
- Un admin ne peut se connecter sans code 2FA (TOTP).
- Le dashboard affiche CA 30j + top 10 produits + alertes stock faible en < 500 ms.

---

### Sprint 4 — SEO & UX Premium

**Durée** : 1 semaine
**Dépendances** : S3 complet
**Objectif** : site indexable Google + expérience de marque haut de gamme.

#### 🔍 SEO

- [ ] **T4.1** — `app/sitemap.ts` : génération dynamique `/sitemap.xml` (home + catégories + produits actifs)
- [ ] **T4.2** — `app/robots.ts` : `/robots.txt` (allow all, disallow `/admin/*`, `/compte/*`, `/api/*`)
- [ ] **T4.3** — `generateMetadata` dynamique fiche produit : title, description, OG image, Twitter Card
- [ ] **T4.4** — Schema.org JSON-LD sur fiches (`Product` + `Offer` + `AggregateRating`)
- [ ] **T4.5** — Canonical URLs + hreflang (préparation i18n)
- [ ] **T4.6** — Soumission sitemap Google Search Console (manuel, documenté)
- [ ] **T4.7** — Audit Lighthouse SEO → 100

#### 🎨 UX Premium

- [ ] **T4.8** — Design tokens Tailwind finaux : palette luxe (noir/ivoire/or), typographies (serif display + sans), spacings
- [ ] **T4.9** — Composants `packages/ui` finaux : Button, Input, Select, Badge, Card, Dialog, Toast, Skeleton
- [ ] **T4.10** — Framer Motion : transitions page + hover cards + drawer panier
- [ ] **T4.11** — Module `wishlist` (schéma déjà prévu) + UI cœur sur card produit + page `/compte/wishlist`
- [ ] **T4.12** — Galerie produit : carousel Embla + zoom au hover (`react-inner-image-zoom`)
- [ ] **T4.13** — Storytelling : section visuelle sur fiche produit (topNotes/heartNotes/baseNotes avec icônes)
- [ ] **T4.14** — Produits similaires (même catégorie, random 4) + best sellers (COUNT `OrderItem` joined)
- [ ] **T4.15** — Loading skeletons partout où `fetch` côté client
- [ ] **T4.16** — Audit responsive mobile (breakpoints sm/md/lg/xl)

#### ✅ Definition of Done — Sprint 4

- `/sitemap.xml` liste toutes les URLs indexables.
- `/robots.txt` exclut les zones privées.
- Une fiche produit partagée sur Twitter/LinkedIn affiche un preview correct (OG + image).
- Google Rich Results Test valide le JSON-LD Product.
- Lighthouse mobile sur fiche produit : SEO 100, Accessibilité ≥ 95.
- Wishlist persiste entre sessions (test : ajout → déconnexion → reconnexion → présent).
- Galerie produit : carousel + zoom fonctionnels sur mobile et desktop.

---

### Sprint 5 — Marketing

**Durée** : 1 semaine
**Dépendances** : S3 complet (admin pour créer codes + gérer emails)
**Objectif** : leviers business essentiels activés (promo, relance panier, emails complets).

#### 🎟️ Codes promo

- [ ] **T5.1** — Module `promo-codes` + schéma `PromoCode`, `PromoCodeUsage`, enum `DiscountType` (PERCENTAGE / FIXED_AMOUNT / FREE_SHIPPING)
- [ ] **T5.2** — `POST /cart/apply-promo` : valide code (actif, dates, min order, max uses global + per user, scope produits/catégories) + retourne discount calculé
- [ ] **T5.3** — Intégration `POST /orders` : accepter `promoCode` → recalcul total **server-side** + create `PromoCodeUsage` en transaction + increment atomique `usedCount` avec `where: { usedCount: { lt: maxUses } }`
- [ ] **T5.4** — Endpoints admin : CRUD `/admin/promo-codes` + stats d'usage
- [ ] **T5.5** — Page admin : création code (form type %/montant/free shipping, dates, limites, scope)
- [ ] **T5.6** — Front checkout : input "Code promo" + affichage ligne discount

#### 🔔 Abandoned cart

- [ ] **T5.7** — Update `Cart.lastActivityAt` à chaque modification panier
- [ ] **T5.8** — Cron BullMQ `check-abandoned-carts` (toutes les 15 min) :
  - Cart non converti, `lastActivityAt` entre 1h et 2h, `reminderStage=0`, `email` présent → envoi email + `stage=1`
  - Entre 24h et 25h, `stage=1` → email `stage=2` (+ WhatsApp si phone)
  - Entre 72h et 73h, `stage=2` → email `stage=3` **avec code promo auto-généré 10%**
- [ ] **T5.9** — Templates email : `abandoned_cart_1h`, `abandoned_cart_24h`, `abandoned_cart_72h`
- [ ] **T5.10** — Token signé dans lien email pour reprendre le panier au checkout pré-rempli
- [ ] **T5.11** — Opt-out `/unsubscribe/:token` + champ `User.marketingOptIn`

#### 📧 Emails transactionnels complets

- [ ] **T5.12** — Template `order_confirmation` enrichi (récap produits, adresse, total, discount si applicable)
- [ ] **T5.13** — Template `order_shipped` déclenché sur status SHIPPED (transporteur + tracking number + URL)
- [ ] **T5.14** — Template `order_delivered` (manuel ou webhook transporteur)
- [ ] **T5.15** — Template `order_cancelled` + `order_refunded`
- [ ] **T5.16** — Template `welcome` (inscription) avec code bienvenue 10% optionnel
- [ ] **T5.17** — Template `review_request` déclenché J+7 après DELIVERED (cron BullMQ)
- [ ] **T5.18** — Hook `OrdersService.updateStatus` → enqueue email correspondant (pattern observer/event)
- [ ] **T5.19** — Dashboard admin email : `/admin/email-logs` filtrable (status, template, user) + compteurs bounce/delivery

#### ✅ Definition of Done — Sprint 5

- Un code promo `-20%` appliqué au panier recalcule le total en < 300 ms.
- Une tentative d'utiliser un code expiré ou au scope non applicable renvoie 400 avec message clair.
- Le quota `maxUses` d'un code ne peut être dépassé (test concurrentiel).
- Un panier abandonné reçoit les 3 emails de relance aux bons intervalles en environnement de test.
- Un clic sur "Reprendre mon panier" depuis l'email repeuple le checkout avec les items.
- Un user opté-out ne reçoit aucune relance marketing (test : flag → 0 email).
- Tous les statuts de commande déclenchent un email tracé dans `EmailLog`.

---

### Sprint 6 — Différenciation

**Durée** : 2 semaines
**Dépendances** : S3 (admin) + S5 (infra emails)
**Objectif** : effet wow produit (recherche premium, quiz, reviews, tracking).

#### 🔎 Algolia

- [ ] **T6.1** — Module `search` : client Algolia + index `products`
- [ ] **T6.2** — Prisma middleware sur `Product` : create/update/delete → enqueue job `sync-algolia`
- [ ] **T6.3** — Worker `sync-algolia` : `saveObject` / `deleteObject` (idempotent)
- [ ] **T6.4** — Script CLI `pnpm algolia:reindex` (full resync)
- [ ] **T6.5** — Front `/recherche` : `react-instantsearch` + SearchBox, RefinementList (catégorie, genre, famille), RangeInput (prix), Hits
- [ ] **T6.6** — Autocomplete dans header (`@algolia/autocomplete-js`)
- [ ] **T6.7** — Synonymes Algolia (admin console) : ex "parfum" ↔ "fragrance"

#### 🧪 Quiz parfum

- [ ] **T6.8** — Module `quiz` : `POST /quiz/submit` → scoring règles (famille olfactive, intensité, saison, genre) → return top 3 produits
- [ ] **T6.9** — Table `QuizResult` (persist pour analytics + perso future)
- [ ] **T6.10** — Front : parcours quiz multi-étapes (Framer Motion) avec illustrations
- [ ] **T6.11** — Page résultats + CTA ajout panier

#### ⭐ Reviews (complément front)

- [ ] **T6.12** — Fiche produit : affichage étoiles + liste reviews paginée + distribution ratings
- [ ] **T6.13** — Submit review depuis `/compte/commandes/:id` (badge "Laisser un avis" si DELIVERED)

#### 📦 Suivi commande

- [ ] **T6.14** — Page `/compte/commandes/:id` : timeline (PAID → PROCESSING → SHIPPED → DELIVERED) + tracking number + lien transporteur
- [ ] **T6.15** — Stub endpoint webhook transporteur `/shipping/webhook` (prévu pour Chronopost/DHL futur)
- [ ] **T6.16** — Notifications WhatsApp (Twilio) sur changement statut : template pré-approuvé `order_status_update`

#### ✅ Definition of Done — Sprint 6

- Une recherche Algolia sur "oriental" retourne des résultats avec facettes fonctionnelles en < 300 ms.
- Une mise à jour produit en admin est reflétée dans Algolia sous 30 s.
- Le quiz produit 3 recommandations cohérentes avec les réponses (test : profil "boisé intense" → produits boisés).
- Un client ne peut laisser un avis que pour un produit commandé et livré.
- La timeline de commande affiche les transitions avec dates précises.
- Un changement de statut déclenche un message WhatsApp avec template conforme Twilio.

---

### Sprint 7 — Performance & Scale

**Durée** : 1 semaine
**Dépendances** : S4, S5, S6 (features stables à cacher)
**Objectif** : site rapide sous charge, monitoring complet, backups.

#### ⚡ Cache Redis

- [ ] **T7.1** — `CacheService` (ioredis + cache-manager-redis-yet)
- [ ] **T7.2** — Cache fiche produit `product:{slug}` TTL 10 min + invalidation sur update (via event)
- [ ] **T7.3** — Cache best sellers / catégories tree TTL 1 h
- [ ] **T7.4** — `CacheInterceptor` NestJS sur GET publics sélectionnés

#### 🖼️ Images

- [ ] **T7.5** — Cloudinary : migration images existantes (script)
- [ ] **T7.6** — Custom loader `next/image` → Cloudinary (`w_auto,f_auto,q_auto`)

#### 🗄️ DB

- [ ] **T7.7** — Audit Prisma : ajout index manquants vérifiés par `EXPLAIN ANALYZE`
- [ ] **T7.8** — Full-text search PostgreSQL : colonne `search_vector` + index GIN + trigger
- [ ] **T7.9** — Pagination cursor-based sur `/products` (vérifier si pas déjà)
- [ ] **T7.10** — PgBouncer en prod (ou équivalent managé)
- [ ] Backups automatiques quotidiens + test restauration mensuel documenté

#### 🌐 Infra

- [ ] **T7.11** — Compression gzip/brotli (reverse proxy)
- [ ] **T7.12** — Audit Lighthouse : Perf 90+, SEO 100, Access 95+, BP 100 (mobile)
- [ ] **T7.13** — Monitoring : Sentry Performance + Prometheus/Grafana (ou Axiom pour logs agrégés)
- [ ] **T7.14** — Alerting : stock faible produits top 20, erreurs 5xx > 1%, webhook Stripe fail, email bounce > 2%

#### ✅ Definition of Done — Sprint 7

- Cache hit ratio sur fiches produits > 80% en condition normale.
- Invalidation cache effective en < 5 s après update produit (test : update admin → GET fiche → nouvelle valeur).
- Aucune requête DB > 200 ms sur endpoints publics (p95).
- Lighthouse mobile fiche produit : Perf ≥ 90.
- Restauration d'un backup < 10 min documenté.
- Alerte déclenchée si stock < `lowStockThreshold` sur un produit top 20.
- Alerte déclenchée si webhook Stripe échoue 3 fois consécutives.

---

### Sprint 8 — Premium & i18n

**Durée** : 2 semaines
**Dépendances** : S7
**Objectif** : différenciation luxe + ouverture internationale.

#### 🤖 Recommandations avancées

- [ ] **T8.1** — "Clients ayant acheté X ont aussi acheté Y" (SQL sur `OrderItem` join self)
- [ ] **T8.2** — `GET /products/:id/recommendations`

#### 🎁 Expérience luxe

- [ ] **T8.3** — Coffrets cadeaux : type `Product.type = 'GIFT_SET'` avec produits enfants
- [ ] **T8.4** — Message cadeau au checkout (champ `Order.giftMessage`)

#### 💬 Support client

- [ ] **T8.5** — Support WhatsApp : bouton sticky front + numéro Business + webhook inbound Twilio

#### 🌍 Internationalisation

- [ ] **T8.6** — i18n `next-intl` (FR/EN) + routing `/en/...`
- [ ] **T8.7** — Multi-devise : table `ExchangeRate` + cron update (API exchangeratesapi) + conversion à l'affichage (commandes restent dans devise de paiement)
- [ ] **T8.8** — Paiement local (Wave/Orange Money) via adapter pattern `PaymentProvider`
- [ ] **T8.9** — hreflang dans metadata SEO

#### 🔏 RGPD

- [ ] Endpoints `/users/me/export` (JSON/CSV) + `/users/me/delete` (soft delete → anonymisation)

#### ✅ Definition of Done — Sprint 8

- `/products/:id/recommendations` retourne 4 produits cohérents basés sur historique d'achat.
- Un coffret cadeau peut être acheté avec message personnalisé affiché dans email de confirmation.
- Une version EN du site est accessible avec traductions complètes des pages clés.
- Le choix de devise (EUR/USD/XOF) affiche les bons montants convertis avec taux < 24 h.
- Un paiement Wave/Orange Money aboutit à une Order PAID via webhook provider.
- Un user peut demander l'export de ses données et recevoir un fichier JSON.
- Un user peut demander la suppression → données anonymisées en < 30 j.

---

## 🔗 Dépendances inter-sprints

```
S0 (infra, Sentry, Pino, Docker, CI/CD)
 └── S1 (auth, users, catalogue, stock)
      └── S2 (panier, orders, Stripe idempotent, emails base)
           └── S3 (admin panel complet)
                ├── S4 (SEO, UX premium)          ┐
                ├── S5 (marketing, promo, relance) ├── S6 (Algolia, quiz, reviews, tracking)
                │                                  ┘         └── S7 (perf, cache, backups)
                │                                                    └── S8 (premium, i18n)
                └── (S4 et S5 parallélisables après S3)
```

**Règle d'ordonnancement** : un sprint ne démarre pas tant que sa DoD du sprint parent n'est pas validée.

---

## 🗓️ Roadmap par version

| Version | Semaines | Contenu | Démarquable |
|---|---|---|---|
| **V0 — Bootstrap** | S1 | S0 | Infra prête, dev local opérationnel |
| **V1 — MVP vendable** | S2–S4 | S1 + S2 | 🎯 **Première vente réelle possible** |
| **V1.5 — Opérable** | S5–S6,5 | S3 (admin) | Équipe métier 100% autonome |
| **V2 — Conversif** | S7 | S4 (SEO + UX) | Indexation Google + image de marque |
| **V3 — Business** | S8 | S5 (marketing) | Codes promo + relance panier (+30-40% conversion estimée) |
| **V4 — Wow** | S9–S10 | S6 (Algolia + quiz + reviews) | Différenciation produit |
| **V5 — Scale** | S11 | S7 (perf + cache + backups) | Tient la charge à 1000+ req/s |
| **V6 — Luxe intl** | S12–S13 | S8 | Coffrets + i18n + multi-devise + RGPD |

**Total** : ~13 semaines pour un produit réellement complet. **MVP vendable en 4 semaines**.

---

## 📌 Notes de maintenance du backlog

- Toute modification de périmètre passe par une PR sur ce fichier avec review d'un lead.
- Les tâches cochées `[x]` restent dans le fichier pour traçabilité historique.
- Les changements de priorité doivent être justifiés dans le message de commit.
- Les nouvelles tâches identifiées en cours de sprint vont en backlog du sprint suivant, pas en cours.
- Définir "terminé" = DoD validée + PR mergée + déployée en staging.
