# GitHub Issues — Maison Parfum

> Backlog exécutable prêt à importer (Sprint 0 exclu — terminé).
> Labels utilisés : `backend`, `frontend`, `infra`, `security`, `performance`, `marketing`, `mvp-critical`, `database`, `admin`, `seo`, `ux`.

---

## Milestone: Sprint 1 — Auth, Users, Catalogue, Stock

---

### #1 — [S1][DB] Schéma Prisma Auth (User, Address, RefreshToken)

**Labels**: `backend`, `database`, `mvp-critical`
**Milestone**: Sprint 1
**Dependencies**: — (Sprint 0 terminé)

**Description**
Créer les modèles Prisma fondateurs pour l'authentification.

**Acceptance Criteria**
- [ ] Modèle `User` (id cuid, email unique, passwordHash, firstName, lastName, phone, role, emailVerified, timestamps)
- [ ] Modèle `Address` (userId FK cascade, line1/line2/city/postalCode/country, isDefault)
- [ ] Modèle `RefreshToken` (userId FK cascade, tokenHash unique, expiresAt, revokedAt)
- [ ] Enum `Role { CUSTOMER, ADMIN }`
- [ ] Index composites nécessaires (`RefreshToken.userId`)
- [ ] Migration appliquée localement : `pnpm --filter @ecommerce/api prisma:migrate -- --name auth_init`
- [ ] Seed script créé avec 1 admin + 1 customer de test

---

### #2 — [S1][Backend] Module users

**Labels**: `backend`, `mvp-critical`
**Milestone**: Sprint 1
**Depends on**: #1

**Description**
Service/repository `users` pour opérations de base (findByEmail, create, updateProfile).

**Acceptance Criteria**
- [ ] `UsersModule` + `UsersService` + `UsersController`
- [ ] `findByEmail(email)` retourne `User | null`
- [ ] `create(dto)` hash password (bcrypt rounds 12)
- [ ] `PATCH /users/me` (authed) : update firstName, lastName, phone
- [ ] Test unitaire `UsersService` (min 80% coverage)

---

### #3 — [S1][Backend][Security] Module auth + JWT strategy

**Labels**: `backend`, `security`, `mvp-critical`
**Milestone**: Sprint 1
**Depends on**: #2

**Description**
Endpoints d'authentification complets avec rotation refresh token.

**Acceptance Criteria**
- [ ] `POST /auth/register` (DTO validé, check email unique)
- [ ] `POST /auth/login` (retourne access + refresh, refresh en cookie httpOnly SameSite=Lax Secure)
- [ ] `POST /auth/refresh` (rotation : révoque ancien, émet nouveau, hash en DB)
- [ ] `POST /auth/logout` (révoque refresh token)
- [ ] `GET /auth/me` (🔒 retourne user courant)
- [ ] `JwtStrategy` passport-jwt
- [ ] `JwtAuthGuard` comme guard global + `@Public()` decorator
- [ ] `RolesGuard` + `@Roles('ADMIN')` decorator
- [ ] `@CurrentUser()` decorator retourne user typé
- [ ] Access token 15 min, refresh 7 j
- [ ] Tests e2e : register → login → refresh → me → logout

---

### #4 — [S1][Security] Email verification + password reset

**Labels**: `backend`, `security`
**Milestone**: Sprint 1
**Depends on**: #3, #18 (infra email)

**Description**
Flows email verification et password reset.

**Acceptance Criteria**
- [ ] `POST /auth/verify-email` (token signé JWT ou random + DB)
- [ ] Email envoyé à l'inscription avec lien `/verify-email?token=...`
- [ ] `User.emailVerified=true` après clic
- [ ] `POST /auth/forgot-password` (rate-limited 3/h/email)
- [ ] Email envoyé avec lien `/reset-password?token=...` (TTL 1 h)
- [ ] `POST /auth/reset-password` (token + new password)
- [ ] Tous les refresh tokens révoqués après reset password

---

### #5 — [S1][Security] Rate limiting global (Throttler + Redis)

**Labels**: `backend`, `security`, `mvp-critical`
**Milestone**: Sprint 1
**Depends on**: — (Redis déjà en place S0)

**Description**
Protection brute-force / énumération comptes via `@nestjs/throttler` + storage Redis.

**Acceptance Criteria**
- [ ] `ThrottlerModule` configuré avec `ThrottlerStorageRedisService`
- [ ] Global : 60 req/min/IP
- [ ] `/auth/login` : 5 req/min/IP
- [ ] `/auth/register` : 3 req/min/IP
- [ ] `/auth/forgot-password` : 3 req/h/email
- [ ] Header `Retry-After` sur 429
- [ ] Test : 6e login en 1 min → 429

---

### #6 — [S1][Security] Helmet + CORS + Sanitization

**Labels**: `backend`, `security`
**Milestone**: Sprint 1
**Depends on**: —

**Description**
Durcissement headers et sanitization free-text.

**Acceptance Criteria**
- [ ] `helmet()` configuré en main.ts (CSP minimal adapté)
- [ ] CORS whitelist depuis `CORS_ORIGIN` env (pas de `*`)
- [ ] `credentials: true` pour cookies
- [ ] Helper `sanitizeHtml` (DOMPurify + jsdom) pour champs user-generated (reviews)
- [ ] Test : payload `<script>alert()</script>` → stocké sanitized

---

### #7 — [S1][DB] Schéma catalogue (Category, Product, Variant, Image)

**Labels**: `backend`, `database`, `mvp-critical`
**Milestone**: Sprint 1

**Description**
Modèles catalogue complets avec relations.

**Acceptance Criteria**
- [ ] `Category` (slug unique, parent self-ref, name, description, imageUrl)
- [ ] `Product` (slug unique, brand, name, description, storyTelling, topNotes/heartNotes/baseNotes String[], gender, categoryId FK, priceCents Int, currency, stock Int, lowStockThreshold, stockStatus, sku unique, isActive, isFeatured)
- [ ] `ProductVariant` (productId FK cascade, sizeMl, priceCents, stock, sku unique, `@@unique([productId, sizeMl])`)
- [ ] `ProductImage` (productId FK cascade, url, alt, position)
- [ ] `StockMovement` (productId, variantId, delta, reason enum, orderId, note, createdBy, createdAt)
- [ ] Enums `Gender`, `StockStatus`, `StockReason`
- [ ] Index : `Product.categoryId`, `Product.(isFeatured, isActive)`, `Product.brand`, `StockMovement.(productId, createdAt desc)`
- [ ] Migration appliquée

---

### #8 — [S1][Backend] Module categories

**Labels**: `backend`, `mvp-critical`
**Milestone**: Sprint 1
**Depends on**: #7

**Description**
Endpoints catégories (public + admin).

**Acceptance Criteria**
- [ ] `GET /categories` : arbre complet (public, cacheable)
- [ ] `GET /categories/:slug` : détail + produits paginés
- [ ] `POST/PATCH/DELETE /admin/categories/*` (🔒 ADMIN)
- [ ] DTO validés strictement
- [ ] Tests e2e sur GET public

---

### #9 — [S1][Backend] Module products (endpoints publics)

**Labels**: `backend`, `mvp-critical`
**Milestone**: Sprint 1
**Depends on**: #7

**Description**
Lecture publique du catalogue avec pagination cursor + filtres.

**Acceptance Criteria**
- [ ] `GET /products?cursor=&limit=&category=&gender=&minPrice=&maxPrice=&sort=` (pagination cursor-based)
- [ ] `GET /products/:slug` (fiche complète avec images, variants, category, notes)
- [ ] `GET /products/featured` (isFeatured + isActive, top 8)
- [ ] `GET /products/:id/related` (même category, random 4 excluant self)
- [ ] Prisma `select` ciblé (pas d'include global)
- [ ] Tests e2e : liste + filtres

---

### #10 — [S1][Backend] Module stock avec transactions atomiques

**Labels**: `backend`, `mvp-critical`, `database`
**Milestone**: Sprint 1
**Depends on**: #7

**Description**
Service stock transactionnel empêchant toute survente.

**Acceptance Criteria**
- [ ] `StockService.reserveStock(productId, quantity)` : transaction avec `update where: { stock: { gte: quantity } }` → throw `OutOfStockException` si 0 lignes affectées
- [ ] `StockService.releaseStock(productId, quantity)` : rollback réservation
- [ ] `StockService.decrementStock(productId, quantity, orderId)` : décrément définitif (post-paiement)
- [ ] Chaque opération log un `StockMovement` avec reason
- [ ] Hook Prisma post-update : recalcule `stockStatus` (IN_STOCK / LOW_STOCK / OUT_OF_STOCK)
- [ ] Test concurrentiel : 100 requêtes parallèles sur produit avec stock=10 → exactement 10 réservations, 90 rejets
- [ ] Test : decrement > stock → throw + aucune modif DB

---

### #11 — [S1][Backend] Seed script de démo

**Labels**: `backend`, `database`
**Milestone**: Sprint 1
**Depends on**: #1, #7

**Description**
Données de démo pour développement.

**Acceptance Criteria**
- [ ] Script `prisma/seed.ts` exécutable via `pnpm --filter @ecommerce/api prisma db seed`
- [ ] 1 admin + 2 customers
- [ ] 3 catégories (Femme, Homme, Unisexe)
- [ ] 20 produits avec images placeholder (Unsplash URLs) + notes olfactives variées
- [ ] Stocks variés (certains low, 1 out of stock)
- [ ] Idempotent (run 2x = OK)

---

### #12 — [S1][Frontend] Layout global + Header + Footer

**Labels**: `frontend`, `mvp-critical`, `ux`
**Milestone**: Sprint 1

**Description**
Squelette navigationnel cohérent sur toutes les pages.

**Acceptance Criteria**
- [ ] `src/app/layout.tsx` enveloppe Header + children + Footer
- [ ] Header : logo, nav catégories, search icon, cart icon (badge count), compte icon
- [ ] Footer : liens légaux (CGV, mentions, confidentialité stub), réseaux, newsletter stub
- [ ] Responsive mobile (menu burger)
- [ ] Tokens Tailwind brand (ivory/gold/ink) appliqués

---

### #13 — [S1][Frontend] Pages auth (/connexion, /inscription, /compte)

**Labels**: `frontend`, `mvp-critical`
**Milestone**: Sprint 1
**Depends on**: #3

**Description**
Parcours auth complet côté client + middleware protection routes.

**Acceptance Criteria**
- [ ] Page `/connexion` (form email + password, redirect post-login)
- [ ] Page `/inscription` (form + validation Zod)
- [ ] Page `/compte` dashboard (nom, email, liens vers commandes/wishlist/adresses)
- [ ] `middleware.ts` protège `/compte/*` (redirect `/connexion` si pas authed)
- [ ] Store Zustand `authStore` (user, setUser, logout)
- [ ] Gestion erreurs API avec toasts

---

### #14 — [S1][Frontend] Client API typé avec refresh auto

**Labels**: `frontend`, `mvp-critical`
**Milestone**: Sprint 1
**Depends on**: #3

**Description**
Wrapper `fetch` ajoutant JWT + gérant refresh sur 401.

**Acceptance Criteria**
- [ ] `lib/api-client.ts` avec méthodes get/post/patch/delete typées
- [ ] Injecte `Authorization: Bearer ...` depuis store
- [ ] Sur 401 : tente `POST /auth/refresh`, retry original 1x, sinon logout + redirect
- [ ] Évite race conditions (1 seul refresh concurrent via promise partagée)
- [ ] Tests unitaires avec MSW ou mock fetch

---

### #15 — [S1][Frontend] Page /produits (liste SSR + filtres)

**Labels**: `frontend`, `mvp-critical`, `seo`
**Milestone**: Sprint 1
**Depends on**: #9

**Description**
Liste produits indexable avec filtres client-side sur query params.

**Acceptance Criteria**
- [ ] Server Component qui fetch `/products` avec searchParams
- [ ] `generateMetadata` dynamique (titre selon filtres)
- [ ] Grille responsive (2 cols mobile, 4 desktop)
- [ ] Filtres : catégorie, genre, range prix, sort (url-synced)
- [ ] Card produit : image, nom, brand, prix, badge stock
- [ ] Pagination "Voir plus" (cursor) ou pages numérotées

---

### #16 — [S1][Frontend] Page fiche produit (SSG + ISR)

**Labels**: `frontend`, `mvp-critical`, `seo`
**Milestone**: Sprint 1
**Depends on**: #9

**Description**
Page SSG avec revalidate pour SEO maximal.

**Acceptance Criteria**
- [ ] Route `/produits/[slug]/page.tsx` avec `generateStaticParams`
- [ ] `export const revalidate = 60`
- [ ] `generateMetadata` : title, description, OG image
- [ ] Affichage : galerie images, nom, brand, prix, description, notes olfactives (header/coeur/fond), variants (sizes), bouton "Ajouter au panier"
- [ ] Badge stock dynamique (IN_STOCK / LOW_STOCK "Plus que X" / OUT_OF_STOCK grisé)
- [ ] Gestion fallback pour produit désactivé → 404

---

## Milestone: Sprint 2 — Panier, Checkout, Stripe

---

### #17 — [S2][Frontend] Store panier Zustand + drawer

**Labels**: `frontend`, `mvp-critical`
**Milestone**: Sprint 2

**Description**
Gestion client du panier avec persistance localStorage.

**Acceptance Criteria**
- [ ] `cartStore` (items, addItem, removeItem, updateQty, clear, subtotal computed)
- [ ] Persist localStorage via `zustand/middleware/persist`
- [ ] Drawer latéral ouvert depuis clic icône panier
- [ ] Merge au login (merge panier anonyme avec panier user serveur)
- [ ] Badge count dans Header réactif

---

### #18 — [S2][Backend] Module cart (persistance serveur)

**Labels**: `backend`, `mvp-critical`, `marketing`
**Milestone**: Sprint 2
**Depends on**: #1

**Description**
Persistance panier serveur (base pour abandoned cart S5).

**Acceptance Criteria**
- [ ] Modèle `Cart` (userId unique OR sessionId unique, email, items JSON, subtotalCents, isAbandoned, reminderStage, lastActivityAt)
- [ ] `POST /cart/sync` : upsert panier depuis client (merge par productId/variantId)
- [ ] `POST /cart/validate` : check stock + recalcul prix serveur, retourne diff
- [ ] `lastActivityAt` updated à chaque mutation

---

### #19 — [S2][DB] Schéma Orders + Payments + WebhookEvent

**Labels**: `backend`, `database`, `mvp-critical`
**Milestone**: Sprint 2

**Description**
Modèles commande avec idempotence webhook Stripe.

**Acceptance Criteria**
- [ ] `Order` (orderNumber unique, userId, status enum, subtotalCents, shippingCents, taxCents, discountCents, totalCents, currency, addresses JSON snapshots, trackingNumber, promoCodeId nullable)
- [ ] `OrderItem` (orderId cascade, productId, variantId, productName snapshot, sizeMl, unitPriceCents, quantity, totalCents)
- [ ] `Payment` (orderId unique, provider, providerPaymentId indexed, status, amountCents, currency, rawPayload)
- [ ] **`WebhookEvent` (eventId UNIQUE, provider, eventType, payload JSON, processedAt, status, error)**
- [ ] Enums : `OrderStatus`, `PaymentProvider`, `PaymentStatus`, `WebhookEventStatus`
- [ ] Index : `Order.(userId, createdAt desc)`, `Order.status`, `Payment.providerPaymentId`

---

### #20 — [S2][Backend] Endpoint POST /orders (création transactionnelle)

**Labels**: `backend`, `mvp-critical`
**Milestone**: Sprint 2
**Depends on**: #10, #19

**Description**
Flow de création de commande avec réservation stock et PaymentIntent Stripe.

**Acceptance Criteria**
- [ ] DTO : items, shippingAddress, billingAddress, promoCode?
- [ ] Transaction Prisma :
  1. Validation DTO
  2. Pour chaque item : `reserveStock` (throw si rupture)
  3. Recalcul **total 100% server-side** (subtotal, shipping, tax, discount si promo)
  4. Create Order `PENDING` + OrderItems (snapshots) + Payment `PENDING`
- [ ] Post-transaction : `stripe.paymentIntents.create` avec metadata `orderId`
- [ ] Retour : `{ orderId, clientSecret }`
- [ ] Test : panier avec prix manipulé → backend renvoie total correct
- [ ] Test : rupture stock → 409 + aucune Order créée

---

### #21 — [S2][Backend][Security] Webhook Stripe idempotent

**Labels**: `backend`, `security`, `mvp-critical`
**Milestone**: Sprint 2
**Depends on**: #19, #20

**Description**
Endpoint webhook critique avec signature + idempotence.

**Acceptance Criteria**
- [ ] Raw body middleware mount **avant** JSON parser : `app.use('/payments/webhook', express.raw({ type: 'application/json' }))`
- [ ] `stripe.webhooks.constructEvent(rawBody, signature, secret)` → 400 si invalide
- [ ] Check `WebhookEvent.eventId` UNIQUE → si existe, return 200 sans retraitement
- [ ] Insert `WebhookEvent` status `RECEIVED` en début de traitement
- [ ] Handlers :
  - `payment_intent.succeeded` → Order PAID + `decrementStock` définitif + enqueue email `order_confirmation`
  - `payment_intent.payment_failed` → Order CANCELLED + `releaseStock`
  - `charge.refunded` → Order REFUNDED + restock (`StockMovement` RETURN)
- [ ] Update `WebhookEvent.status=PROCESSED` + `processedAt`
- [ ] En cas d'erreur : status FAILED + error + **ne pas** retourner 500 (Stripe retry désiré)
- [ ] Test : rejouer le même event 3× → 1 seule Order PAID
- [ ] Test : signature falsifiée → 400
- [ ] Test local avec `stripe listen --forward-to localhost:3001/payments/webhook`

---

### #22 — [S2][Backend] Job expire-pending-orders

**Labels**: `backend`, `mvp-critical`
**Milestone**: Sprint 2
**Depends on**: #20

**Description**
Cron BullMQ libérant le stock des commandes abandonnées.

**Acceptance Criteria**
- [ ] Job BullMQ `expire-pending-orders` schedule every 5 min
- [ ] Trouve Orders `PENDING` avec `createdAt < now - 15 min`
- [ ] Transaction : Order → CANCELLED + `releaseStock` sur chaque item + Payment → FAILED
- [ ] Idempotent (re-run ne double pas)
- [ ] Logs structurés pour chaque cancel

---

### #23 — [S2][Frontend] Pages panier + checkout + confirmation

**Labels**: `frontend`, `mvp-critical`
**Milestone**: Sprint 2
**Depends on**: #17, #20, #21

**Description**
Parcours d'achat côté client avec Stripe Elements.

**Acceptance Criteria**
- [ ] Page `/panier` : liste items, update qty, remove, subtotal, CTA "Passer commande"
- [ ] Page `/checkout` : form adresse + Stripe Elements (PaymentElement)
- [ ] Submit → `POST /orders` → `stripe.confirmPayment({ clientSecret, elements })`
- [ ] Redirect `/confirmation/[orderId]` après succès
- [ ] Page confirmation : polling `GET /orders/:id` jusqu'à status PAID (timeout 30 s)
- [ ] Gestion erreurs (card declined, network) avec messages clairs

---

### #24 — [S2][Infra] Notifications module + BullMQ email queue

**Labels**: `backend`, `infra`, `mvp-critical`
**Milestone**: Sprint 2

**Description**
Infrastructure email (Resend + React Email + BullMQ).

**Acceptance Criteria**
- [ ] Module `notifications` avec service `EmailService.send(template, to, data)`
- [ ] Provider Resend (fallback Mailhog en dev via SMTP)
- [ ] Templates React Email compilés
- [ ] Queue BullMQ `email-queue` + worker
- [ ] Table `EmailLog` (userId, to, template, subject, status, providerMessageId, sentAt)
- [ ] Template `order_confirmation` V1 (items, total, adresse)
- [ ] Retry policy (3 tentatives exponential backoff)
- [ ] Webhook Resend `/webhooks/resend` → update `EmailLog` status (delivered/bounced)

---

## Milestone: Sprint 3 — Admin Panel

---

### #25 — [S3][Frontend][Admin] Layout admin + guard role

**Labels**: `frontend`, `admin`, `security`
**Milestone**: Sprint 3
**Depends on**: #3

**Description**
Structure admin avec protection role.

**Acceptance Criteria**
- [ ] Route group Next.js `(admin)` avec layout dédié
- [ ] Middleware vérifie `role === 'ADMIN'`, sinon 403
- [ ] Sidebar : Dashboard, Produits, Commandes, Clients, Promos, Reviews, Emails, Audit log
- [ ] Theme admin (dense, moins décoratif que front public)

---

### #26 — [S3][Frontend][Admin] Composants UI admin (DataTable, forms, confirms)

**Labels**: `frontend`, `admin`, `ux`
**Milestone**: Sprint 3

**Description**
Primitives réutilisables pour toutes les pages admin.

**Acceptance Criteria**
- [ ] `DataTable` (TanStack Table) : pagination, sort, filters, row actions
- [ ] `FormField`, `TextInput`, `NumberInput`, `Select`, `Textarea` (react-hook-form + Zod)
- [ ] `ConfirmDialog` (Radix Dialog)
- [ ] `Toast` (sonner ou radix)
- [ ] Documentation Storybook minimale (optionnel)

---

### #27 — [S3][Backend][Admin] Endpoints metrics

**Labels**: `backend`, `admin`
**Milestone**: Sprint 3
**Depends on**: #19

**Description**
KPIs dashboard.

**Acceptance Criteria**
- [ ] `GET /admin/metrics/overview?period=7d|30d|90d` : revenue, orderCount, avgCartCents, conversionRate, topProducts[5]
- [ ] `GET /admin/metrics/timeseries?metric=revenue&period=30d` : data points daily
- [ ] `GET /admin/metrics/low-stock` : produits `stock <= lowStockThreshold`
- [ ] Queries optimisées (raw SQL si nécessaire)
- [ ] Protégé `@Roles('ADMIN')`

---

### #28 — [S3][Frontend][Admin] Page dashboard

**Labels**: `frontend`, `admin`
**Milestone**: Sprint 3
**Depends on**: #27

**Description**
Vue d'ensemble business.

**Acceptance Criteria**
- [ ] Cards KPI : CA 30j, nb commandes, panier moyen, taux conversion
- [ ] Graphique ligne CA 30j (Recharts)
- [ ] Tableau top 10 produits
- [ ] Alerte banner si produits en stock faible
- [ ] Sélecteur période (7/30/90j)

---

### #29 — [S3][Backend][Admin] Uploads Cloudinary signés

**Labels**: `backend`, `admin`, `security`
**Milestone**: Sprint 3

**Description**
Signature upload direct depuis le front (pas de proxy).

**Acceptance Criteria**
- [ ] `POST /admin/uploads/sign` : retourne `{ signature, timestamp, apiKey, cloudName, folder }`
- [ ] Signature calculée avec `CLOUDINARY_API_SECRET` (env)
- [ ] Validation : folder whitelist (`products`, `categories`), max 10 MB, types image uniquement
- [ ] Protégé ADMIN

---

### #30 — [S3][Backend][Admin] CRUD produits + images + stock

**Labels**: `backend`, `admin`, `mvp-critical`
**Milestone**: Sprint 3
**Depends on**: #7, #10, #29

**Description**
Administration complète du catalogue.

**Acceptance Criteria**
- [ ] `POST /admin/products` : création avec validation stricte
- [ ] `PATCH /admin/products/:id`
- [ ] `DELETE /admin/products/:id` (soft delete `isActive=false`)
- [ ] `POST /admin/products/:id/images` (url, alt, position, isMain)
- [ ] `PATCH /admin/products/:id/images/reorder` (array ids → positions)
- [ ] `DELETE /admin/products/:id/images/:imageId`
- [ ] `POST /admin/products/:id/stock` (delta, reason, note) → crée `StockMovement`
- [ ] Events émis pour invalidation cache + sync Algolia (stub pour S6)

---

### #31 — [S3][Frontend][Admin] Pages produits

**Labels**: `frontend`, `admin`
**Milestone**: Sprint 3
**Depends on**: #30

**Description**
Interface admin produits.

**Acceptance Criteria**
- [ ] Liste `/admin/products` : DataTable + filtres search/category/status
- [ ] Form création/édition (tous champs + notes multi-value)
- [ ] Upload multi-images drag-drop avec preview + réordonnancement
- [ ] Gestion variants (tailles + stocks + prix par taille)
- [ ] Panneau "Ajuster stock" avec raison + note (historique `StockMovement`)
- [ ] Bouton Désactiver avec confirm

---

### #32 — [S3][Backend][Admin] Gestion commandes + refunds

**Labels**: `backend`, `admin`, `mvp-critical`
**Milestone**: Sprint 3
**Depends on**: #19, #21

**Description**
Admin des commandes avec state machine stricte + refunds Stripe.

**Acceptance Criteria**
- [ ] `GET /admin/orders?status=&from=&to=&userId=&q=` paginé
- [ ] `GET /admin/orders/:id` (détail complet + items + payment + timeline)
- [ ] `PATCH /admin/orders/:id/status` : transition validée (PAID→PROCESSING→SHIPPED [req trackingNumber]→DELIVERED)
- [ ] Transitions invalides → 400 avec message clair
- [ ] `POST /admin/orders/:id/refund` (amountCents optional, reason) → Stripe Refund API + update Payment + Order status
- [ ] Enqueue email correspondant sur chaque transition

---

### #33 — [S3][Frontend][Admin] Pages commandes

**Labels**: `frontend`, `admin`
**Milestone**: Sprint 3
**Depends on**: #32

**Description**
Interface admin commandes.

**Acceptance Criteria**
- [ ] Liste filtrable (status, dates, user, search orderNumber)
- [ ] Page détail : items, adresses, timeline statuts, montants, payment info
- [ ] Actions : changer statut (modal), rembourser (modal avec montant)
- [ ] Badge coloré par statut

---

### #34 — [S3][Backend][Admin] Gestion utilisateurs

**Labels**: `backend`, `admin`
**Milestone**: Sprint 3

**Description**
Admin users avec LTV.

**Acceptance Criteria**
- [ ] `GET /admin/users?q=&role=&page=` (search email)
- [ ] `GET /admin/users/:id` : profil + lastOrders[5] + LTV (sum totalCents PAID/DELIVERED)
- [ ] `PATCH /admin/users/:id` : role, blocked (booléen à ajouter au schéma)
- [ ] Blocked user → login bloqué avec message explicite

---

### #35 — [S3][Frontend][Admin] Page utilisateurs

**Labels**: `frontend`, `admin`
**Milestone**: Sprint 3
**Depends on**: #34

**Description**
UI admin users.

**Acceptance Criteria**
- [ ] Liste DataTable avec search
- [ ] Détail avec KPIs LTV + historique commandes
- [ ] Actions : bloquer/débloquer, promouvoir ADMIN (avec confirm)

---

### #36 — [S3][Backend] Module reviews + modération

**Labels**: `backend`, `admin`
**Milestone**: Sprint 3
**Depends on**: #19

**Description**
Avis produit avec contrôle "achat vérifié".

**Acceptance Criteria**
- [ ] Modèle `Review` (productId, userId, rating 1-5, title?, comment, isApproved, `@@unique([productId, userId])`)
- [ ] `POST /products/:id/reviews` (🔒) : vérifie que user a un Order DELIVERED contenant ce produit
- [ ] `GET /products/:id/reviews?page=` (approuvés uniquement)
- [ ] `GET /admin/reviews?status=pending` (admin)
- [ ] `PATCH /admin/reviews/:id/approve`
- [ ] `DELETE /admin/reviews/:id` (admin)
- [ ] Sanitization DOMPurify sur `comment`

---

### #37 — [S3][Frontend][Admin] Page modération reviews

**Labels**: `frontend`, `admin`
**Milestone**: Sprint 3
**Depends on**: #36

**Description**
Interface modération.

**Acceptance Criteria**
- [ ] Liste reviews pending + approved avec toggle
- [ ] Actions : approuver, supprimer
- [ ] Affichage user + produit + rating + comment

---

### #38 — [S3][Backend][Security] Audit log interceptor

**Labels**: `backend`, `security`, `admin`
**Milestone**: Sprint 3

**Description**
Traçabilité complète des actions admin.

**Acceptance Criteria**
- [ ] Modèle `AuditLog` (userId, action, resource, before JSON, after JSON, ip, userAgent, createdAt)
- [ ] `AuditLogInterceptor` appliqué à toutes les routes `/admin/*` avec méthodes mutantes
- [ ] Capture before (fetch avant mutation) + after (retour)
- [ ] Actions normées : `product.create`, `order.status.update`, etc.
- [ ] `GET /admin/audit-log?userId=&resource=&from=&to=` paginé

---

### #39 — [S3][Frontend][Admin] Page audit log

**Labels**: `frontend`, `admin`, `security`
**Milestone**: Sprint 3
**Depends on**: #38

**Description**
Consultation audit log.

**Acceptance Criteria**
- [ ] Liste filtrable (user, resource, action, date range)
- [ ] Diff visuel before/after (JSON viewer)
- [ ] Export CSV

---

### #40 — [S3][Security] 2FA TOTP obligatoire ADMIN

**Labels**: `security`, `backend`, `frontend`, `admin`
**Milestone**: Sprint 3
**Depends on**: #3

**Description**
2FA via TOTP pour tous les comptes ADMIN.

**Acceptance Criteria**
- [ ] Champs `User.totpSecret`, `User.totpEnabled`
- [ ] `POST /auth/2fa/setup` : génère secret + retourne otpauth URL (QR code front)
- [ ] `POST /auth/2fa/enable` : user soumet code pour confirmer activation
- [ ] `POST /auth/2fa/verify` : pendant login, si user ADMIN avec totpEnabled → login en 2 étapes
- [ ] Backup codes (5) générés + hashés à l'activation
- [ ] Tests e2e complets
- [ ] Forcer activation à la 1re connexion ADMIN

---

## Milestone: Sprint 4 — SEO & UX Premium

---

### #41 — [S4][SEO] Sitemap dynamique

**Labels**: `frontend`, `seo`
**Milestone**: Sprint 4

**Description**
Génération `/sitemap.xml` dynamique à partir de la DB.

**Acceptance Criteria**
- [ ] `app/sitemap.ts` exporte fonction retournant array
- [ ] Inclut : home, catégories actives, produits actifs (avec lastModified)
- [ ] Pas de routes privées (/admin, /compte)
- [ ] Testé avec Google Search Console validator

---

### #42 — [S4][SEO] Robots.txt

**Labels**: `frontend`, `seo`
**Milestone**: Sprint 4

**Description**
`/robots.txt` autorisant indexation publique uniquement.

**Acceptance Criteria**
- [ ] `app/robots.ts` exporté
- [ ] Allow `/`
- [ ] Disallow `/admin/*`, `/compte/*`, `/api/*`, `/checkout`, `/confirmation/*`
- [ ] Pointe vers `/sitemap.xml`

---

### #43 — [S4][SEO] Metadata dynamique + OG + JSON-LD

**Labels**: `frontend`, `seo`
**Milestone**: Sprint 4

**Description**
Metadata riches par page (produit, catégorie).

**Acceptance Criteria**
- [ ] `generateMetadata` sur fiche produit : title, description, openGraph (image, type), twitter
- [ ] JSON-LD `Product` + `Offer` (priceCents/100, availability) + `AggregateRating` si reviews
- [ ] Canonical URL sur toutes pages indexables
- [ ] Hreflang stubs (pour i18n S8)
- [ ] Validation via Google Rich Results Test

---

### #44 — [S4][UX] Design system tokens + composants UI

**Labels**: `frontend`, `ux`
**Milestone**: Sprint 4

**Description**
Finalisation design system Tailwind + composants `packages/ui`.

**Acceptance Criteria**
- [ ] Palette finale (ivory, gold, ink, neutrals)
- [ ] Typographies : Inter (sans) + Playfair Display (serif display)
- [ ] Composants `packages/ui` : Button (variants), Input, Select, Badge, Card, Dialog, Toast, Skeleton
- [ ] Export via `@ecommerce/ui`
- [ ] Docs usage minimale (MDX optionnel)

---

### #45 — [S4][UX] Animations Framer Motion

**Labels**: `frontend`, `ux`
**Milestone**: Sprint 4

**Description**
Micro-interactions premium.

**Acceptance Criteria**
- [ ] Transitions page (fade + subtle slide)
- [ ] Hover card produit (scale + shadow)
- [ ] Drawer panier (slide right)
- [ ] Respect `prefers-reduced-motion`

---

### #46 — [S4][Backend][Frontend] Wishlist

**Labels**: `backend`, `frontend`, `ux`
**Milestone**: Sprint 4

**Description**
Favoris persistés côté serveur.

**Acceptance Criteria**
- [ ] Modèle `Wishlist` (userId, productId, `@@unique([userId, productId])`)
- [ ] `GET /wishlist`, `POST /wishlist/:productId`, `DELETE /wishlist/:productId` (🔒)
- [ ] Icône cœur sur card + fiche (remplie si wishlisted)
- [ ] Page `/compte/wishlist`
- [ ] Toggle optimiste côté client (rollback sur erreur)

---

### #47 — [S4][Frontend][UX] Galerie produit premium

**Labels**: `frontend`, `ux`
**Milestone**: Sprint 4

**Description**
Galerie immersive sur fiche produit.

**Acceptance Criteria**
- [ ] Carousel Embla (touch + keyboard)
- [ ] Thumbnails cliquables
- [ ] Zoom au hover desktop (react-inner-image-zoom)
- [ ] Fullscreen lightbox
- [ ] Lazy loading avec `next/image`

---

### #48 — [S4][Frontend][UX] Storytelling fiche produit

**Labels**: `frontend`, `ux`
**Milestone**: Sprint 4

**Description**
Section sensorielle pour les notes olfactives.

**Acceptance Criteria**
- [ ] Section dédiée topNotes / heartNotes / baseNotes avec icônes
- [ ] Rendu storytelling (champ `Product.storyTelling`)
- [ ] Typographie serif pour ambiance luxe
- [ ] Responsive mobile

---

### #49 — [S4][Backend] Endpoints related products + best sellers

**Labels**: `backend`
**Milestone**: Sprint 4

**Description**
Recommandations simples basées sur catégorie et ventes.

**Acceptance Criteria**
- [ ] `GET /products/:id/related` : même categoryId, random 4, exclut self, active
- [ ] `GET /products/featured` : `isFeatured=true` + `isActive=true` (max 8)
- [ ] `GET /products/bestsellers` : top 8 par count `OrderItem` sur 90 derniers jours (Orders PAID/DELIVERED)
- [ ] Queries optimisées (raw si besoin)

---

## Milestone: Sprint 5 — Marketing

---

### #50 — [S5][DB] Schéma promo codes

**Labels**: `backend`, `database`, `marketing`
**Milestone**: Sprint 5

**Description**
Modèles codes promotionnels.

**Acceptance Criteria**
- [ ] `PromoCode` (code unique, discountType enum, discountValue Int, minOrderCents, maxUses, usedCount, maxUsesPerUser, validFrom, validUntil, isActive, appliesToProductIds[], appliesToCategoryIds[])
- [ ] `PromoCodeUsage` (promoCodeId, userId, orderId unique, discountCents, `@@unique([promoCodeId, userId, orderId])`)
- [ ] Enum `DiscountType { PERCENTAGE, FIXED_AMOUNT, FREE_SHIPPING }`
- [ ] Index : `PromoCode.(code, isActive)`, `PromoCodeUsage.userId`
- [ ] Ajout `Order.promoCodeId` nullable + `discountCents`

---

### #51 — [S5][Backend] Module promo-codes

**Labels**: `backend`, `marketing`
**Milestone**: Sprint 5
**Depends on**: #50

**Description**
Validation et application codes.

**Acceptance Criteria**
- [ ] `POST /cart/apply-promo` (body: `{ code, cartSnapshot }`) : valide (actif, dates, minOrder, maxUses global, maxUsesPerUser, scope produits/catégories) → retourne `{ discountCents, finalTotalCents }` ou 400
- [ ] Integration dans `POST /orders` : accepte `promoCode` → recalcul total server-side + create `PromoCodeUsage` + **increment atomique** `PromoCode.usedCount` avec `where: { usedCount: { lt: maxUses } }` (throw si dépassé)
- [ ] Tests concurrentiels : 10 users appliquent code `maxUses=5` simultanément → exactement 5 usages

---

### #52 — [S5][Backend][Admin] CRUD promo codes

**Labels**: `backend`, `admin`, `marketing`
**Milestone**: Sprint 5
**Depends on**: #51

**Description**
Admin codes promo.

**Acceptance Criteria**
- [ ] `GET /admin/promo-codes` paginé + filtres (active, expired)
- [ ] `POST /admin/promo-codes`, `PATCH`, `DELETE`
- [ ] `GET /admin/promo-codes/:id/usage` : liste `PromoCodeUsage` + stats (CA généré)

---

### #53 — [S5][Frontend][Admin] UI promo codes

**Labels**: `frontend`, `admin`, `marketing`
**Milestone**: Sprint 5
**Depends on**: #52

**Description**
Pages admin promo.

**Acceptance Criteria**
- [ ] Liste avec colonnes (code, type, usage, dates, status)
- [ ] Form create/edit (type discount, dates, limites, scope produits/catégories)
- [ ] Page stats usage

---

### #54 — [S5][Frontend] Input promo code au checkout

**Labels**: `frontend`, `marketing`
**Milestone**: Sprint 5
**Depends on**: #51

**Description**
Application code promo côté client.

**Acceptance Criteria**
- [ ] Input + bouton "Appliquer" sur `/checkout`
- [ ] Appelle `/cart/apply-promo` + affiche ligne discount + nouveau total
- [ ] Messages erreur clairs (expiré, scope, maxUses)
- [ ] Bouton "Retirer le code"

---

### #55 — [S5][Backend][Marketing] Abandoned cart cron + emails

**Labels**: `backend`, `marketing`
**Milestone**: Sprint 5
**Depends on**: #18, #24

**Description**
Relance panier automatisée 3 étapes.

**Acceptance Criteria**
- [ ] Cron BullMQ `check-abandoned-carts` toutes les 15 min
- [ ] Stage 1 (1h–2h, reminderStage=0, email présent) → envoi `abandoned_cart_1h` + stage=1
- [ ] Stage 2 (24h–25h, stage=1) → `abandoned_cart_24h` (+ WhatsApp si phone, S6)
- [ ] Stage 3 (72h–73h, stage=2) → `abandoned_cart_72h` **avec code promo auto-généré 10% valide 7j**
- [ ] Token signé dans lien email : `GET /cart/resume/:token` → repeuple checkout
- [ ] Cron idempotent (stage impair impossible de rejouer)
- [ ] Respect `User.marketingOptIn`

---

### #56 — [S5][Backend] Opt-out marketing

**Labels**: `backend`, `marketing`, `security`
**Milestone**: Sprint 5

**Description**
Désabonnement conforme RGPD.

**Acceptance Criteria**
- [ ] Champ `User.marketingOptIn` (default `true`, opt-in à l'inscription à revoir selon marché)
- [ ] Token signé opt-out dans chaque email marketing
- [ ] Page `/unsubscribe/:token` → set `marketingOptIn=false` + message confirmation
- [ ] Endpoint `PATCH /users/me/preferences` (authed) pour toggle
- [ ] Aucun email marketing envoyé si `false`

---

### #57 — [S5][Backend] Templates emails transactionnels complets

**Labels**: `backend`, `marketing`
**Milestone**: Sprint 5
**Depends on**: #24

**Description**
Jeu complet de templates transactionnels.

**Acceptance Criteria**
- [ ] `order_confirmation` enrichi (items avec images, total, adresse, discount, TVA)
- [ ] `order_shipped` (transporteur, tracking number, URL tracking)
- [ ] `order_delivered`
- [ ] `order_cancelled`
- [ ] `order_refunded` (montant remboursé)
- [ ] `welcome` (inscription) avec code promo bienvenue 10% optionnel
- [ ] `review_request` (cron J+7 après DELIVERED)
- [ ] Tous tracés dans `EmailLog`
- [ ] Hook `OrdersService.updateStatus` → enqueue template correspondant

---

### #58 — [S5][Frontend][Admin] Dashboard emails

**Labels**: `frontend`, `admin`, `marketing`
**Milestone**: Sprint 5

**Description**
Suivi délivrabilité emails.

**Acceptance Criteria**
- [ ] Page `/admin/email-logs` : DataTable filtrable (status, template, user, date)
- [ ] KPIs : delivery rate, bounce rate, open rate (si webhook)
- [ ] Détail email (payload, erreur)

---

## Milestone: Sprint 6 — Différenciation

---

### #59 — [S6][Backend] Algolia sync + search service

**Labels**: `backend`, `performance`
**Milestone**: Sprint 6

**Description**
Indexation et sync incrémentale Algolia.

**Acceptance Criteria**
- [ ] `AlgoliaService` wrap SDK `algoliasearch`
- [ ] Prisma middleware sur `Product` : create/update/delete → enqueue job `sync-algolia`
- [ ] Worker BullMQ `sync-algolia` : `saveObject` / `deleteObject` (idempotent)
- [ ] Attributs indexés : name, brand, description, topNotes/heartNotes/baseNotes, gender, category.name, priceCents, slug, imageUrl, isActive
- [ ] Facet attributes : category.name, gender, brand, priceCents
- [ ] Script CLI `pnpm --filter @ecommerce/api algolia:reindex` (full resync)
- [ ] Synonymes documentés (parfum/fragrance, etc.)

---

### #60 — [S6][Frontend] Page recherche + autocomplete

**Labels**: `frontend`, `ux`
**Milestone**: Sprint 6
**Depends on**: #59

**Description**
UX recherche premium.

**Acceptance Criteria**
- [ ] Page `/recherche` avec `react-instantsearch`
- [ ] SearchBox, RefinementList (category, gender, brand), RangeInput (prix), Hits grid
- [ ] URL synchronisée avec filtres
- [ ] Autocomplete header (`@algolia/autocomplete-js`) : suggestions produits + catégories
- [ ] Ouverture clic search icon (keyboard `/` shortcut)

---

### #61 — [S6][Backend] Module quiz parfum

**Labels**: `backend`
**Milestone**: Sprint 6

**Description**
Scoring règles pour recommandations quiz.

**Acceptance Criteria**
- [ ] Modèle `QuizResult` (userId nullable, answers JSON, suggestedProductIds[], createdAt)
- [ ] `POST /quiz/submit` (body: `{ answers }`) : scoring selon règles (famille olfactive, intensité, saison, genre) → retourne top 3 produits
- [ ] Persist `QuizResult`
- [ ] Règles documentées dans le code (table correspondances)

---

### #62 — [S6][Frontend] Parcours quiz

**Labels**: `frontend`, `ux`
**Milestone**: Sprint 6
**Depends on**: #61

**Description**
UX quiz multi-étapes immersive.

**Acceptance Criteria**
- [ ] Page `/quiz` avec 5-7 questions (famille, intensité, saison, genre, moment de port, budget)
- [ ] Transitions Framer Motion entre étapes
- [ ] Visuels illustrés par question
- [ ] Page résultats avec top 3 + CTA "Ajouter au panier"
- [ ] Persist dans URL pour partage

---

### #63 — [S6][Frontend] UI reviews sur fiche produit

**Labels**: `frontend`, `ux`
**Milestone**: Sprint 6
**Depends on**: #36

**Description**
Affichage et submission reviews.

**Acceptance Criteria**
- [ ] Section reviews sur fiche produit : moyenne étoiles, distribution, liste paginée
- [ ] Form submission depuis `/compte/commandes/:id` (badge "Laisser un avis" si DELIVERED + produit non encore reviewé)
- [ ] Rating stars interactif
- [ ] Confirmation envoi + état "en attente de modération"

---

### #64 — [S6][Frontend] Suivi commande timeline

**Labels**: `frontend`, `ux`
**Milestone**: Sprint 6

**Description**
Page tracking commande enrichie.

**Acceptance Criteria**
- [ ] Page `/compte/commandes/:id` : timeline visuelle (PAID → PROCESSING → SHIPPED → DELIVERED) avec dates
- [ ] Tracking number + lien transporteur externe
- [ ] Items récap + total
- [ ] Actions : re-télécharger facture (stub), signaler problème (stub)

---

### #65 — [S6][Backend] Webhook transporteur (stub)

**Labels**: `backend`, `infra`
**Milestone**: Sprint 6

**Description**
Stub endpoint webhook pour transporteurs futurs.

**Acceptance Criteria**
- [ ] `POST /shipping/webhook` avec signature validation prévue
- [ ] Parse payload minimal (orderId, status)
- [ ] Update Order status si DELIVERED
- [ ] Enqueue email `order_delivered`
- [ ] Table `WebhookEvent` partagée pour idempotence

---

### #66 — [S6][Backend] Notifications WhatsApp (Twilio)

**Labels**: `backend`, `marketing`
**Milestone**: Sprint 6

**Description**
Notifications statut commande via WhatsApp Business API.

**Acceptance Criteria**
- [ ] Service `WhatsAppService` (Twilio SDK)
- [ ] Template pré-approuvé `order_status_update`
- [ ] Hook sur transitions Order → enqueue WhatsApp si `User.phone` + opt-in
- [ ] Table `WhatsAppLog` (tracking délivrabilité)
- [ ] Respect opt-out

---

## Milestone: Sprint 7 — Performance & Scale

---

### #67 — [S7][Performance] Cache Redis produits + catégories

**Labels**: `performance`, `backend`
**Milestone**: Sprint 7

**Description**
Couche cache applicative pour endpoints lourds.

**Acceptance Criteria**
- [ ] `CacheService` (ioredis + cache-manager-redis-yet)
- [ ] Cache `product:{slug}` TTL 10 min
- [ ] Cache `categories:tree` TTL 1 h
- [ ] Cache `products:bestsellers` TTL 1 h
- [ ] Invalidation sur update via event emitter (product.updated → `DEL product:{slug}`)
- [ ] `CacheInterceptor` sur GET publics
- [ ] Métrique hit/miss exposée

---

### #68 — [S7][Performance] Cloudinary migration + next/image loader

**Labels**: `performance`, `frontend`, `infra`
**Milestone**: Sprint 7

**Description**
Optimisation livraison images.

**Acceptance Criteria**
- [ ] Script migration upload images existantes vers Cloudinary
- [ ] Custom loader `next/image` pointant Cloudinary (`w_auto,f_auto,q_auto`)
- [ ] Responsive srcset via `sizes`
- [ ] Lazy loading obligatoire hors viewport
- [ ] Audit : LCP fiche produit < 2.5 s

---

### #69 — [S7][Performance][DB] Audit DB + full-text search

**Labels**: `performance`, `backend`, `database`
**Milestone**: Sprint 7

**Description**
Optimisation DB après profilage.

**Acceptance Criteria**
- [ ] `EXPLAIN ANALYZE` sur top 10 queries (endpoint load test)
- [ ] Index manquants ajoutés via migration
- [ ] Colonne `Product.search_vector tsvector` + index GIN + trigger update
- [ ] Fallback search SQL si Algolia down
- [ ] Pagination cursor-based vérifiée partout
- [ ] PgBouncer en prod (ou managed pool)

---

### #70 — [S7][Infra] Monitoring + alerting

**Labels**: `infra`, `performance`, `security`
**Milestone**: Sprint 7

**Description**
Observabilité prod complète.

**Acceptance Criteria**
- [ ] Sentry Performance actif (traces N+1, slow queries)
- [ ] Dashboards Grafana (ou Axiom) : latency p95/p99, 5xx rate, DB connections, Redis ops
- [ ] Alertes :
  - 5xx rate > 1% sur 5 min
  - Webhook Stripe fail 3× consécutifs
  - Email bounce > 2% sur 1h
  - Stock produit top 20 < threshold
  - Queue BullMQ backlog > 1000
- [ ] Channel Slack/email pour alertes

---

### #71 — [S7][Infra][Security] Backups DB automatiques

**Labels**: `infra`, `security`
**Milestone**: Sprint 7

**Description**
Continuité d'activité.

**Acceptance Criteria**
- [ ] Backups quotidiens automatiques (managed PG ou pg_dump + S3)
- [ ] Rétention 30 jours
- [ ] Test de restauration mensuel documenté (runbook)
- [ ] Restauration complète en < 10 min
- [ ] Chiffrement backups au repos

---

### #72 — [S7][Performance] Audit Lighthouse

**Labels**: `performance`, `frontend`
**Milestone**: Sprint 7

**Description**
Cibles Lighthouse mobile.

**Acceptance Criteria**
- [ ] Perf ≥ 90
- [ ] SEO 100
- [ ] Accessibilité ≥ 95
- [ ] Best Practices 100
- [ ] Fichier `lighthouse.config.js` + job CI optionnel

---

## Milestone: Sprint 8 — Premium & i18n

---

### #73 — [S8][Backend] Recommandations comportementales

**Labels**: `backend`
**Milestone**: Sprint 8

**Description**
"Clients ayant acheté X ont aussi acheté Y".

**Acceptance Criteria**
- [ ] Query SQL : self-join sur `OrderItem` (même orderId, productId différent)
- [ ] `GET /products/:id/recommendations` : top 4 co-achats sur 180 derniers jours
- [ ] Cache Redis TTL 24 h
- [ ] Section "Vous aimerez aussi" sur fiche produit

---

### #74 — [S8][Backend][Frontend] Coffrets cadeaux

**Labels**: `backend`, `frontend`, `ux`
**Milestone**: Sprint 8

**Description**
Produits composés (gift sets).

**Acceptance Criteria**
- [ ] Champ `Product.type` (SINGLE, GIFT_SET)
- [ ] Table `GiftSetItem` (parentProductId, childProductId, quantity)
- [ ] Stock calculé dynamiquement (min des enfants)
- [ ] UI dédiée sur fiche coffret (liste des produits inclus)
- [ ] Price override possible (prix coffret < somme)

---

### #75 — [S8][Frontend][UX] Message cadeau au checkout

**Labels**: `frontend`, `ux`
**Milestone**: Sprint 8

**Description**
Option message personnalisé.

**Acceptance Criteria**
- [ ] Champ `Order.giftMessage` (max 300 chars)
- [ ] Toggle "C'est un cadeau" au checkout → textarea
- [ ] Affiché dans email de confirmation destinataire
- [ ] Imprimable via endpoint `/admin/orders/:id/gift-card` (PDF)

---

### #76 — [S8][Backend] Support WhatsApp inbound

**Labels**: `backend`, `marketing`
**Milestone**: Sprint 8

**Description**
Réception messages clients WhatsApp.

**Acceptance Criteria**
- [ ] Webhook inbound Twilio `/webhooks/whatsapp`
- [ ] Persist conversations (table `WhatsAppMessage`)
- [ ] Notification admin (email ou dashboard)
- [ ] Bouton sticky frontend ouvrant WhatsApp avec numéro business

---

### #77 — [S8][Frontend] i18n next-intl (FR/EN)

**Labels**: `frontend`, `seo`
**Milestone**: Sprint 8

**Description**
Site multi-langue.

**Acceptance Criteria**
- [ ] `next-intl` configuré
- [ ] Routing `/en/...` + `/` (FR par défaut)
- [ ] Fichiers messages `messages/fr.json`, `messages/en.json`
- [ ] Toutes pages publiques traduites (produit, catégorie, quiz, compte)
- [ ] Hreflang dans metadata
- [ ] Switch langue dans Header

---

### #78 — [S8][Backend] Multi-devise

**Labels**: `backend`, `frontend`
**Milestone**: Sprint 8

**Description**
Affichage prix en EUR/USD/XOF.

**Acceptance Criteria**
- [ ] Table `ExchangeRate` (base, quote, rate, updatedAt)
- [ ] Cron quotidien fetch API taux (exchangeratesapi ou autre)
- [ ] Helper `formatPrice(priceCents, currency)` côté front
- [ ] Sélecteur devise dans Header (persist cookie)
- [ ] **Paiement toujours dans devise shop** (pas de conversion au checkout)
- [ ] Affichage note "Prix indicatif, paiement en EUR"

---

### #79 — [S8][Backend] Paiement local (Wave / Orange Money)

**Labels**: `backend`, `mvp-critical`
**Milestone**: Sprint 8

**Description**
Adapter pattern pour paiements locaux.

**Acceptance Criteria**
- [ ] Interface `PaymentProvider` (createIntent, verifyWebhook, refund)
- [ ] Implémentations `StripeProvider`, `WaveProvider`, `OrangeMoneyProvider`
- [ ] `POST /orders` accepte `paymentProvider` → route vers bon adapter
- [ ] Webhooks dédiés `/payments/wave/webhook`, `/payments/orange/webhook`
- [ ] Même logique idempotence via `WebhookEvent`
- [ ] Tests sandbox Wave/Orange

---

### #80 — [S8][Security] RGPD export + delete

**Labels**: `security`, `backend`
**Milestone**: Sprint 8

**Description**
Droits RGPD utilisateurs.

**Acceptance Criteria**
- [ ] `POST /users/me/export-request` → génère job BullMQ
- [ ] Email avec lien téléchargement JSON/CSV (token signé, TTL 48 h)
- [ ] `POST /users/me/delete-request` → job de suppression différée 30 j (fenêtre annulation)
- [ ] Anonymisation : email → `deleted_{userId}@anonymized.local`, PII nullifiée, commandes conservées (obligations fiscales)
- [ ] Page `/compte/confidentialite` avec ces actions

---

## Security & Performance bonus issues

---

### #81 — [Security][Transverse] Audit dépendances + SCA

**Labels**: `security`, `infra`
**Milestone**: Sprint 7

**Description**
Sécurité chaîne d'approvisionnement.

**Acceptance Criteria**
- [ ] `pnpm audit` intégré en CI (fail si HIGH/CRITICAL)
- [ ] Dependabot activé (auto-PR)
- [ ] Snyk ou équivalent scan hebdomadaire
- [ ] Politique documentée : HIGH corrigé < 7 j, CRITICAL < 24 h

---

### #82 — [Security] Headers CSP stricts

**Labels**: `security`, `frontend`
**Milestone**: Sprint 4

**Description**
Content Security Policy production.

**Acceptance Criteria**
- [ ] CSP headers Next.js middleware
- [ ] `script-src` whitelist (self, stripe, algolia, sentry)
- [ ] `img-src` cloudinary + self + data
- [ ] `connect-src` api + stripe + sentry
- [ ] Report-only d'abord puis enforce
- [ ] Pas de `unsafe-inline` hors exceptions documentées

---

### #83 — [Performance] Tests de charge

**Labels**: `performance`, `infra`
**Milestone**: Sprint 7

**Description**
Valider les SLO sous charge.

**Acceptance Criteria**
- [ ] Scénarios k6 : browse catalogue, add to cart, checkout
- [ ] Cibles : 1000 req/s sur catalogue, 100 req/s sur checkout, p95 < 500 ms
- [ ] Run en staging avant go-live
- [ ] Rapport documenté

---

### #84 — [Security] Secret management prod

**Labels**: `security`, `infra`
**Milestone**: Sprint 1

**Description**
Ne jamais stocker secrets en clair en prod.

**Acceptance Criteria**
- [ ] Doppler / AWS Secrets Manager / Vercel encrypted envs
- [ ] Rotation documentée pour JWT secrets + Stripe keys
- [ ] Pre-commit hook `git-secrets` (scan secrets)
- [ ] Runbook compromission clé
