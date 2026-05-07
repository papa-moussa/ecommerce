# Rapport d'Audit de Sécurité — Maison Parfum E-Commerce

> **Classification :** Confidentiel — Usage interne uniquement  
> **Date :** 2026-05-07  
> **Périmètre :** Audit boîte blanche (code source complet)  
> **Auditeur :** Analyse automatisée + revue manuelle approfondie  
> **Version de l'application :** Commit `34da068` (branche `master`)

---

## Table des matières

1. [Résumé exécutif](#1-résumé-exécutif)
2. [Score global de sécurité](#2-score-global-de-sécurité)
3. [Architecture et surface d'attaque](#3-architecture-et-surface-dattaque)
4. [Vulnérabilités identifiées](#4-vulnérabilités-identifiées)
   - [CRITIQUE](#41-vulnérabilités-critiques)
   - [HAUTE](#42-vulnérabilités-de-sévérité-haute)
   - [MOYENNE](#43-vulnérabilités-de-sévérité-moyenne)
   - [FAIBLE](#44-vulnérabilités-de-sévérité-faible)
5. [Analyse OWASP Top 10](#5-analyse-owasp-top-10)
6. [Dépendances et composants](#6-dépendances-et-composants)
7. [Configuration Docker et CI/CD](#7-configuration-docker-et-cicd)
8. [Plan de remédiation priorisé](#8-plan-de-remédiation-priorisé)
9. [Recommandations architecturales](#9-recommandations-architecturales)
10. [Conclusion](#10-conclusion)

---

## 1. Résumé exécutif

L'audit de sécurité de la plateforme e-commerce **Maison Parfum** a été conduit sur l'intégralité du code source. L'application repose sur une stack moderne (NestJS + Next.js 15, PostgreSQL, Redis, Stripe, Cloudinary, Algolia) avec des mécanismes de sécurité partiellement implémentés.

L'audit révèle **4 vulnérabilités critiques**, dont deux constituent des menaces immédiates pour la sécurité des données de production :

- **Des secrets de production (mots de passe, clés API, secrets JWT) ont été commités dans le dépôt Git.** Ces secrets sont désormais présents dans l'historique Git et doivent être considérés comme compromis.
- **Un bypass d'authentification complet est possible** via la réutilisation du token temporaire 2FA comme token d'accès régulier — permettant à tout détenteur d'un tel token d'accéder aux routes ADMIN sans valider son second facteur.

Ces deux vulnérabilités nécessitent une action **immédiate avant toute mise en production ou exposition publique**.

### Points positifs identifiés

| Domaine | Observation |
|---------|-------------|
| Hachage des mots de passe | bcrypt avec 12 rounds — bonne pratique |
| Tokens en base | Seuls les hashes SHA-256 sont stockés (refresh, email, reset) |
| Rate limiting | Throttler Redis configuré sur login (5/min), register (3/min), forgot-password (3/h) |
| Rotation des tokens | Refresh token rotation correctement implémentée |
| Validation des entrées | ValidationPipe global avec `whitelist: true`, `forbidNonWhitelisted: true` |
| Idempotence Stripe | Déduplication des webhooks via `WebhookEvent` table |
| 2FA administrateurs | TOTP obligatoire pour tous les comptes ADMIN |
| Audit log | Capture before/after state sur toutes les mutations admin |
| En-têtes HTTP | Helmet activé (configuration par défaut) |

---

## 2. Score global de sécurité

```
Score global : 42 / 100  ⚠️  INSUFFISANT

╔══════════════════════════════════════════════════════════════╗
║  Authentification & Autorisation     35 / 100  🔴 CRITIQUE  ║
║  Gestion des secrets                  5 / 100  🔴 CRITIQUE  ║
║  Sécurité réseau & Transport         20 / 100  🔴 CRITIQUE  ║
║  Validation & Injection              75 / 100  🟡 MOYEN     ║
║  Logging & Monitoring                65 / 100  🟡 MOYEN     ║
║  Gestion des dépendances             50 / 100  🟡 MOYEN     ║
║  Configuration CI/CD                 45 / 100  🟠 FAIBLE    ║
║  Sécurité Frontend                   60 / 100  🟡 MOYEN     ║
╚══════════════════════════════════════════════════════════════╝
```

> **Seuil d'acceptabilité pour une application e-commerce** : ≥ 75/100. Le score actuel interdit toute mise en production face au public.

---

## 3. Architecture et surface d'attaque

### Stack technique réelle

| Composant | Technologie | Version |
|-----------|-------------|---------|
| API Backend | NestJS | 10.4.4 |
| Frontend | Next.js | 15.x |
| ORM | Prisma | 5.20.0 |
| Base de données | PostgreSQL | 16 |
| Cache / Queue | Redis | 7.4 |
| Authentification | JWT + TOTP (otpauth) | — |
| Paiement | Stripe | 22.0.2 |
| CDN Images | Cloudinary | — |
| Recherche | Algolia | 5.50.2 |
| Email | Resend + Nodemailer | 6.12.2 / 8.0.5 |
| Monitoring | Sentry | 8.33.1 |

### Surfaces d'attaque identifiées

```
Internet
    │
    ├─── [80/8088] Next.js Frontend (HTTP — non sécurisé)
    │         └─── Appels API vers le backend
    │
    ├─── [3001] NestJS API (HTTP — non sécurisé)
    │         ├─── POST /api/auth/* (public + throttlé)
    │         ├─── POST /api/payments/webhook (public — Stripe uniquement)
    │         ├─── GET|POST /api/products/* (public)
    │         ├─── * /api/cart|orders|checkout (authentifié)
    │         └─── * /api/admin/* (ADMIN uniquement)
    │
    ├─── [5434] PostgreSQL (loopback 127.0.0.1 — OK)
    ├─── [6379] Redis (loopback — OK)
    └─── Dépôt Git (secrets exposés dans l'historique ⚠️)
```

---

## 4. Vulnérabilités identifiées

### 4.1 Vulnérabilités Critiques

---

#### CRIT-01 — Secrets de production committés dans Git

| Attribut | Détail |
|----------|--------|
| **Sévérité** | 🔴 CRITIQUE |
| **CWE** | CWE-312, CWE-798, CWE-540 |
| **CVSS v3** | 9.8 (AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H) |
| **Fichier concerné** | `.env.prod` (versionné dans git — statut `A`) |
| **Découverte** | Analyse git status + contenu du fichier |

**Description**

Le fichier `.env.prod` contenant l'ensemble des secrets de production a été ajouté au dépôt Git (`git status` : `A  .env.prod`). Le `.gitignore` n'exclut que `.env`, `.env.local` et `.env.*.local` — mais **pas** `.env.prod`.

**Secrets exposés :**

```
POSTGRES_PASSWORD=k9Xp2mR5vW8zL4qN7tB1yS6jE3hA9fC5   # Base de données
REDIS_PASSWORD=u4M1v8R9c2X7z5B3n6K8p1L4mQ7w9S0f        # Redis prod
JWT_ACCESS_SECRET=d7f8a9c2b3e...                         # Forge de tokens JWT
JWT_REFRESH_SECRET=a1b2c3d4e5f6...                       # Forge de refresh tokens
STRIPE_SECRET_KEY=sk_test_51TOIax8yj...                  # Clé Stripe (test)
RESEND_API_KEY=re_ZKy84rSF_B1875Bns...                  # Service email
CLOUDINARY_API_SECRET=JAcKRGU_NkiPY7eH...               # Upload d'images
ALGOLIA_API_KEY=68ed1a11361918b5...                      # Index de recherche
```

**Impact métier**

- Compromission totale de la base de données de production
- Forge de tokens JWT valides pour n'importe quel utilisateur (y compris ADMIN)
- Accès complet à Algolia (remplacement de l'index produits)
- Accès au service email (envoi de phishing au nom du site)
- Accès Cloudinary (upload de contenu malveillant, suppression d'assets)

**Correction immédiate**

```bash
# 1. Révoquer TOUS les secrets immédiatement (priorité absolue)
# - Stripe dashboard → régénérer la clé API
# - Resend → régénérer l'API key
# - Cloudinary → régénérer API secret
# - Algolia → régénérer les clés API
# - Changer le mot de passe PostgreSQL ET Redis
# - Changer JWT_ACCESS_SECRET ET JWT_REFRESH_SECRET
#   (invalide toutes les sessions actives — acceptable en urgence)

# 2. Supprimer le fichier du suivi Git
git rm --cached .env.prod
git rm --cached .env.prod.example  # si contient des valeurs réelles

# 3. Ajouter au .gitignore
echo ".env.prod" >> .gitignore
echo ".env.*.prod" >> .gitignore

# 4. Réécrire l'historique (DANGER — à faire sur une branche isolée)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env.prod" \
  --prune-empty --tag-name-filter cat -- --all

# Alternative moins destructive : BFG Repo Cleaner
# bfg --delete-files .env.prod

# 5. Forcer le push (après accord de l'équipe)
git push origin --force --all

# 6. Invalider le cache GitHub (si repo public ou compromis)
# Contacter GitHub Security via security@github.com
```

**Prévention long terme**

```bash
# Installer git-secrets ou gitleaks en pre-commit hook
pip install detect-secrets
detect-secrets scan > .secrets.baseline

# Ou avec gitleaks (recommandé)
gitleaks protect --staged --config .gitleaks.toml
```

---

#### CRIT-02 — Bypass d'authentification via token 2FA temporaire

| Attribut | Détail |
|----------|--------|
| **Sévérité** | 🔴 CRITIQUE |
| **CWE** | CWE-287, CWE-303, CWE-290 |
| **CVSS v3** | 9.1 (AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N) |
| **Fichiers concernés** | `apps/api/src/auth/totp.service.ts`, `apps/api/src/auth/strategies/jwt.strategy.ts` |

**Description**

Le token temporaire émis lors du premier facteur d'authentification 2FA (`tempToken`) est signé avec le **même secret JWT** (`JWT_ACCESS_SECRET`) et contient les mêmes champs que le token d'accès normal. La stratégie JWT ne vérifie **pas** la présence du claim `twofa: true` et traite ce token comme un token d'accès valide.

**Preuve technique**

```typescript
// totp.service.ts : le tempToken est signé avec JWT_ACCESS_SECRET
issueTempToken(user: User): string {
  const payload: TempTokenPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,  // ← contient 'ADMIN' pour un admin
    twofa: true,      // ← ce flag n'est JAMAIS vérifié côté serveur
  };
  return this.jwt.sign(payload, { expiresIn: TEMP_TOKEN_TTL_SECONDS }); // 5 min
}

// jwt.strategy.ts : validate() accepte tout token avec sub + email + role valides
async validate(payload: JwtPayload): Promise<User> {
  const user = await this.usersService.findByEmail(payload.email);
  if (!user) throw new UnauthorizedException();
  return user;  // ← aucune vérification de payload.twofa
}
```

**Scénario d'exploitation**

```
1. Attaquant connaît les credentials d'un compte ADMIN (email + password)
2. POST /api/auth/login → reçoit { requires2FA: true, tempToken: "eyJ..." }
3. Utilise immédiatement le tempToken dans l'en-tête Authorization: Bearer eyJ...
4. Accède à GET /api/admin/users, /api/admin/metrics, etc. avec les droits ADMIN
5. Tout cela SANS valider le TOTP — le 2FA est complètement contourné
```

**Correction**

```typescript
// Option 1 : Utiliser un secret DISTINCT pour les temp tokens
// totp.service.ts
issueTempToken(user: User): string {
  return this.jwt.sign(payload, {
    secret: this.config.get('JWT_TEMP_SECRET', { infer: true }), // secret différent
    expiresIn: TEMP_TOKEN_TTL_SECONDS,
  });
}

// jwt.strategy.ts : le temp token (signé avec JWT_TEMP_SECRET) sera rejeté
// car la stratégie utilise JWT_ACCESS_SECRET → InvalidSignatureError

// Option 2 : Vérifier le claim twofa dans la stratégie JWT
async validate(payload: JwtPayload): Promise<User> {
  if ((payload as any).twofa === true) {
    throw new UnauthorizedException('Authentification incomplète — 2FA requis');
  }
  const user = await this.usersService.findByEmail(payload.email);
  if (!user) throw new UnauthorizedException();
  return user;
}
```

```bash
# Ajouter dans env.validation.ts
JWT_TEMP_SECRET: z.string().min(32),
```

---

#### CRIT-03 — Credentials administrateur hardcodés dans le code source

| Attribut | Détail |
|----------|--------|
| **Sévérité** | 🔴 CRITIQUE |
| **CWE** | CWE-798, CWE-259 |
| **CVSS v3** | 8.8 (AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H) |
| **Fichier concerné** | `apps/api/entrypoint.sh` |

**Description**

Le script `entrypoint.sh` contient les identifiants de l'administrateur principal en clair dans le code source :

```bash
# entrypoint.sh — lignes 8-34
const hash = await bcrypt.hash('passer123', 12);  // ← mot de passe en clair
await prisma.user.upsert({
  where: { email: 'pamodiallo@gmail.com' },
  create: {
    email: 'pamodiallo@gmail.com',
    passwordHash: hash,
    role: 'ADMIN',
    emailVerified: true
  }
});
```

**Impact**

- Tout développeur ayant accès au dépôt connaît le mot de passe admin
- Le mot de passe `passer123` est trivial (dictionnaire) et réutilisé potentiellement
- Si le dépôt est exposé publiquement ou compromis, accès immédiat à l'interface d'administration

**Correction**

```bash
# entrypoint.sh — utiliser des variables d'environnement
ADMIN_EMAIL="${ADMIN_EMAIL:-}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-}"

if [ -n "$ADMIN_EMAIL" ] && [ -n "$ADMIN_PASSWORD" ]; then
  node -e "
    const { PrismaClient } = require('@prisma/client');
    const bcrypt = require('bcrypt');
    async function seed() {
      const prisma = new PrismaClient();
      const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
      await prisma.user.upsert({
        where: { email: process.env.ADMIN_EMAIL },
        update: {},
        create: {
          email: process.env.ADMIN_EMAIL,
          passwordHash: hash,
          firstName: 'Admin',
          lastName: 'System',
          role: 'ADMIN',
          emailVerified: true
        }
      });
      await prisma.\$disconnect();
    }
    seed().catch(() => process.exit(0));
  "
fi
```

```yaml
# docker-compose.prod.yml
services:
  api:
    environment:
      ADMIN_EMAIL: ${ADMIN_EMAIL}      # depuis .env.prod (non commité)
      ADMIN_PASSWORD: ${ADMIN_PASSWORD}
```

---

#### CRIT-04 — Absence de HTTPS en production

| Attribut | Détail |
|----------|--------|
| **Sévérité** | 🔴 CRITIQUE |
| **CWE** | CWE-319, CWE-523 |
| **CVSS v3** | 8.1 (AV:N/AC:H/PR:N/UI:N/S:U/C:H/I:H/A:N) |
| **Fichiers concernés** | `docker-compose.prod.yml`, `apps/api/src/auth/auth.controller.ts` |

**Description**

La production est configurée pour fonctionner en HTTP pur :

```yaml
# docker-compose.prod.yml
CORS_ORIGIN: http://87.106.171.35:8088   # HTTP, pas HTTPS
APP_URL: http://87.106.171.35:8088
```

```typescript
// auth.controller.ts
const secureCookie =
  process.env['NODE_ENV'] === 'production' &&
  process.env['COOKIE_SECURE'] !== 'false';
// Si COOKIE_SECURE=false (ou absent) → secure: false → cookie transmis en HTTP
```

**Impact**

- Les tokens JWT (access + refresh) transitent en clair sur le réseau
- Un attaquant sur le réseau intermédiaire (MITM, Wi-Fi public) peut voler les tokens
- Les données personnelles (adresses, emails) et les données de paiement transitent en clair
- Le cookie `refresh_token` n'a pas le flag `Secure` → exposé aux sniffers
- Les liens de reset de mot de passe contenant des tokens sensibles transitent en HTTP

**Correction**

```bash
# 1. Mettre en place un reverse proxy (Nginx/Caddy) avec TLS
# Option Caddy (plus simple) :
# Caddyfile
maisonparfum.com {
    reverse_proxy api:3001
    encode gzip
    header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"
}

# 2. Mettre à jour docker-compose.prod.yml
CORS_ORIGIN: https://maisonparfum.com
APP_URL: https://maisonparfum.com

# 3. Ne jamais désactiver COOKIE_SECURE en production
# Supprimer COOKIE_SECURE=false des variables d'environnement de production

# 4. Ajouter HSTS dans Helmet (main.ts)
app.use(
  helmet({
    hsts: {
      maxAge: 63072000,
      includeSubDomains: true,
      preload: true,
    },
  }),
);
```

---

### 4.2 Vulnérabilités de sévérité Haute

---

#### HIGH-01 — Secret Stripe Webhook invalide (placeholder)

| Attribut | Détail |
|----------|--------|
| **Sévérité** | 🟠 HAUTE |
| **CWE** | CWE-345, CWE-294 |
| **Fichier concerné** | `.env.prod` : `STRIPE_WEBHOOK_SECRET=whsec_placeholder_replace_me` |

**Description**

Le secret de validation des webhooks Stripe est une valeur placeholder. Stripe utilise ce secret pour calculer et vérifier la signature HMAC de chaque événement webhook. Avec une valeur incorrecte, `stripe.webhooks.constructEvent()` lèvera une exception pour **tous** les webhooks réels.

**Impact**

- Les paiements réussis (`payment_intent.succeeded`) ne seront **jamais** traités
- Les commandes resteront en statut `PENDING` indéfiniment
- Les stocks ne seront jamais décrémentés après paiement
- Les emails de confirmation de commande ne seront jamais envoyés
- Impact business direct : perte de revenus, clients mécontents

**Correction**

```bash
# Depuis le dashboard Stripe → Webhooks → Votre endpoint → Signing secret
# Copier la valeur commençant par whsec_
STRIPE_WEBHOOK_SECRET=whsec_VALEUR_REELLE_DU_DASHBOARD_STRIPE
```

---

#### HIGH-02 — Absence de rate limiting sur le refresh de token

| Attribut | Détail |
|----------|--------|
| **Sévérité** | 🟠 HAUTE |
| **CWE** | CWE-307, CWE-799 |
| **Fichier concerné** | `apps/api/src/auth/auth.controller.ts` |

**Description**

L'endpoint `POST /api/auth/refresh` n'a aucun décorateur `@Throttle`. Il permet de générer de nouveaux tokens d'accès à partir du cookie `refresh_token` sans limitation.

```typescript
// auth.controller.ts — pas de @Throttle sur refresh
@Public()
@Post('refresh')
@HttpCode(HttpStatus.OK)
async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
  // Aucune limitation de débit
}
```

**Impact**

- Un attaquant ayant volé un cookie `refresh_token` peut générer des tokens d'accès indéfiniment
- Permettrait de maintenir un accès persistant même après rotation manuelle des secrets
- Génère une charge non contrôlée sur la base de données (création d'entrées `RefreshToken`)

**Correction**

```typescript
@Public()
@Throttle({ default: { ttl: 60_000, limit: 10 } })  // Ajouter cette ligne
@Post('refresh')
@HttpCode(HttpStatus.OK)
async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) { ... }
```

---

#### HIGH-03 — Absence de rate limiting sur la vérification TOTP

| Attribut | Détail |
|----------|--------|
| **Sévérité** | 🟠 HAUTE |
| **CWE** | CWE-307 |
| **Fichiers concernés** | `apps/api/src/auth/auth.controller.ts` (routes `2fa/verify`, `2fa/setup-init`, `2fa/finish-setup`) |

**Description**

Les endpoints de vérification TOTP sont marqués `@Public()` mais n'ont aucun throttling. L'espace de codes TOTP est de 1 000 000 valeurs (6 chiffres), avec une fenêtre de 30 secondes (± 1 période = 90 secondes effectives). Un attaquant peut tenter des milliers de codes par minute.

```typescript
@Public()
@Post('2fa/verify')   // Aucun @Throttle
@HttpCode(HttpStatus.OK)
twoFaVerify(@Body() dto: TotpLoginDto, ...) { ... }
```

**Correction**

```typescript
@Public()
@Throttle({ default: { ttl: 60_000, limit: 5 } })  // 5 tentatives/min
@Post('2fa/verify')
@HttpCode(HttpStatus.OK)
twoFaVerify(@Body() dto: TotpLoginDto, ...) { ... }

@Public()
@Throttle({ default: { ttl: 60_000, limit: 3 } })  // Plus restrictif pour setup
@Post('2fa/setup-init')
@HttpCode(HttpStatus.OK)
twoFaSetupInit(@Body() body: { tempToken: string }) { ... }
```

---

#### HIGH-04 — Absence de verrouillage de compte après échecs de connexion

| Attribut | Détail |
|----------|--------|
| **Sévérité** | 🟠 HAUTE |
| **CWE** | CWE-307, CWE-798 |
| **Fichier concerné** | `apps/api/src/auth/auth.service.ts` |

**Description**

Le rate limiting du login (5 req/60s) est appliqué par IP, non par compte. Un attaquant peut contourner cette limitation en utilisant des proxies ou un botnet distribué pour effectuer une attaque par dictionnaire sur un compte spécifique.

```typescript
// auth.service.ts — aucun compteur d'échecs par compte
const valid = await bcrypt.compare(dto.password, user.passwordHash);
if (!valid) throw new UnauthorizedException('Invalid credentials');
// Aucun enregistrement de l'échec, aucun verrouillage
```

**Correction**

```typescript
// Dans auth.service.ts
async login(dto: LoginDto) {
  const user = await this.usersService.findByEmail(dto.email);
  
  // Vérifier le verrouillage (Redis)
  const key = `login_attempts:${dto.email}`;
  const attempts = await this.redis.get(key);
  if (parseInt(attempts ?? '0') >= 5) {
    throw new UnauthorizedException('Compte temporairement verrouillé. Réessayez dans 15 minutes.');
  }
  
  const valid = await bcrypt.compare(dto.password, user?.passwordHash ?? '');
  if (!valid || !user) {
    await this.redis.incr(key);
    await this.redis.expire(key, 900); // 15 minutes
    throw new UnauthorizedException('Invalid credentials');
  }
  
  // Reset le compteur en cas de succès
  await this.redis.del(key);
  // ...
}
```

---

#### HIGH-05 — Clé Stripe de test dans la configuration de production

| Attribut | Détail |
|----------|--------|
| **Sévérité** | 🟠 HAUTE |
| **CWE** | CWE-276 |
| **Fichier concerné** | `.env.prod` |

**Description**

La clé Stripe configurée en production (`sk_test_51TOIax8yj...`) est une clé de **test**. Les paiements effectués en production ne seront pas réels et ne génèreront pas de revenus. De plus, cette clé est désormais exposée dans l'historique Git.

**Correction**

```bash
# Dans .env.prod (après avoir révoqué la clé exposée)
STRIPE_SECRET_KEY=sk_live_VOTRE_CLE_LIVE_DEPUIS_LE_DASHBOARD_STRIPE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_VOTRE_CLE_PUBLIQUE_LIVE
```

---

#### HIGH-06 — Protection des routes admin côté frontend insuffisante

| Attribut | Détail |
|----------|--------|
| **Sévérité** | 🟠 HAUTE |
| **CWE** | CWE-284, CWE-862 |
| **Fichier concerné** | `apps/web/src/middleware.ts` |

**Description**

Le middleware Next.js protège les routes `/admin/*` uniquement en vérifiant la **présence** du cookie `refresh_token`. Un utilisateur CLIENT authentifié (avec un refresh_token valide) peut accéder à toutes les pages d'administration côté frontend.

```typescript
// middleware.ts
if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/setup-2fa')) {
  const sessionCookie = request.cookies.get('refresh_token');
  if (!sessionCookie) {
    // Redirection vers connexion
    return NextResponse.redirect(url);
  }
  // Aucune vérification du rôle ADMIN !
  // Un CLIENT avec un refresh_token valide passe ce contrôle
}
```

**Impact**

- Un CLIENT authentifié peut accéder à l'interface admin et voir son contenu
- L'interface admin peut exposer des informations sensibles côté client (dans le bundle JS, les composants React)
- Les appels API backend retourneront 403 (protégé par `@Roles('ADMIN')`), mais l'UI sera visible

**Correction**

```typescript
// middleware.ts — vérifier le rôle ADMIN via le JWT
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/setup-2fa')) {
    const accessToken = request.headers.get('authorization')?.replace('Bearer ', '')
      || request.cookies.get('access_token')?.value;
    
    if (!accessToken) {
      return NextResponse.redirect(new URL('/connexion', request.url));
    }
    
    try {
      const secret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET);
      const { payload } = await jwtVerify(accessToken, secret);
      if (payload.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/', request.url));
      }
    } catch {
      return NextResponse.redirect(new URL('/connexion', request.url));
    }
  }
}
```

> **Note :** Le JWT_ACCESS_SECRET devra être exposé côté Edge Runtime (Next.js). Utiliser une clé publique asymétrique (RS256) permettrait de vérifier le token sans exposer le secret de signature.

---

### 4.3 Vulnérabilités de sévérité Moyenne

---

#### MED-01 — Tokens sensibles dans les paramètres URL

| Attribut | Détail |
|----------|--------|
| **Sévérité** | 🟡 MOYENNE |
| **CWE** | CWE-598, CWE-200 |
| **Fichier concerné** | `apps/api/src/auth/auth.service.ts` |

**Description**

Les tokens de réinitialisation de mot de passe et de vérification d'email sont transmis en query parameter dans des URLs :

```typescript
// auth.service.ts
const resetUrl = `${APP_URL}/reset-password?token=${rawToken}`;
const verifyUrl = `${APP_URL}/verify-email?token=${token}`;
```

Ces tokens apparaîtront dans :
- Les **logs d'accès** des serveurs web
- L'**historique du navigateur**
- L'**en-tête HTTP Referer** si l'utilisateur clique sur un lien externe depuis la page de reset
- Les outils d'**analyse web** (Google Analytics, etc.)

**Correction**

```typescript
// Utiliser des tokens opaques dans le path, non dans la query string
const resetUrl = `${APP_URL}/reset-password/${rawToken}`; // Path segment

// Ou utiliser un fragment (jamais envoyé au serveur)
const resetUrl = `${APP_URL}/reset-password#token=${rawToken}`;
// ↑ Limitation : le fragment ne survit pas aux redirections
```

---

#### MED-02 — En-tête X-Forwarded-For non validé

| Attribut | Détail |
|----------|--------|
| **Sévérité** | 🟡 MOYENNE |
| **CWE** | CWE-346, CWE-807 |
| **Fichier concerné** | `apps/api/src/common/interceptors/audit-log.interceptor.ts` |

**Description**

L'IP de l'utilisateur est extraite depuis `X-Forwarded-For` sans validation ni configuration de trust proxy :

```typescript
// audit-log.interceptor.ts
const ip = (req.headers['x-forwarded-for'] as string | undefined) ?? req.socket.remoteAddress;
```

Sans reverse proxy configuré ou avec `trust proxy` non configuré dans Express, n'importe quel client peut forger cet en-tête et apparaître comme venant d'une IP arbitraire dans les logs d'audit.

**Correction**

```typescript
// main.ts — configurer Express pour ne faire confiance qu'au proxy direct
const app = await NestFactory.create(AppModule, { rawBody: true });
app.getHttpAdapter().getInstance().set('trust proxy', 1); // 1 = confiance au premier proxy uniquement

// audit-log.interceptor.ts — utiliser req.ip qui tient compte de trust proxy
const ip = req.ip ?? req.socket.remoteAddress;
```

---

#### MED-03 — Secret TOTP stocké en clair en base de données

| Attribut | Détail |
|----------|--------|
| **Sévérité** | 🟡 MOYENNE |
| **CWE** | CWE-312 |
| **Fichier concerné** | `apps/api/prisma/schema.prisma`, `apps/api/src/auth/totp.service.ts` |

**Description**

Le secret TOTP (`totpSecret`) est stocké en base64 (base32) en clair dans la colonne `User.totpSecret`. En cas de compromission de la base de données, un attaquant peut cloner le second facteur d'authentification de tous les administrateurs.

**Correction**

```typescript
// Chiffrer le secret avant stockage (AES-256-GCM)
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

function encryptSecret(secret: string, encKey: Buffer): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-gcm', encKey, iv);
  const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${encrypted.toString('hex')}:${tag.toString('hex')}`;
}

// Ajouter APP_ENCRYPTION_KEY (32 bytes) dans les variables d'environnement
```

---

#### MED-04 — Absence de scanning de vulnérabilités dans le pipeline CI/CD

| Attribut | Détail |
|----------|--------|
| **Sévérité** | 🟡 MOYENNE |
| **CWE** | CWE-1035 |
| **Fichier concerné** | `.github/workflows/ci.yml` |

**Description**

Le pipeline CI ne contient aucune étape d'analyse de sécurité des dépendances (SAST, SCA). Les CVEs dans les dépendances npm passent inaperçues.

**Correction**

```yaml
# .github/workflows/ci.yml — Ajouter un job de sécurité
  security:
    name: Security Scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Audit dependencies
        run: pnpm audit --audit-level=high
        
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'
          
      - name: Upload Trivy scan results
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: 'trivy-results.sarif'
```

---

#### MED-05 — Absence de Content Security Policy (CSP) explicite

| Attribut | Détail |
|----------|--------|
| **Sévérité** | 🟡 MOYENNE |
| **CWE** | CWE-693 |
| **Fichier concerné** | `apps/api/src/main.ts` |

**Description**

`helmet()` est utilisé avec la configuration par défaut. La Content Security Policy générée par défaut (`default-src 'self'`) est trop permissive pour une application qui charge des ressources Stripe, Cloudinary, Algolia et Sentry.

**Correction**

```typescript
// main.ts
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          'https://js.stripe.com',
          'https://cdn.jsdelivr.net',
        ],
        frameSrc: ["'self'", 'https://js.stripe.com'],
        connectSrc: [
          "'self'",
          'https://api.stripe.com',
          `https://${ALGOLIA_APP_ID}-dsn.algolia.net`,
          'https://sentry.io',
          'https://res.cloudinary.com',
        ],
        imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com'],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    },
    hsts: { maxAge: 63072000, includeSubDomains: true, preload: true },
  }),
);
```

---

#### MED-06 — Absence de validation du paramètre `metric` dans les métriques admin

| Attribut | Détail |
|----------|--------|
| **Sévérité** | 🟡 MOYENNE |
| **CWE** | CWE-20 |
| **Fichier concerné** | `apps/api/src/admin/admin.service.ts` |

**Description**

La méthode `getMetricsTimeseries(metric: string, ...)` accepte une chaîne arbitraire pour `metric` sans validation :

```typescript
// admin.service.ts — metric non validé
async getMetricsTimeseries(metric: string, period: '7d' | '30d' | '90d') {
  // ...
  existing.value += metric === 'revenue' ? o.totalCents : 1; // comparison simple
}
```

Bien que sans risque d'injection SQL direct (Prisma paramétrise), toute valeur est acceptée et silencieusement traitée comme un compteur d'ordres. Si ce paramètre est reflété ailleurs (logs, réponses d'erreur), cela peut entraîner une injection dans les logs.

**Correction**

```typescript
// DTO ou validation au niveau du contrôleur
type MetricType = 'revenue' | 'orders';

async getMetricsTimeseries(metric: MetricType, period: '7d' | '30d' | '90d') { ... }

// Dans le contrôleur
@Get('metrics/timeseries')
getTimeseries(@Query('metric') metric: 'revenue' | 'orders', ...) {
  if (!['revenue', 'orders'].includes(metric)) {
    throw new BadRequestException('Métrique invalide');
  }
}
```

---

#### MED-07 — Divulgation du chemin API dans les réponses d'erreur

| Attribut | Détail |
|----------|--------|
| **Sévérité** | 🟡 MOYENNE |
| **CWE** | CWE-209 |
| **Fichier concerné** | `apps/api/src/common/filters/http-exception.filter.ts` |

**Description**

Toutes les réponses d'erreur incluent le champ `path: request.url`, révélant la structure interne des routes API à tout client.

```typescript
const body: ErrorResponse = {
  statusCode: status,
  message,
  error,
  timestamp: new Date().toISOString(),
  path: request.url,      // ← révèle /api/admin/users, /api/payments/... etc.
  requestId: request.id,
};
```

**Correction**

```typescript
// Ne pas inclure path en production
const body: ErrorResponse = {
  statusCode: status,
  message,
  error,
  timestamp: new Date().toISOString(),
  ...(process.env['NODE_ENV'] !== 'production' && { path: request.url }),
  requestId: request.id,
};
```

---

### 4.4 Vulnérabilités de sévérité Faible

---

#### LOW-01 — Cookie `refresh_token` avec `sameSite: 'lax'` et `path: '/'`

| Attribut | Détail |
|----------|--------|
| **Sévérité** | 🟢 FAIBLE |
| **CWE** | CWE-352 |

**Description**

Le cookie de refresh token utilise `sameSite: 'lax'` (autorise les requêtes cross-site en navigation top-level) et `path: '/'` (envoyé avec toutes les requêtes, y compris les endpoints publics).

**Correction**

```typescript
res.cookie(REFRESH_COOKIE, token, {
  httpOnly: true,
  sameSite: 'strict',  // 'lax' → 'strict'
  secure: secureCookie,
  maxAge: COOKIE_TTL_MS,
  path: '/api/auth',   // Restreindre aux endpoints auth uniquement
});
```

---

#### LOW-02 — Images Docker avec tags flottants

| Attribut | Détail |
|----------|--------|
| **Sévérité** | 🟢 FAIBLE |
| **CWE** | CWE-829 |
| **Fichier concerné** | `docker-compose.dev.yml`, `docker-compose.prod.yml` |

**Correction**

```yaml
# Utiliser des digests immuables pour les images de production
services:
  postgres:
    image: postgres:16.4-alpine@sha256:DIGEST_EXACT
  redis:
    image: redis:7.4.1-alpine@sha256:DIGEST_EXACT
```

---

#### LOW-03 — Absence de validation des erreurs 4xx dans Sentry

| Attribut | Détail |
|----------|--------|
| **Sévérité** | 🟢 FAIBLE |

**Description**

Le filtre d'exceptions n'envoie les erreurs à Sentry que pour les 5xx. Les tentatives d'attaque répétées (401, 403, 429) ne sont pas tracées dans Sentry et peuvent passer inaperçues dans les alertes.

**Correction**

```typescript
// Envoyer les erreurs de sécurité (401, 403, 429) à Sentry avec un tag de sécurité
if (status >= 500 || status === 401 || status === 403 || status === 429) {
  Sentry.captureException(exception, {
    level: status >= 500 ? 'error' : 'warning',
    tags: { requestId: request.id, security: status < 500 },
  });
}
```

---

#### LOW-04 — IP du serveur de production exposée dans le dépôt

| Attribut | Détail |
|----------|--------|
| **Sévérité** | 🟢 FAIBLE |
| **Fichier concerné** | `docker-compose.prod.yml` |

**Description**

L'adresse IP de production `87.106.171.35` est visible en clair dans le dépôt Git, facilitant le ciblage direct du serveur.

**Correction**

```yaml
# Utiliser un nom de domaine ou une variable d'environnement
CORS_ORIGIN: ${PRODUCTION_URL}
APP_URL: ${PRODUCTION_URL}
```

---

## 5. Analyse OWASP Top 10

| # | Catégorie OWASP 2021 | Statut | Référence |
|---|----------------------|--------|-----------|
| A01 | Broken Access Control | 🔴 CRITIQUE | CRIT-02 (bypass 2FA), HIGH-06 (admin frontend) |
| A02 | Cryptographic Failures | 🔴 CRITIQUE | CRIT-01 (secrets exposés), CRIT-04 (pas HTTPS), MED-03 (TOTP en clair) |
| A03 | Injection | 🟢 BON | Prisma + paramétrage — pas d'injection SQL détectée |
| A04 | Insecure Design | 🟠 RISQUE | CRIT-02 (même secret JWT pour temp/access), HIGH-04 (pas de lockout) |
| A05 | Security Misconfiguration | 🔴 CRITIQUE | CRIT-01 (env.prod commité), HIGH-01 (webhook placeholder), CRIT-03 (hardcoded creds) |
| A06 | Vulnerable Components | 🟡 MOYEN | MED-04 (pas de scanning CI), voir §6 |
| A07 | Identification & Authentication Failures | 🟠 RISQUE | HIGH-02/03 (pas de throttling refresh/TOTP), HIGH-04 (pas de lockout) |
| A08 | Software & Data Integrity Failures | 🟡 MOYEN | LOW-02 (tags Docker flottants), MED-04 (pas de SAST) |
| A09 | Security Logging & Monitoring Failures | 🟡 MOYEN | LOW-03 (4xx non tracés Sentry), MED-02 (IP spoofable) |
| A10 | Server-Side Request Forgery (SSRF) | 🟢 BON | Aucune endpoint de proxy HTTP côté serveur identifiée |

---

## 6. Dépendances et composants

### Analyse des versions principales

| Package | Version actuelle | Statut | Notes |
|---------|-----------------|--------|-------|
| NestJS | 10.4.4 | ⚠️ Mise à jour disponible (11.x) | NestJS 11 apporte des corrections de sécurité |
| Prisma | 5.20.0 | ⚠️ Non latest (6.x) | Vérifier les changelogs de sécurité |
| Next.js | 15.0.x | ✅ Récent | |
| Stripe | 22.0.2 | ✅ Récent | |
| bcrypt | 6.0.0 | ✅ OK | 12 rounds configurés |
| Helmet | 7.1.0 | ✅ OK | |
| passport-jwt | 4.0.1 | ✅ OK | |
| sanitize-html | 2.17.3 | ✅ Récent | |
| class-validator | 0.14.1 | ⚠️ | Vérifier CVEs récentes |

### Recommandation

```bash
# Audit des dépendances
pnpm audit --audit-level=moderate

# Mise à jour sécurisée
pnpm update --recursive --latest  # Tester en env de développement d'abord

# Intégrer dans CI (cf. MED-04)
```

### Absence notable

- **`csrf` ou `csurf`** : Aucun middleware CSRF, bien que l'architecture JWT (Authorization header) réduise le risque pour les API JSON. L'endpoint `/auth/refresh` qui utilise exclusivement le cookie reste potentiellement vulnérable à une attaque CSRF ciblée.

---

## 7. Configuration Docker et CI/CD

### Docker

| Point d'audit | Statut | Note |
|---------------|--------|------|
| Build multi-stage | ✅ OK | Réduction de la surface d'attaque de l'image |
| Utilisateur non-root | ✅ OK | `app:app` configuré |
| Health checks | ✅ OK | Configurés sur tous les services |
| Secrets dans les layers | ⚠️ | `entrypoint.sh` contient des credentials (CRIT-03) |
| PostgreSQL loopback | ✅ OK | `127.0.0.1` uniquement en production |
| Redis avec mot de passe | ✅ OK | `REDIS_PASSWORD` configuré en production |
| Tags d'images flottants | ⚠️ | cf. LOW-02 |

### GitHub Actions

| Point d'audit | Statut | Note |
|---------------|--------|------|
| Secrets GitHub (SSH keys) | ✅ OK | Stockés dans GitHub Secrets |
| Actions épinglées (`@v4`) | ⚠️ | Utiliser des SHA de commit pour les actions tierces |
| Scanning de sécurité | ❌ | Absent — cf. MED-04 |
| `GITHUB_TOKEN` permissions | ⚠️ | Non restreintes explicitement |

**Correction — Épingler les actions GitHub**

```yaml
# Au lieu de
- uses: actions/checkout@v4
# Utiliser le SHA de commit
- uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683  # v4.2.2

# Restreindre les permissions du GITHUB_TOKEN
permissions:
  contents: read
  packages: write
  security-events: write
```

---

## 8. Plan de remédiation priorisé

### Phase 1 — Actions immédiates (24 heures)

> Ces actions sont requises avant toute mise en production

| Priorité | Action | Responsable | Effort |
|----------|--------|-------------|--------|
| 🔴 P0 | Révoquer TOUS les secrets exposés (CRIT-01) | DevOps / Sécurité | 2h |
| 🔴 P0 | Supprimer `.env.prod` de l'historique Git (CRIT-01) | Lead Dev | 1h |
| 🔴 P0 | Corriger le bypass 2FA (utiliser secret JWT distinct) (CRIT-02) | Backend Dev | 3h |
| 🔴 P0 | Configurer le vrai secret webhook Stripe (HIGH-01) | DevOps | 30m |
| 🔴 P0 | Remplacer la clé Stripe test par une clé live (HIGH-05) | DevOps | 30m |

### Phase 2 — Semaine 1

| Priorité | Action | Responsable | Effort |
|----------|--------|-------------|--------|
| 🟠 P1 | Mettre en place HTTPS avec reverse proxy (CRIT-04) | DevOps | 4h |
| 🟠 P1 | Remplacer les credentials hardcodés par des variables env (CRIT-03) | Backend Dev | 2h |
| 🟠 P1 | Ajouter throttling sur refresh et TOTP (HIGH-02, HIGH-03) | Backend Dev | 2h |
| 🟠 P1 | Implémenter verrouillage de compte (HIGH-04) | Backend Dev | 4h |
| 🟠 P1 | Corriger le middleware frontend admin (HIGH-06) | Frontend Dev | 3h |

### Phase 3 — Sprint suivant (2 semaines)

| Priorité | Action | Responsable | Effort |
|----------|--------|-------------|--------|
| 🟡 P2 | Tokens de reset dans path plutôt que query string (MED-01) | Backend + Frontend | 3h |
| 🟡 P2 | Configurer trust proxy et validation IP (MED-02) | Backend Dev | 1h |
| 🟡 P2 | Chiffrer les secrets TOTP en base (MED-03) | Backend Dev | 4h |
| 🟡 P2 | Intégrer pnpm audit + Trivy dans CI (MED-04) | DevOps | 2h |
| 🟡 P2 | Configurer CSP explicite (MED-05) | Backend + Frontend | 3h |
| 🟡 P2 | Valider le paramètre metric dans les métriques (MED-06) | Backend Dev | 1h |
| 🟡 P2 | Masquer le path dans les erreurs de production (MED-07) | Backend Dev | 30m |

### Phase 4 — Hardening (mois suivant)

| Priorité | Action | Responsable | Effort |
|----------|--------|-------------|--------|
| 🟢 P3 | `sameSite: 'strict'` et `path: /api/auth` pour le cookie (LOW-01) | Backend Dev | 1h |
| 🟢 P3 | Épingler les images Docker sur SHA (LOW-02) | DevOps | 2h |
| 🟢 P3 | Tracer les 401/403/429 dans Sentry (LOW-03) | Backend Dev | 1h |
| 🟢 P3 | Supprimer l'IP de production du code (LOW-04) | DevOps | 30m |
| 🟢 P3 | Épingler les actions GitHub sur SHA (CI/CD) | DevOps | 1h |
| 🟢 P3 | Mettre à jour les dépendances majeures (NestJS 11, Prisma 6) | Lead Dev | 8h |

---

## 9. Recommandations architecturales

### 9.1 Gestion des secrets

Adopter un gestionnaire de secrets tel que **HashiCorp Vault**, **AWS Secrets Manager**, ou **Doppler** à la place des fichiers `.env` en production. Ces outils permettent la rotation automatique des secrets, le contrôle d'accès granulaire et l'audit des accès.

```bash
# Exemple avec Doppler
doppler setup
doppler run -- node dist/main.js
```

### 9.2 Authentification JWT — Passer à RS256

L'algorithme symétrique HS256 nécessite de partager le secret entre le backend et tout service qui doit vérifier les tokens (y compris le middleware Edge Next.js). Passer à RS256 (asymétrique) permettrait au middleware Edge de vérifier les tokens avec la clé publique uniquement.

```typescript
// Configuration RS256
JwtModule.register({
  privateKey: fs.readFileSync('private.pem'),
  publicKey: fs.readFileSync('public.pem'),
  signOptions: { algorithm: 'RS256', expiresIn: '15m' },
  verifyOptions: { algorithms: ['RS256'] },
})
```

### 9.3 Séparation des tokens de courte et longue durée

Créer des secrets JWT distincts pour chaque usage :

| Token | Secret | Durée |
|-------|--------|-------|
| `accessToken` | `JWT_ACCESS_SECRET` | 15 min |
| `refreshToken` | `JWT_REFRESH_SECRET` | 7 jours |
| `tempToken` (2FA) | `JWT_TEMP_SECRET` | 5 min |
| `emailToken` | Hash SHA-256 (déjà OK) | 24h |

### 9.4 WAF et protection de l'API

Envisager la mise en place d'un Web Application Firewall (Cloudflare, AWS WAF) en amont de l'API pour :
- Bloquer les bots et scrapers automatisés
- Limiter les attaques DDoS
- Filtrer les patterns d'injection connus
- Géolocaliser les accès suspects

### 9.5 Revue de code sécurité

Mettre en place une politique de revue de sécurité pour les Pull Requests :
- Utiliser **CodeQL** (gratuit sur GitHub) pour l'analyse statique de sécurité
- Exiger une approbation explicite de sécurité pour les PR modifiant l'authentification, les paiements ou les routes admin
- Configurer **Dependabot** pour les mises à jour automatiques de dépendances

---

## 10. Conclusion

L'audit révèle une application dont les **fondations de sécurité sont globalement correctes** (validation des entrées, hachage bcrypt, rotation des tokens, audit log, 2FA TOTP) mais qui souffre de **vulnérabilités critiques dans la gestion des secrets et l'architecture d'authentification** qui en interdisent la mise en production immédiate.

### Récapitulatif des vulnérabilités

| Sévérité | Nombre | État |
|----------|--------|------|
| 🔴 CRITIQUE | 4 | Résolution requise avant toute mise en production |
| 🟠 HAUTE | 6 | Résolution requise sous 7 jours |
| 🟡 MOYENNE | 7 | Résolution dans le sprint suivant |
| 🟢 FAIBLE | 4 | Hardening continu |

### Actions prioritaires non négociables

1. **Révoquer immédiatement** tous les secrets compromis (base de données, JWT, Stripe, Cloudinary, Algolia, Resend)
2. **Corriger le bypass d'authentification 2FA** (séparer le secret du token temporaire)
3. **Purger l'historique Git** du fichier `.env.prod`
4. **Configurer HTTPS** avant toute exposition publique

Une fois la Phase 1 complétée, le score de sécurité devrait dépasser **65/100**, et la Phase 2 permettra d'atteindre le seuil d'acceptabilité de **75+/100** requis pour une application e-commerce en production.

---

*Rapport généré le 2026-05-07 — Révision annuelle recommandée ou après toute modification architecturale majeure.*
