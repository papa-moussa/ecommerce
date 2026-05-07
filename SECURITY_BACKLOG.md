# Backlog Sécurité — Maison Parfum E-Commerce

> **Source :** Rapport d'audit de sécurité du 2026-05-07  
> **Classification :** Confidentiel — Usage interne  
> **Responsable backlog :** Security Lead / RSSI  
> **Dernière mise à jour :** 2026-05-07 — Phase 1 (CRITIQUE) implémentée sur branche `security/phase-1-critical-fixes`  
> **Périmètre :** NestJS API + Next.js Frontend + Infrastructure Docker / CI-CD

---

## Table des matières

1. [État global de sécurité](#1-état-global-de-sécurité)
2. [Tableaux de bord et métriques](#2-tableaux-de-bord-et-métriques)
3. [Quick Wins sécurité](#3-quick-wins-sécurité)
4. [Backlog — Tickets critiques (P0)](#4-backlog--tickets-critiques-p0)
5. [Backlog — Tickets Haute priorité (P1)](#5-backlog--tickets-haute-priorité-p1)
6. [Backlog — Tickets Moyenne priorité (P2)](#6-backlog--tickets-moyenne-priorité-p2)
7. [Backlog — Tickets Faible priorité (P3)](#7-backlog--tickets-faible-priorité-p3)
8. [Backlog — Recommandations architecturales (P3+)](#8-backlog--recommandations-architecturales-p3)
9. [Roadmap de remédiation](#9-roadmap-de-remédiation)
10. [Indicateurs de pilotage sécurité](#10-indicateurs-de-pilotage-sécurité)

---

## 1. État global de sécurité

### Score par domaine (post-audit)

| Domaine | Score actuel | Score cible | Écart |
|---------|-------------|-------------|-------|
| Authentification & Autorisation | 35/100 | 85/100 | -50 |
| Gestion des secrets | 5/100 | 90/100 | -85 |
| Sécurité réseau & Transport | 20/100 | 90/100 | -70 |
| Validation & Injection | 75/100 | 90/100 | -15 |
| Logging & Monitoring | 65/100 | 80/100 | -15 |
| Gestion des dépendances | 50/100 | 80/100 | -30 |
| Configuration CI/CD | 45/100 | 80/100 | -35 |
| Sécurité Frontend | 60/100 | 85/100 | -25 |
| **SCORE GLOBAL** | **42/100** | **≥ 75/100** | **-33** |

> **Verdict :** Mise en production **BLOQUÉE**. Seuil minimal = 75/100.

### Résumé des vulnérabilités

| Sévérité | Nombre | Corrigées | Restantes | % Résolution |
|----------|--------|-----------|-----------|--------------|
| 🔴 CRITIQUE | 4 | 4 | 0 | **100%** ✅ |
| 🟠 HAUTE | 6 | 2 | 4 | 33% |
| 🟡 MOYENNE | 7 | 0 | 7 | 0% |
| 🟢 FAIBLE | 4 | 1 | 3 | 25% |
| **TOTAL** | **21** | **7** | **14** | **33%** |

---

## 2. Tableaux de bord et métriques

### Répartition par domaine technique

| Domaine | Critique | Haute | Moyenne | Faible | Total tickets |
|---------|----------|-------|---------|--------|---------------|
| Gestion des secrets | 2 | 1 | 0 | 0 | 3 |
| Authentification / Auth | 1 | 3 | 1 | 1 | 6 |
| Infrastructure / TLS | 1 | 0 | 0 | 1 | 2 |
| Paiements Stripe | 0 | 2 | 0 | 0 | 2 |
| Frontend / Middleware | 0 | 1 | 0 | 0 | 1 |
| API / Backend | 0 | 0 | 3 | 1 | 4 |
| CI/CD / DevOps | 0 | 0 | 1 | 2 | 3 |
| **TOTAL** | **4** | **6** | **7** | **4** | **21** |

### Répartition par effort estimé

| Effort | Tickets | Heures totales |
|--------|---------|----------------|
| < 1h (Quick Fix) | 7 | ~4h |
| 1–3h | 9 | ~18h |
| 4–8h | 4 | ~20h |
| > 8h | 1 | ~12h |
| **TOTAL** | **21** | **~54h** |

### Répartition OWASP Top 10

| Catégorie OWASP | Tickets associés | Sévérité max |
|-----------------|-----------------|--------------|
| A01 — Broken Access Control | SEC-002, SEC-006 | 🔴 CRITIQUE |
| A02 — Cryptographic Failures | SEC-001, SEC-004, SEC-013 | 🔴 CRITIQUE |
| A04 — Insecure Design | SEC-002, SEC-014 | 🔴 CRITIQUE |
| A05 — Security Misconfiguration | SEC-001, SEC-003, SEC-005 | 🔴 CRITIQUE |
| A06 — Vulnerable Components | SEC-020, SEC-025 | 🟡 MOYENNE |
| A07 — Auth Failures | SEC-007, SEC-008, SEC-009 | 🟠 HAUTE |
| A08 — Software Integrity | SEC-019, SEC-020 | 🟡 MOYENNE |
| A09 — Logging & Monitoring | SEC-012, SEC-018 | 🟡 MOYENNE |

---

## 3. Quick Wins sécurité

> Les tickets suivants ont un **ratio impact/effort maximal** et peuvent être résolus en moins de 2 heures chacun avec un impact sécurité immédiat.

| Ticket | Action | Effort | Impact |
|--------|--------|--------|--------|
| **SEC-005** | Configurer le vrai secret Stripe webhook | 30 min | Paiements fonctionnels |
| **SEC-010** | Remplacer clé Stripe test → live | 30 min | Revenus réels |
| **SEC-015** | Masquer le path dans les erreurs de production (1 ligne) | 30 min | Réduction info disclosure |
| **SEC-007** | Ajouter @Throttle sur POST /auth/refresh | 30 min | Blocage brute force refresh |
| **SEC-008** | Ajouter @Throttle sur les endpoints TOTP | 45 min | Protection 2FA brute force |
| **SEC-016** | Valider le paramètre `metric` dans l'admin API | 1h | Suppression vecteur injection log |
| **SEC-019** | Corriger sameSite/path du cookie refresh_token | 1h | Durcissement CSRF |

**Total Quick Wins : 7 tickets — ~5h30 — Impact sécurité : Haute**

---

## 4. Backlog — Tickets critiques (P0)

> **SLA de résolution : < 24 heures. Ces tickets bloquent tout déploiement en production.**

---

### SEC-001 — Révoquer et purger les secrets de production committés dans Git

| Champ | Détail |
|-------|--------|
| **ID** | SEC-001 |
| **Titre** | Révoquer tous les secrets exposés dans `.env.prod` et purger l'historique Git |
| **Criticité** | 🔴 CRITIQUE |
| **OWASP** | A02, A05 |
| **CWE** | CWE-312, CWE-798, CWE-540 |
| **CVSS v3** | 9.8 |
| **Composant** | Dépôt Git / Infrastructure |
| **Fichier(s)** | `.env.prod`, `.gitignore` |
| **Cause racine** | Le fichier `.env.prod` n'est pas exclu dans `.gitignore` (seuls `.env`, `.env.local`, `.env.*.local` sont ignorés). Il a été committé avec l'ensemble des secrets de production. |
| **Risque** | Compromission totale : base de données, sessions JWT, accès email (phishing), CDN images, index de recherche, paiements |
| **Impact métier** | Fuite de données clients, fraude financière, atteinte à la réputation, non-conformité RGPD |
| **Dépendances** | SEC-004 (HTTPS), SEC-010 (Stripe live) — régénérer les secrets avant de les réutiliser |
| **Effort estimé** | 3h (révocation : 1h, purge Git : 1h, mise à jour de l'environnement : 1h) |
| **Priorité** | P0 — Immédiat (< 24h) |
| **Responsable suggéré** | DevOps / Lead Dev / RSSI |
| **Statut** | ✅ CORRIGÉ — branche `security/phase-1-critical-fixes` (2026-05-07) |

**Implémentation réalisée**
- `.gitignore` mis à jour : `.env.*` exclu globalement (sauf `.env.example` et `.env.*.example`)
- `.env.prod` retiré de l'index Git (`git rm --cached`)
- `.doppler.yaml` créé pour la configuration Doppler (secrets manager choisi)
- `apps/api/.env.example` mis à jour avec toutes les variables requises dont `JWT_TEMP_SECRET`
- **⚠️ Action manuelle requise :** Rotation de tous les secrets exposés dans leurs dashboards respectifs (Stripe, Cloudinary, Algolia, Resend, PostgreSQL, Redis, JWT secrets)

**Description détaillée**

Le fichier `.env.prod` est committé dans le dépôt (statut git : `A .env.prod`). Il contient : `POSTGRES_PASSWORD`, `REDIS_PASSWORD`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `STRIPE_SECRET_KEY`, `RESEND_API_KEY`, `CLOUDINARY_API_SECRET`, `ALGOLIA_API_KEY`, `ALGOLIA_SEARCH_KEY`.

**Recommandation technique**

```bash
# Étape 1 — Révoquer immédiatement tous les secrets (chaque dashboard concerné)
# Stripe → Developers → API keys → Roll key
# Resend → API Keys → Delete + Create
# Cloudinary → Settings → Security → Rotate API Secret
# Algolia → API Keys → Regenerate
# PostgreSQL → ALTER USER ecom WITH PASSWORD 'NOUVEAU_MDP_FORT';
# Redis → CONFIG SET requirepass NOUVEAU_MDP_FORT
# JWT → Générer de nouveaux secrets aléatoires (>= 64 chars)
openssl rand -hex 64  # Exécuter 2x pour JWT_ACCESS_SECRET et JWT_REFRESH_SECRET

# Étape 2 — Supprimer le fichier de l'index Git
git rm --cached .env.prod
git rm --cached .env.prod.example

# Étape 3 — Mettre à jour .gitignore
echo ".env.prod" >> .gitignore
echo ".env.prod.example" >> .gitignore
echo ".env.*.prod" >> .gitignore

# Étape 4 — Purger l'historique (BFG Repo-Cleaner, plus sûr que filter-branch)
# Installer BFG : https://rtyley.github.io/bfg-repo-cleaner/
bfg --delete-files .env.prod
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Étape 5 — Force push (après accord de toute l'équipe)
git push origin --force --all
git push origin --force --tags

# Étape 6 — Prévention : installer gitleaks en pre-commit hook
curl -sSfL https://raw.githubusercontent.com/gitleaks/gitleaks/main/scripts/install.sh | sh
# Ajouter dans .husky/pre-commit
echo "gitleaks protect --staged" >> .husky/pre-commit
```

**Critères d'acceptation**

- [ ] Tous les secrets sont révoqués et régénérés dans leurs dashboards respectifs
- [ ] `git log --all --full-history -- .env.prod` ne retourne aucun commit
- [ ] `.gitignore` contient `.env.prod` et `.env.prod.example`
- [ ] `gitleaks detect --source . --verbose` ne détecte aucun secret
- [ ] Les nouveaux secrets sont déployés et l'application démarre correctement
- [ ] Un test de connexion réussit (login, paiement test) avec les nouveaux secrets
- [ ] Aucun accès non autorisé n'est détecté dans les logs des services tiers (Stripe, Algolia, Cloudinary)

---

### SEC-002 — Corriger le bypass d'authentification 2FA (token temporaire réutilisable comme access token)

| Champ | Détail |
|-------|--------|
| **ID** | SEC-002 |
| **Titre** | Séparer le secret JWT du token temporaire 2FA pour bloquer le contournement d'authentification |
| **Criticité** | 🔴 CRITIQUE |
| **OWASP** | A01, A04, A07 |
| **CWE** | CWE-287, CWE-303, CWE-290 |
| **CVSS v3** | 9.1 |
| **Composant** | Backend — Authentification |
| **Fichier(s)** | `apps/api/src/auth/totp.service.ts`, `apps/api/src/auth/strategies/jwt.strategy.ts`, `apps/api/src/config/env.validation.ts` |
| **Cause racine** | Le `tempToken` 2FA est signé avec `JWT_ACCESS_SECRET` (même secret que l'access token normal). La stratégie JWT ne vérifie pas le claim `twofa: true`. Tout token temporaire est donc accepté comme token d'accès plein sur toutes les routes, y compris `/admin/*`. |
| **Risque** | Un attaquant connaissant les credentials d'un admin peut obtenir un `tempToken` via `/api/auth/login`, puis l'utiliser comme Bearer token pour accéder à toutes les routes ADMIN sans valider son TOTP. |
| **Impact métier** | Compromission de l'interface d'administration, accès illégal aux données clients, manipulation de stocks et commandes |
| **Dépendances** | SEC-001 (les secrets JWT doivent être régénérés après la correction) |
| **Effort estimé** | 3h (implémentation : 2h, tests : 1h) |
| **Priorité** | P0 — Immédiat (< 24h) |
| **Responsable suggéré** | Backend Dev Senior |
| **Statut** | ✅ CORRIGÉ — branche `security/phase-1-critical-fixes` (2026-05-07) |

**Implémentation réalisée**
- `JWT_TEMP_SECRET` ajouté à `env.validation.ts` (min 32 chars, obligatoire au boot)
- `totp.service.ts` : `issueTempToken()`, `verifyLogin()`, `verifyTempToken()` utilisent `JWT_TEMP_SECRET`
- `jwt.strategy.ts` : `validate()` rejette explicitement tout token avec `twofa: true` (double filet de sécurité)

**Scénario d'exploitation**

```
1. POST /api/auth/login { email: "admin@...", password: "..." }
   → { requires2FA: true, tempToken: "eyJhbGciOiJIUzI1NiJ9..." }
2. GET /api/admin/users
   Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...  ← tempToken utilisé comme access token
   → HTTP 200 OK (liste des utilisateurs exposée — ADMIN bypass sans TOTP)
```

**Recommandation technique**

```typescript
// 1. Ajouter JWT_TEMP_SECRET dans env.validation.ts
JWT_TEMP_SECRET: z.string().min(32),

// 2. Modifier totp.service.ts — signer avec le secret distinct
issueTempToken(user: User): string {
  const payload: TempTokenPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    twofa: true,
  };
  return this.jwt.sign(payload, {
    secret: this.config.get('JWT_TEMP_SECRET', { infer: true }),
    expiresIn: TEMP_TOKEN_TTL_SECONDS,
  });
}

// 3. Modifier TotpService.verifyTempToken — utiliser JWT_TEMP_SECRET
private verifyTempToken(tempToken: string): TempTokenPayload {
  try {
    return this.jwt.verify<TempTokenPayload>(tempToken, {
      secret: this.config.get('JWT_TEMP_SECRET', { infer: true }),
    });
  } catch {
    throw new UnauthorizedException('Temp token invalide ou expiré.');
  }
}

// 4. Modifier TotpService.verifyLogin — idem
async verifyLogin(tempToken: string, code: string): Promise<AuthTokens> {
  let payload: TempTokenPayload;
  try {
    payload = this.jwt.verify<TempTokenPayload>(tempToken, {
      secret: this.config.get('JWT_TEMP_SECRET', { infer: true }),
    });
  } catch {
    throw new UnauthorizedException('Temp token invalide ou expiré.');
  }
  // ...
}
// Le JWT strategy utilise JWT_ACCESS_SECRET → un tempToken signé avec JWT_TEMP_SECRET
// sera automatiquement rejeté avec InvalidSignatureError
```

**Critères d'acceptation**

- [ ] `JWT_TEMP_SECRET` est ajouté à `env.validation.ts` avec contrainte `min(32)`
- [ ] `issueTempToken()` utilise `JWT_TEMP_SECRET` et non `JWT_ACCESS_SECRET`
- [ ] `verifyTempToken()` et `verifyLogin()` utilisent `JWT_TEMP_SECRET`
- [ ] Test : POST `/auth/login` admin → récupérer le `tempToken` → utiliser comme Bearer → doit retourner **401 Unauthorized**
- [ ] Test : Flux 2FA complet (login → TOTP → access token) fonctionne correctement
- [ ] Test : le `tempToken` expiré au bout de 5 minutes retourne 401
- [ ] Aucune régression sur les tests d'authentification existants

---

### SEC-003 — Remplacer les credentials administrateur hardcodés dans `entrypoint.sh`

| Champ | Détail |
|-------|--------|
| **ID** | SEC-003 |
| **Titre** | Externaliser les credentials admin du script `entrypoint.sh` vers des variables d'environnement |
| **Criticité** | 🔴 CRITIQUE |
| **OWASP** | A05, A02 |
| **CWE** | CWE-798, CWE-259 |
| **CVSS v3** | 8.8 |
| **Composant** | Infrastructure / Docker |
| **Fichier(s)** | `apps/api/entrypoint.sh`, `docker-compose.prod.yml` |
| **Cause racine** | Email (`pamodiallo@gmail.com`) et mot de passe (`passer123`) de l'administrateur sont hardcodés en clair dans le script shell versionné dans Git. |
| **Risque** | Tout développeur ou attaquant accédant au dépôt dispose des credentials admin. Le mot de passe est trivial (dictionnaire basique). |
| **Impact métier** | Accès illégal à l'interface d'administration, manipulation des données |
| **Dépendances** | SEC-001 (nettoyage Git) |
| **Effort estimé** | 2h |
| **Priorité** | P0 — Immédiat (< 48h) |
| **Responsable suggéré** | Backend Dev / DevOps |
| **Statut** | ✅ CORRIGÉ — branche `security/phase-1-critical-fixes` (2026-05-07) |

**Implémentation réalisée**
- `apps/api/entrypoint.sh` : `'passer123'` et `'pamodiallo@gmail.com'` remplacés par `process.env.ADMIN_PASSWORD` et `process.env.ADMIN_EMAIL`
- Si `ADMIN_EMAIL` ou `ADMIN_PASSWORD` non définis → warning, le boot continue sans erreur
- `docker-compose.prod.yml` : `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_FIRST_NAME`, `ADMIN_LAST_NAME` injectés depuis Doppler
- `grep -r "passer123\|pamodiallo" apps/` ne retourne aucun résultat ✅

**Recommandation technique**

```bash
# entrypoint.sh — remplacer les valeurs hardcodées
#!/bin/sh
set -e

echo "🔄 Running database migrations..."
prisma migrate deploy --schema=prisma/schema.prisma

echo "👤 Ensuring admin user exists..."
ADMIN_EMAIL="${ADMIN_EMAIL:-}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-}"

if [ -n "$ADMIN_EMAIL" ] && [ -n "$ADMIN_PASSWORD" ]; then
  node -e "
    const { PrismaClient } = require('@prisma/client');
    const bcrypt = require('bcrypt');
    async function seed() {
      const prisma = new PrismaClient();
      try {
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
      } catch (e) {
        await prisma.\$disconnect().catch(() => {});
        process.exit(0);
      }
    }
    seed();
  "
else
  echo "⚠️  ADMIN_EMAIL ou ADMIN_PASSWORD non défini — skipping seed admin."
fi

echo "🚀 Starting API..."
exec node dist/main.js
```

```yaml
# docker-compose.prod.yml
services:
  api:
    environment:
      ADMIN_EMAIL: ${ADMIN_EMAIL}
      ADMIN_PASSWORD: ${ADMIN_PASSWORD}
```

**Critères d'acceptation**

- [ ] `entrypoint.sh` ne contient aucune valeur d'email ou de mot de passe en dur
- [ ] `ADMIN_EMAIL` et `ADMIN_PASSWORD` sont lus exclusivement depuis les variables d'environnement
- [ ] Si les variables ne sont pas définies, le script démarre sans erreur (warning seulement)
- [ ] `grep -r "passer123\|pamodiallo" apps/api/entrypoint.sh` ne retourne aucun résultat
- [ ] Le conteneur démarre correctement avec les variables définies dans `.env.prod`
- [ ] Connexion admin vérifiée en post-déploiement

---

### SEC-004 — Mettre en place HTTPS via reverse proxy avec TLS en production

| Champ | Détail |
|-------|--------|
| **ID** | SEC-004 |
| **Titre** | Déployer un reverse proxy TLS (Caddy/Nginx) et activer HTTPS + HSTS en production |
| **Criticité** | 🔴 CRITIQUE |
| **OWASP** | A02, A05 |
| **CWE** | CWE-319, CWE-523 |
| **CVSS v3** | 8.1 |
| **Composant** | Infrastructure / Réseau |
| **Fichier(s)** | `docker-compose.prod.yml`, `apps/api/src/auth/auth.controller.ts`, `apps/api/src/main.ts` |
| **Cause racine** | L'application est exposée sur HTTP pur (`http://87.106.171.35:8088`). Le cookie `refresh_token` est transmis sans le flag `Secure`. Aucun HSTS configuré. |
| **Risque** | Interception MITM des tokens JWT, cookies de session, données personnelles, mots de passe transitant en clair. |
| **Impact métier** | Vol de sessions, usurpation d'identité, non-conformité PCI-DSS et RGPD |
| **Dépendances** | SEC-001 (secrets requis pour configurer les domaines) |
| **Effort estimé** | 4–6h |
| **Priorité** | P0 — Avant toute mise en production publique |
| **Responsable suggéré** | DevOps / SRE |
| **Statut** | ✅ CORRIGÉ — branche `security/phase-1-critical-fixes` (2026-05-07) |

**Implémentation réalisée**
- `Caddyfile` créé : TLS Let's Encrypt automatique, HTTP→HTTPS redirect, HSTS, security headers
- `docker-compose.prod.yml` refactorisé : Caddy comme seul service exposé sur 80/443, API et Web en `expose` uniquement (pas de `ports`)
- `COOKIE_SECURE: "true"` forcé en production (plus de risque d'oubli)
- Réseaux Docker séparés : `backend` (DB+Redis) et `frontend` (Caddy+API+Web)
- IPs hardcodées supprimées, tout passe par variables d'environnement (SEC-021 bonus ✅)
- **⚠️ Action manuelle requise :** Pointer le DNS du domaine vers le VPS, définir `DOMAIN=maisonparfum.com` en Doppler

**Recommandation technique**

```yaml
# docker-compose.prod.yml — Ajouter Caddy comme reverse proxy
services:
  caddy:
    image: caddy:2.8-alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    networks:
      - internal

  api:
    expose:
      - "3001"          # Ne plus exposer le port externalement
    environment:
      CORS_ORIGIN: ${PRODUCTION_URL}    # https://maisonparfum.com
      APP_URL: ${PRODUCTION_URL}
      COOKIE_SECURE: "true"
```

```
# Caddyfile
maisonparfum.com {
    reverse_proxy api:3001
    encode gzip zstd
    header {
        Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"
        X-Content-Type-Options nosniff
        X-Frame-Options SAMEORIGIN
        Referrer-Policy strict-origin-when-cross-origin
    }
    log {
        output file /var/log/caddy/access.log
    }
}
```

```typescript
// main.ts — Activer HSTS dans Helmet
app.use(
  helmet({
    hsts: { maxAge: 63072000, includeSubDomains: true, preload: true },
    contentSecurityPolicy: { /* cf. SEC-011 */ },
  }),
);
```

**Critères d'acceptation**

- [ ] L'application est accessible uniquement via HTTPS (HTTP redirige vers HTTPS — code 301)
- [ ] Le certificat TLS est valide et non auto-signé (Let's Encrypt ou équivalent)
- [ ] L'en-tête `Strict-Transport-Security` est présent avec `max-age=63072000`
- [ ] `curl -I http://maisonparfum.com` retourne `301 Moved Permanently` vers HTTPS
- [ ] Le cookie `refresh_token` porte le flag `Secure` dans les réponses de production
- [ ] Score SSL Labs ≥ A (https://www.ssllabs.com/ssltest/)
- [ ] La variable `COOKIE_SECURE` n'est pas définie à `false` en production

---

## 5. Backlog — Tickets Haute priorité (P1)

> **SLA de résolution : < 7 jours.**

---

### SEC-005 — Configurer le vrai secret Stripe Webhook (remplacer le placeholder)

| Champ | Détail |
|-------|--------|
| **ID** | SEC-005 |
| **Titre** | Remplacer `STRIPE_WEBHOOK_SECRET=whsec_placeholder_replace_me` par le secret réel |
| **Criticité** | 🟠 HAUTE |
| **OWASP** | A05 |
| **CWE** | CWE-345, CWE-294 |
| **Composant** | Paiements / Stripe |
| **Fichier(s)** | `.env.prod`, `apps/api/src/payments/stripe.service.ts` |
| **Cause racine** | La variable `STRIPE_WEBHOOK_SECRET` contient une valeur placeholder non fonctionnelle. `stripe.webhooks.constructEvent()` lève une exception pour tous les webhooks Stripe entrants. |
| **Risque** | Aucun webhook Stripe n'est traité. Les paiements confirmés ne passent jamais en statut `PAID`. |
| **Impact métier** | Perte de revenus directe, commandes bloquées, stocks non décrémentés, emails de confirmation non envoyés |
| **Dépendances** | SEC-001 (rotation des secrets), SEC-004 (HTTPS requis pour l'endpoint webhook Stripe) |
| **Effort estimé** | 30 min |
| **Priorité** | P1 — < 7 jours |
| **Responsable suggéré** | DevOps / Backend Dev |
| **Statut** | 🔴 OUVERT |

**Recommandation technique**

```bash
# 1. Dashboard Stripe → Developers → Webhooks → votre endpoint
# 2. Section "Signing secret" → Reveal → Copier la valeur (commence par whsec_)
# 3. Mettre à jour .env.prod (FICHIER NON COMMITÉ après SEC-001)
STRIPE_WEBHOOK_SECRET=whsec_VALEUR_REELLE_STRIPE

# 4. Tester avec la CLI Stripe
stripe listen --forward-to localhost:3001/api/payments/webhook
stripe trigger payment_intent.succeeded
# Vérifier que le statut de commande passe à PAID dans la base de données
```

**Critères d'acceptation**

- [ ] `STRIPE_WEBHOOK_SECRET` contient une valeur `whsec_` valide du dashboard Stripe
- [ ] Test Stripe CLI : `stripe trigger payment_intent.succeeded` → commande passe en `PAID`
- [ ] L'email de confirmation de commande est envoyé après paiement
- [ ] Le stock est décrémenté après paiement réussi
- [ ] Les webhooks `payment_intent.payment_failed` et `charge.refunded` sont également traités

---

### SEC-006 — Renforcer le middleware admin Next.js pour vérifier le rôle ADMIN

| Champ | Détail |
|-------|--------|
| **ID** | SEC-006 |
| **Titre** | Vérifier le rôle ADMIN dans le middleware Edge Next.js et non seulement la présence du cookie |
| **Criticité** | 🟠 HAUTE |
| **OWASP** | A01, A07 |
| **CWE** | CWE-284, CWE-862 |
| **Composant** | Frontend — Next.js Middleware |
| **Fichier(s)** | `apps/web/src/middleware.ts` |
| **Cause racine** | Le middleware vérifie uniquement la présence du cookie `refresh_token`, non le rôle de l'utilisateur. Tout utilisateur CLIENT authentifié peut accéder aux pages `/admin/*`. |
| **Risque** | Exposition de l'interface d'administration aux utilisateurs non autorisés |
| **Impact métier** | Fuite d'informations sensibles dans les composants React (listes utilisateurs, métriques) |
| **Dépendances** | SEC-002 (CRIT-02 — migration vers RS256 recommandée), SEC-004 (HTTPS) |
| **Effort estimé** | 3h (implémentation + tests Edge Runtime) |
| **Priorité** | P1 — < 7 jours |
| **Responsable suggéré** | Frontend Dev Senior |
| **Statut** | ✅ CORRIGÉ — branche `security/phase-1-critical-fixes` (2026-05-07) |

**Implémentation réalisée**
- Backend : `user_session` cookie JWT (signé avec `JWT_ACCESS_SECRET`, `{sub, role}`, 7 jours) émis à chaque login/refresh/2FA verify
- Backend : `jose` ajouté à `apps/web/package.json` (Edge Runtime compatible)
- `apps/web/src/middleware.ts` : `jwtVerify()` sur le cookie `user_session` + vérification `role === 'ADMIN'`
- Redirection vers `/` si authentifié non-ADMIN (et vers `/connexion` si non authentifié)

**Recommandation technique**

```typescript
// apps/web/src/middleware.ts
// Installer : pnpm add jose
import { jwtVerify } from 'jose';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ACCESS_TOKEN_KEY = 'access_token'; // adapter selon l'implémentation actuelle

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/setup-2fa')) {
    const accessToken = request.cookies.get(ACCESS_TOKEN_KEY)?.value
      || request.headers.get('authorization')?.replace('Bearer ', '');

    if (!accessToken) {
      const url = new URL('/connexion', request.url);
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    try {
      // Utiliser la clé publique RS256 (recommandé) ou JWT_ACCESS_SECRET en NEXT_PUBLIC
      // Option immédiate (HS256) — exposer le secret public côté Edge
      const secret = new TextEncoder().encode(
        process.env.JWT_VERIFICATION_SECRET, // Variable non préfixée NEXT_PUBLIC
      );
      const { payload } = await jwtVerify(accessToken, secret);

      if (payload.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/', request.url));
      }
    } catch {
      const url = new URL('/connexion', request.url);
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
  }

  if (pathname === '/recherche') {
    return NextResponse.redirect(new URL('/produits', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/recherche'],
};
```

> **Note architecturale :** Si le JWT utilise HS256, il faudra exposer `JWT_ACCESS_SECRET` côté Edge Runtime (sans préfixe `NEXT_PUBLIC_`). La migration vers RS256 (voir SEC-022) permettrait de n'exposer que la clé publique.

**Critères d'acceptation**

- [ ] Un utilisateur CLIENT authentifié (`role: CUSTOMER`) est redirigé vers `/` lors de l'accès à `/admin/*`
- [ ] Un utilisateur non authentifié est redirigé vers `/connexion`
- [ ] Un administrateur authentifié accède normalement aux pages admin
- [ ] Test : connexion CUSTOMER → navigation manuelle vers `/admin/dashboard` → redirection confirmée
- [ ] Aucune régression sur les autres routes protégées

---

### SEC-007 — Ajouter le rate limiting sur l'endpoint de refresh de token

| Champ | Détail |
|-------|--------|
| **ID** | SEC-007 |
| **Titre** | Appliquer `@Throttle` sur `POST /api/auth/refresh` pour limiter la génération de tokens |
| **Criticité** | 🟠 HAUTE |
| **OWASP** | A07 |
| **CWE** | CWE-307, CWE-799 |
| **Composant** | Backend — Authentification |
| **Fichier(s)** | `apps/api/src/auth/auth.controller.ts` |
| **Cause racine** | Absence du décorateur `@Throttle` sur l'endpoint `POST /auth/refresh`. Seul le throttler global (60 req/60s) s'applique. |
| **Risque** | Un attaquant avec un cookie `refresh_token` volé peut générer des access tokens en continu sans limitation |
| **Impact métier** | Accès persistant non autorisé même après rotation manuelle des secrets JWT |
| **Dépendances** | Aucune |
| **Effort estimé** | 30 min |
| **Priorité** | P1 — < 7 jours (Quick Win) |
| **Responsable suggéré** | Backend Dev |
| **Statut** | ✅ CORRIGÉ — branche `security/phase-1-critical-fixes` (2026-05-07) |

**Implémentation réalisée**
- `@Throttle({ default: { ttl: 60_000, limit: 10 } })` ajouté sur `POST /auth/refresh`

**Recommandation technique**

```typescript
// apps/api/src/auth/auth.controller.ts
@Public()
@Throttle({ default: { ttl: 60_000, limit: 10 } })  // ← Ajouter cette ligne
@Post('refresh')
@HttpCode(HttpStatus.OK)
async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
  // ...
}
```

**Critères d'acceptation**

- [ ] Le décorateur `@Throttle({ default: { ttl: 60_000, limit: 10 } })` est appliqué sur `POST /auth/refresh`
- [ ] Test : 11 appels successifs à `/auth/refresh` → le 11e retourne HTTP 429 avec en-tête `Retry-After`
- [ ] Le throttling est bien stocké dans Redis (vérifiable via `KEYS throttle:*`)
- [ ] Aucune régression sur le comportement normal de refresh (rotation du cookie)

---

### SEC-008 — Ajouter le rate limiting sur les endpoints de vérification TOTP

| Champ | Détail |
|-------|--------|
| **ID** | SEC-008 |
| **Titre** | Protéger les endpoints 2FA (`/2fa/verify`, `/2fa/setup-init`, `/2fa/finish-setup`) contre le brute force |
| **Criticité** | 🟠 HAUTE |
| **OWASP** | A07 |
| **CWE** | CWE-307 |
| **Composant** | Backend — Authentification 2FA |
| **Fichier(s)** | `apps/api/src/auth/auth.controller.ts` |
| **Cause racine** | Les endpoints TOTP sont publics (`@Public()`) et sans throttling individuel. L'espace de codes est de 1 000 000 valeurs (6 chiffres). |
| **Risque** | Brute force du code TOTP sur 90 secondes effectives (fenêtre ± 1 période) |
| **Impact métier** | Contournement du 2FA administrateur |
| **Dépendances** | SEC-002 (fix du bypass 2FA) |
| **Effort estimé** | 45 min |
| **Priorité** | P1 — < 7 jours (Quick Win) |
| **Responsable suggéré** | Backend Dev |
| **Statut** | ✅ CORRIGÉ — branche `security/phase-1-critical-fixes` (2026-05-07) |

**Implémentation réalisée**
- `@Throttle({ default: { ttl: 60_000, limit: 5 } })` ajouté sur `POST /auth/2fa/verify`, `POST /auth/2fa/setup-init`, `POST /auth/2fa/finish-setup`

**Recommandation technique**

```typescript
@Public()
@Throttle({ default: { ttl: 60_000, limit: 5 } })
@Post('2fa/verify')
@HttpCode(HttpStatus.OK)
twoFaVerify(@Body() dto: TotpLoginDto, ...) { ... }

@Public()
@Throttle({ default: { ttl: 60_000, limit: 3 } })
@Post('2fa/setup-init')
@HttpCode(HttpStatus.OK)
twoFaSetupInit(@Body() body: { tempToken: string }) { ... }

@Public()
@Throttle({ default: { ttl: 60_000, limit: 3 } })
@Post('2fa/finish-setup')
@HttpCode(HttpStatus.OK)
async twoFaFinishSetup(@Body() body: { tempToken: string; code: string }, ...) { ... }
```

**Critères d'acceptation**

- [ ] 6 tentatives de vérification TOTP en 60s → HTTP 429 sur la 6e
- [ ] 4 tentatives de setup-init en 60s → HTTP 429 sur la 4e
- [ ] L'en-tête `Retry-After` est présent dans les réponses 429
- [ ] Le throttling est par IP (stocké dans Redis)
- [ ] Aucune régression sur l'authentification 2FA normale

---

### SEC-009 — Implémenter le verrouillage de compte après échecs de connexion répétés

| Champ | Détail |
|-------|--------|
| **ID** | SEC-009 |
| **Titre** | Bloquer temporairement un compte après 5 tentatives de connexion échouées |
| **Criticité** | 🟠 HAUTE |
| **OWASP** | A07 |
| **CWE** | CWE-307 |
| **Composant** | Backend — Authentification |
| **Fichier(s)** | `apps/api/src/auth/auth.service.ts` |
| **Cause racine** | Le rate limiting de login est par IP, non par compte. Un botnet distribué peut effectuer des tentatives illimitées sur un compte cible. |
| **Risque** | Attaque par dictionnaire ou credential stuffing sur les comptes utilisateurs |
| **Impact métier** | Compromission de comptes clients, fraude, vol de données |
| **Dépendances** | Redis disponible (déjà configuré dans le projet) |
| **Effort estimé** | 4h |
| **Priorité** | P1 — < 7 jours |
| **Responsable suggéré** | Backend Dev Senior |
| **Statut** | 🔴 OUVERT |

**Recommandation technique**

```typescript
// apps/api/src/auth/auth.service.ts
private readonly MAX_LOGIN_ATTEMPTS = 5;
private readonly LOCKOUT_TTL_SECONDS = 900; // 15 minutes

async login(dto: LoginDto) {
  // Vérification du verrouillage avant lookup utilisateur
  const lockKey = `lockout:${dto.email.toLowerCase()}`;
  const attemptsKey = `login_attempts:${dto.email.toLowerCase()}`;
  
  const [isLocked, attempts] = await Promise.all([
    this.redis.exists(lockKey),
    this.redis.get(attemptsKey),
  ]);
  
  if (isLocked) {
    const ttl = await this.redis.ttl(lockKey);
    throw new UnauthorizedException(
      `Compte temporairement verrouillé. Réessayez dans ${Math.ceil(ttl / 60)} minute(s).`
    );
  }

  const user = await this.usersService.findByEmail(dto.email);
  const valid = user ? await bcrypt.compare(dto.password, user.passwordHash) : false;
  
  if (!valid || !user) {
    const currentAttempts = parseInt(attempts ?? '0') + 1;
    
    if (currentAttempts >= this.MAX_LOGIN_ATTEMPTS) {
      // Verrouiller le compte
      await Promise.all([
        this.redis.set(lockKey, '1', 'EX', this.LOCKOUT_TTL_SECONDS),
        this.redis.del(attemptsKey),
      ]);
      throw new UnauthorizedException(
        'Trop de tentatives. Compte verrouillé pour 15 minutes.'
      );
    }
    
    await this.redis.set(attemptsKey, currentAttempts.toString(), 'EX', this.LOCKOUT_TTL_SECONDS);
    throw new UnauthorizedException('Invalid credentials');
  }
  
  // Succès : réinitialiser le compteur
  await this.redis.del(attemptsKey);
  // ...suite du login normal
}
```

**Critères d'acceptation**

- [ ] Après 5 échecs de connexion, le compte est verrouillé pour 15 minutes
- [ ] Le message d'erreur indique le délai restant mais ne confirme pas l'existence du compte
- [ ] Après le délai de 15 min, la connexion est à nouveau possible
- [ ] Une connexion réussie réinitialise le compteur d'échecs
- [ ] Le verrouillage s'applique par email (pas par IP)
- [ ] Test de charge : 1000 tentatives distribuées sur 50 IPs différentes → le compte est verrouillé après 5 échecs

---

### SEC-010 — Remplacer les clés Stripe de test par les clés de production live

| Champ | Détail |
|-------|--------|
| **ID** | SEC-010 |
| **Titre** | Configurer les clés Stripe live (`sk_live_*`) en remplacement des clés test dans `.env.prod` |
| **Criticité** | 🟠 HAUTE |
| **OWASP** | A05 |
| **CWE** | CWE-276 |
| **Composant** | Paiements / Configuration |
| **Fichier(s)** | `.env.prod` (après nettoyage SEC-001) |
| **Cause racine** | La clé `STRIPE_SECRET_KEY=sk_test_51TOIax8yj...` en production est une clé de test Stripe. Les paiements en mode test ne génèrent pas de transactions réelles. |
| **Risque** | Aucun revenu réel généré en production, ou paiements rejetés |
| **Impact métier** | Perte de chiffre d'affaires totale, SLA de livraison non tenus |
| **Dépendances** | SEC-001 (rotation des clés Stripe exposées) |
| **Effort estimé** | 30 min |
| **Priorité** | P1 — < 7 jours (Quick Win) |
| **Responsable suggéré** | DevOps / CTO |
| **Statut** | 🔴 OUVERT |

**Recommandation technique**

```bash
# .env.prod (non commité — voir SEC-001)
STRIPE_SECRET_KEY=sk_live_VOTRE_CLE_SECRET_LIVE
STRIPE_WEBHOOK_SECRET=whsec_VOTRE_SECRET_WEBHOOK_LIVE

# .env.prod (frontend build args) si applicable
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_VOTRE_CLE_PUBLIQUE_LIVE
```

**Critères d'acceptation**

- [ ] `STRIPE_SECRET_KEY` commence par `sk_live_` dans l'environnement de production
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` commence par `pk_live_`
- [ ] Test paiement : une transaction de test avec une carte Stripe live réussit
- [ ] Le dashboard Stripe live affiche les transactions de test en mode live
- [ ] Les clés test (`sk_test_*`) sont révoquées depuis le dashboard Stripe

---

## 6. Backlog — Tickets Moyenne priorité (P2)

> **SLA de résolution : Sprint suivant (2 semaines).**

---

### SEC-011 — Configurer une Content Security Policy (CSP) explicite

| Champ | Détail |
|-------|--------|
| **ID** | SEC-011 |
| **Titre** | Remplacer la CSP par défaut de Helmet par une politique restrictive adaptée aux services tiers |
| **Criticité** | 🟡 MOYENNE |
| **OWASP** | A05 |
| **CWE** | CWE-693 |
| **Composant** | Backend — Configuration Helmet |
| **Fichier(s)** | `apps/api/src/main.ts` |
| **Cause racine** | `helmet()` est appelé sans configuration explicite. La CSP générée est générique et n'autorise pas les sources tierces (Stripe, Cloudinary, Algolia, Sentry). |
| **Risque** | Absence de protection XSS efficace, possibilité de chargement de scripts malveillants |
| **Impact métier** | Vecteur d'attaque XSS exploitable |
| **Dépendances** | SEC-004 (HTTPS requis pour CSP stricte) |
| **Effort estimé** | 3h (configuration + tests de régression frontend) |
| **Priorité** | P2 — Sprint suivant |
| **Responsable suggéré** | Backend Dev / Frontend Dev |
| **Statut** | 🔴 OUVERT |

**Recommandation technique**

```typescript
// apps/api/src/main.ts
const algoliaAppId = config.get('ALGOLIA_APP_ID', { infer: true });

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", 'https://js.stripe.com'],
        scriptSrcElem: ["'self'", 'https://js.stripe.com'],
        frameSrc: ["'self'", 'https://js.stripe.com'],
        connectSrc: [
          "'self'",
          'https://api.stripe.com',
          `https://${algoliaAppId}-dsn.algolia.net`,
          `https://${algoliaAppId}.algolia.net`,
          'https://o*.ingest.sentry.io',
          'https://res.cloudinary.com',
          'https://api.cloudinary.com',
        ],
        imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com', 'https://stripe.com'],
        styleSrc: ["'self'", "'unsafe-inline'"],
        fontSrc: ["'self'", 'data:'],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
    hsts: { maxAge: 63072000, includeSubDomains: true, preload: true },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  }),
);
```

**Critères d'acceptation**

- [ ] L'en-tête `Content-Security-Policy` est présent sur toutes les réponses HTTP
- [ ] Le paiement Stripe fonctionne (le chargement de `js.stripe.com` est autorisé)
- [ ] Les images Cloudinary s'affichent correctement
- [ ] La recherche Algolia fonctionne (connexions vers `*.algolia.net` autorisées)
- [ ] Sentry envoie correctement les erreurs
- [ ] Vérification dans la console navigateur : aucune erreur CSP en production
- [ ] Test avec [CSP Evaluator](https://csp-evaluator.withgoogle.com/) : score ≥ B

---

### SEC-012 — Corriger la récupération de l'IP client (trust proxy + X-Forwarded-For)

| Champ | Détail |
|-------|--------|
| **ID** | SEC-012 |
| **Titre** | Configurer `trust proxy` dans Express et utiliser `req.ip` pour l'IP client |
| **Criticité** | 🟡 MOYENNE |
| **OWASP** | A09 |
| **CWE** | CWE-346, CWE-807 |
| **Composant** | Backend — Audit Log / Rate Limiting |
| **Fichier(s)** | `apps/api/src/main.ts`, `apps/api/src/common/interceptors/audit-log.interceptor.ts` |
| **Cause racine** | `X-Forwarded-For` est lu sans validation. Sans `trust proxy`, n'importe quel client peut forger cet en-tête. Le rate limiter Throttler est également susceptible d'utiliser cette valeur. |
| **Risque** | IP spoofing dans les logs d'audit et contournement du rate limiting par IP |
| **Impact métier** | Logs d'audit falsifiés, brute force non détecté |
| **Dépendances** | SEC-004 (HTTPS + reverse proxy Caddy/Nginx en amont) |
| **Effort estimé** | 1h |
| **Priorité** | P2 — Sprint suivant (Quick Win) |
| **Responsable suggéré** | Backend Dev |
| **Statut** | 🔴 OUVERT |

**Recommandation technique**

```typescript
// apps/api/src/main.ts — après NestFactory.create()
const expressApp = app.getHttpAdapter().getInstance();
expressApp.set('trust proxy', 1); // 1 = faire confiance au premier proxy (Caddy/Nginx)

// apps/api/src/common/interceptors/audit-log.interceptor.ts
// Remplacer
const ip = (req.headers['x-forwarded-for'] as string | undefined) ?? req.socket.remoteAddress;
// Par
const ip = req.ip ?? req.socket.remoteAddress;
```

**Critères d'acceptation**

- [ ] `app.getHttpAdapter().getInstance().get('trust proxy')` retourne `1`
- [ ] L'audit log enregistre l'IP réelle du client (non forgeble) derrière le proxy
- [ ] Test : envoi d'un header `X-Forwarded-For: 1.2.3.4` directement au container → l'IP enregistrée est l'IP du proxy, non `1.2.3.4`
- [ ] Le rate limiter fonctionne correctement avec les vraies IPs client

---

### SEC-013 — Chiffrer les secrets TOTP stockés en base de données

| Champ | Détail |
|-------|--------|
| **ID** | SEC-013 |
| **Titre** | Chiffrer `User.totpSecret` avec AES-256-GCM avant stockage en base de données |
| **Criticité** | 🟡 MOYENNE |
| **OWASP** | A02 |
| **CWE** | CWE-312 |
| **Composant** | Backend — Authentification 2FA / Base de données |
| **Fichier(s)** | `apps/api/src/auth/totp.service.ts`, `apps/api/prisma/schema.prisma` |
| **Cause racine** | `User.totpSecret` est stocké en clair (base32) dans PostgreSQL. Une compromission de la base permet de cloner tous les authenticateurs TOTP. |
| **Risque** | Compromission de l'ensemble du second facteur d'authentification de tous les administrateurs |
| **Impact métier** | Perte de la protection 2FA, accès admin possible sans dispositif physique |
| **Dépendances** | Migration de base de données requise (tous les secrets existants devront être re-chiffrés) |
| **Effort estimé** | 4h (implémentation + migration) |
| **Priorité** | P2 — Sprint suivant |
| **Responsable suggéré** | Backend Dev Senior |
| **Statut** | 🔴 OUVERT |

**Recommandation technique**

```typescript
// apps/api/src/auth/totp.service.ts
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

private encryptSecret(plaintext: string): string {
  const key = Buffer.from(this.config.get('APP_ENCRYPTION_KEY', { infer: true }), 'hex');
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${encrypted.toString('hex')}:${tag.toString('hex')}`;
}

private decryptSecret(ciphertext: string): string {
  const key = Buffer.from(this.config.get('APP_ENCRYPTION_KEY', { infer: true }), 'hex');
  const [ivHex, encHex, tagHex] = ciphertext.split(':');
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  return decipher.update(Buffer.from(encHex, 'hex')).toString('utf8') + decipher.final('utf8');
}

// Dans setup() : stocker le secret chiffré
await prisma.user.update({
  where: { id: userId },
  data: { totpSecret: this.encryptSecret(totp.secret.base32), totpEnabled: false },
});

// Dans isCodeValid() : déchiffrer avant usage
isCodeValid(encryptedSecret: string, code: string): boolean {
  const secret = this.decryptSecret(encryptedSecret);
  const totp = new TOTP({ secret: Secret.fromBase32(secret), digits: 6, period: 30 });
  return totp.validate({ token: code, window: 1 }) !== null;
}
```

```bash
# Ajouter dans env.validation.ts
APP_ENCRYPTION_KEY: z.string().length(64), // 32 bytes en hex = 64 chars

# Générer la clé
openssl rand -hex 32
```

**Critères d'acceptation**

- [ ] `APP_ENCRYPTION_KEY` est ajouté à l'environnement (64 chars hex)
- [ ] `User.totpSecret` contient une valeur chiffrée (`iv:encrypted:tag`) et non la base32 en clair
- [ ] Migration des secrets existants : un script de migration chiffre les secrets déjà en base
- [ ] L'authentification TOTP fonctionne correctement (déchiffrement transparent)
- [ ] `SELECT "totpSecret" FROM "User" WHERE "totpEnabled" = true;` → aucune valeur lisible en base32 pur

---

### SEC-014 — Intégrer le scanning de vulnérabilités dans le pipeline CI/CD

| Champ | Détail |
|-------|--------|
| **ID** | SEC-014 |
| **Titre** | Ajouter `pnpm audit`, Trivy et CodeQL au pipeline GitHub Actions |
| **Criticité** | 🟡 MOYENNE |
| **OWASP** | A06, A08 |
| **CWE** | CWE-1035 |
| **Composant** | CI/CD — GitHub Actions |
| **Fichier(s)** | `.github/workflows/ci.yml` |
| **Cause racine** | Aucune étape de sécurité dans le pipeline CI. Les dépendances vulnérables et les failles de code passent inaperçues. |
| **Risque** | Introduction silencieuse de CVEs critiques via les dépendances npm |
| **Impact métier** | Risque d'exploitation de failles connues non détectées |
| **Dépendances** | Aucune |
| **Effort estimé** | 2h |
| **Priorité** | P2 — Sprint suivant |
| **Responsable suggéré** | DevOps / Lead Dev |
| **Statut** | 🔴 OUVERT |

**Recommandation technique**

```yaml
# .github/workflows/ci.yml — nouveau job à ajouter
  security:
    name: Security Scanning
    runs-on: ubuntu-latest
    permissions:
      security-events: write
      contents: read
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: ${{ env.PNPM_VERSION }}

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Audit npm dependencies
        run: pnpm audit --audit-level=high
        continue-on-error: false

      - name: Run Trivy (filesystem scan)
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'
          severity: 'CRITICAL,HIGH'

      - name: Upload Trivy results to GitHub Security
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: 'trivy-results.sarif'
```

```yaml
# .github/workflows/codeql.yml — nouveau workflow SAST
name: CodeQL Analysis
on:
  push:
    branches: [main]
  schedule:
    - cron: '0 6 * * 1'  # Hebdomadaire le lundi
jobs:
  analyze:
    name: Analyze
    runs-on: ubuntu-latest
    permissions:
      actions: read
      contents: read
      security-events: write
    strategy:
      matrix:
        language: ['javascript', 'typescript']
    steps:
      - uses: actions/checkout@v4
      - uses: github/codeql-action/init@v3
        with:
          languages: ${{ matrix.language }}
      - uses: github/codeql-action/autobuild@v3
      - uses: github/codeql-action/analyze@v3
```

**Critères d'acceptation**

- [ ] `pnpm audit --audit-level=high` passe sans erreur (ou les CVEs sont documentées et acceptées)
- [ ] Trivy scan ne détecte aucune CVE CRITICAL/HIGH non corrigée dans les dépendances
- [ ] Le job `security` est requis pour les merges sur `main` (branch protection)
- [ ] Les résultats Trivy et CodeQL apparaissent dans l'onglet Security → Code Scanning de GitHub
- [ ] Dependabot est activé pour les mises à jour automatiques de dépendances

---

### SEC-015 — Masquer le chemin API dans les réponses d'erreur en production

| Champ | Détail |
|-------|--------|
| **ID** | SEC-015 |
| **Titre** | Supprimer le champ `path` des réponses d'erreur en environnement de production |
| **Criticité** | 🟡 MOYENNE |
| **OWASP** | A05 |
| **CWE** | CWE-209 |
| **Composant** | Backend — Exception Filter |
| **Fichier(s)** | `apps/api/src/common/filters/http-exception.filter.ts` |
| **Cause racine** | Le filtre d'exceptions inclut `path: request.url` dans toutes les réponses d'erreur, révélant la structure des routes API. |
| **Risque** | Reconnaissance facilitée pour un attaquant (cartographie des routes admin, paiements, etc.) |
| **Impact métier** | Facilitation de la phase de reconnaissance lors d'une attaque ciblée |
| **Dépendances** | Aucune |
| **Effort estimé** | 30 min (Quick Win) |
| **Priorité** | P2 — Sprint suivant |
| **Responsable suggéré** | Backend Dev |
| **Statut** | 🔴 OUVERT |

**Recommandation technique**

```typescript
// apps/api/src/common/filters/http-exception.filter.ts
const isDev = process.env['NODE_ENV'] !== 'production';

const body: ErrorResponse = {
  statusCode: status,
  message,
  ...(error && { error }),
  timestamp: new Date().toISOString(),
  ...(isDev && { path: request.url }),   // Masqué en production
  requestId: request.id,
};
```

**Critères d'acceptation**

- [ ] En production (`NODE_ENV=production`) : les réponses d'erreur ne contiennent pas le champ `path`
- [ ] En développement : le champ `path` est toujours présent (non-régression DX)
- [ ] Test : `curl -X GET https://api.prod/api/admin/non-existant` → pas de `path` dans la réponse JSON
- [ ] Le `requestId` est toujours présent pour faciliter la corrélation des logs

---

### SEC-016 — Valider le paramètre `metric` dans les métriques admin

| Champ | Détail |
|-------|--------|
| **ID** | SEC-016 |
| **Titre** | Ajouter une validation stricte du paramètre `metric` dans l'endpoint `/admin/metrics/timeseries` |
| **Criticité** | 🟡 MOYENNE |
| **OWASP** | A03, A05 |
| **CWE** | CWE-20 |
| **Composant** | Backend — Admin API |
| **Fichier(s)** | `apps/api/src/admin/admin.service.ts`, `apps/api/src/admin/admin.controller.ts` |
| **Cause racine** | Le paramètre `metric: string` est accepté sans validation, permettant l'injection de valeurs arbitraires. |
| **Risque** | Injection dans les logs applicatifs, comportement inattendu, surface d'attaque élargie |
| **Impact métier** | Faux positifs dans les métriques, injection dans les outils de log analytics |
| **Dépendances** | Aucune |
| **Effort estimé** | 1h (Quick Win) |
| **Priorité** | P2 — Sprint suivant |
| **Responsable suggéré** | Backend Dev |
| **Statut** | 🔴 OUVERT |

**Recommandation technique**

```typescript
// apps/api/src/admin/admin.service.ts
type MetricType = 'revenue' | 'orders';

async getMetricsTimeseries(metric: MetricType, period: '7d' | '30d' | '90d') {
  const VALID_METRICS: MetricType[] = ['revenue', 'orders'];
  if (!VALID_METRICS.includes(metric)) {
    throw new BadRequestException(`Métrique invalide. Valeurs autorisées : ${VALID_METRICS.join(', ')}`);
  }
  // ...
}

// apps/api/src/admin/admin.controller.ts — ajouter validation au niveau Query
@Get('metrics/timeseries')
getTimeseries(
  @Query('metric') metric: 'revenue' | 'orders',
  @Query('period') period: '7d' | '30d' | '90d',
) {
  if (!['revenue', 'orders'].includes(metric)) {
    throw new BadRequestException('Métrique invalide');
  }
  if (!['7d', '30d', '90d'].includes(period)) {
    throw new BadRequestException('Période invalide');
  }
  return this.adminService.getMetricsTimeseries(metric, period);
}
```

**Critères d'acceptation**

- [ ] `GET /admin/metrics/timeseries?metric=INVALID&period=7d` → HTTP 400 avec message explicite
- [ ] Seules les valeurs `revenue` et `orders` sont acceptées pour `metric`
- [ ] Seules les valeurs `7d`, `30d`, `90d` sont acceptées pour `period`
- [ ] Les valeurs valides continuent de fonctionner normalement

---

### SEC-017 — Migrer les tokens de reset vers des path segments (non query string)

| Champ | Détail |
|-------|--------|
| **ID** | SEC-017 |
| **Titre** | Déplacer les tokens de reset mot de passe et vérification email du query string vers le path de l'URL |
| **Criticité** | 🟡 MOYENNE |
| **OWASP** | A02 |
| **CWE** | CWE-598, CWE-200 |
| **Composant** | Backend — Auth Service / Frontend — Pages |
| **Fichier(s)** | `apps/api/src/auth/auth.service.ts`, `apps/web/src/app/reset-password/page.tsx`, `apps/web/src/app/verify-email/page.tsx` |
| **Cause racine** | Les tokens sont transmis en query string (`?token=...`) et apparaissent dans les logs serveur, l'historique du navigateur, et les en-têtes Referer. |
| **Risque** | Fuite de tokens valides via les logs d'accès ou les outils analytics |
| **Impact métier** | Usurpation de réinitialisation de mot de passe si un token est intercepté dans les logs |
| **Dépendances** | Changement coordonné backend + frontend |
| **Effort estimé** | 3h |
| **Priorité** | P2 — Sprint suivant |
| **Responsable suggéré** | Backend Dev + Frontend Dev |
| **Statut** | 🔴 OUVERT |

**Recommandation technique**

```typescript
// apps/api/src/auth/auth.service.ts
// Avant :
const resetUrl = `${APP_URL}/reset-password?token=${rawToken}`;
// Après :
const resetUrl = `${APP_URL}/reset-password/${rawToken}`;

// Avant :
const verifyUrl = `${APP_URL}/verify-email?token=${token}`;
// Après :
const verifyUrl = `${APP_URL}/verify-email/${token}`;
```

```
# apps/web/src/app — renommer les routes
reset-password/page.tsx     → reset-password/[token]/page.tsx
verify-email/page.tsx       → verify-email/[token]/page.tsx
```

```typescript
// apps/web/src/app/reset-password/[token]/page.tsx
export default function ResetPasswordPage({ params }: { params: { token: string } }) {
  // Utiliser params.token au lieu de searchParams.token
}
```

**Critères d'acceptation**

- [ ] L'email de reset contient une URL de la forme `/reset-password/TOKEN` (sans `?token=`)
- [ ] L'email de vérification contient une URL de la forme `/verify-email/TOKEN`
- [ ] Les logs d'accès Caddy/Nginx ne contiennent pas les valeurs de tokens
- [ ] La réinitialisation de mot de passe fonctionne correctement avec la nouvelle URL
- [ ] La vérification d'email fonctionne correctement avec la nouvelle URL
- [ ] Les anciennes URLs (`?token=`) ne sont plus servies (ou redirigées avec 410 Gone)

---

## 7. Backlog — Tickets Faible priorité (P3)

> **SLA de résolution : Mois suivant (hardening continu).**

---

### SEC-018 — Tracer les erreurs de sécurité (401/403/429) dans Sentry

| Champ | Détail |
|-------|--------|
| **ID** | SEC-018 |
| **Titre** | Envoyer les erreurs HTTP 401, 403 et 429 à Sentry avec le tag `security: true` |
| **Criticité** | 🟢 FAIBLE |
| **OWASP** | A09 |
| **Composant** | Backend — Exception Filter / Monitoring |
| **Fichier(s)** | `apps/api/src/common/filters/http-exception.filter.ts` |
| **Cause racine** | Seules les erreurs 5xx sont envoyées à Sentry. Les tentatives d'attaque (401, 403, 429 répétés) passent inaperçues dans les alertes. |
| **Effort estimé** | 1h |
| **Priorité** | P3 — Mois suivant |
| **Responsable suggéré** | Backend Dev |
| **Statut** | 🔴 OUVERT |

**Recommandation technique**

```typescript
// apps/api/src/common/filters/http-exception.filter.ts
const SECURITY_CODES = new Set([401, 403, 429]);
const isSecurityEvent = SECURITY_CODES.has(status);

if (status >= HttpStatus.INTERNAL_SERVER_ERROR || isSecurityEvent) {
  Sentry.captureException(exception, {
    level: status >= 500 ? 'error' : 'warning',
    tags: {
      requestId: request.id,
      path: request.url,
      security: isSecurityEvent,
    },
  });
}
```

**Critères d'acceptation**

- [ ] Les erreurs 401, 403, 429 apparaissent dans Sentry avec `tags.security = true`
- [ ] Un dashboard Sentry est configuré pour alerter sur les pics de 401/403/429
- [ ] Les erreurs 5xx continuent d'être tracées avec `level: error`
- [ ] Les erreurs 4xx classiques (400, 404) ne génèrent pas de bruit Sentry

---

### SEC-019 — Durcir le cookie `refresh_token` (sameSite strict + path restreint)

| Champ | Détail |
|-------|--------|
| **ID** | SEC-019 |
| **Titre** | Passer le cookie `refresh_token` à `sameSite: 'strict'` et restreindre son `path` à `/api/auth` |
| **Criticité** | 🟢 FAIBLE |
| **OWASP** | A01 |
| **CWE** | CWE-352 |
| **Composant** | Backend — Auth Controller |
| **Fichier(s)** | `apps/api/src/auth/auth.controller.ts` |
| **Cause racine** | `sameSite: 'lax'` autorise l'envoi du cookie lors des navigations top-level cross-site. `path: '/'` envoie le cookie avec toutes les requêtes. |
| **Effort estimé** | 1h |
| **Priorité** | P3 — Mois suivant (Quick Win) |
| **Responsable suggéré** | Backend Dev |
| **Statut** | ✅ CORRIGÉ — branche `security/phase-1-critical-fixes` (2026-05-07) |

**Implémentation réalisée**
- `sameSite: 'strict'` (était `'lax'`) sur le cookie `refresh_token`
- `path: '/api/auth/refresh'` (était `'/'`) — le cookie n'est plus envoyé à tous les endpoints

**Recommandation technique**

```typescript
// apps/api/src/auth/auth.controller.ts
private setRefreshCookie(res: Response, token: string) {
  const secureCookie = process.env['NODE_ENV'] === 'production';

  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    sameSite: 'strict',       // 'lax' → 'strict'
    secure: secureCookie,
    maxAge: COOKIE_TTL_MS,
    path: '/api/auth',        // '/' → '/api/auth'
  });
}
```

> **Impact :** Le frontend devra envoyer les requêtes de refresh uniquement vers `/api/auth/refresh`. Vérifier que le path est correct dans le client HTTP du frontend.

**Critères d'acceptation**

- [ ] L'en-tête `Set-Cookie` contient `SameSite=Strict` pour `refresh_token`
- [ ] L'en-tête `Set-Cookie` contient `Path=/api/auth`
- [ ] Le cookie n'est pas envoyé pour les requêtes vers `/api/products`, `/api/admin`, etc.
- [ ] Le flux de refresh token fonctionne correctement (le client appelle bien `/api/auth/refresh`)
- [ ] Aucune régression sur le logout et la rotation des tokens

---

### SEC-020 — Épingler les images Docker sur des digests immuables

| Champ | Détail |
|-------|--------|
| **ID** | SEC-020 |
| **Titre** | Remplacer les tags flottants Docker (`postgres:16-alpine`, `redis:7.4-alpine`) par des digests SHA256 |
| **Criticité** | 🟢 FAIBLE |
| **OWASP** | A08 |
| **CWE** | CWE-829 |
| **Composant** | Infrastructure / Docker |
| **Fichier(s)** | `docker-compose.dev.yml`, `docker-compose.prod.yml` |
| **Cause racine** | Les tags Docker peuvent être réassignés à de nouvelles images (supply chain attack). |
| **Effort estimé** | 2h |
| **Priorité** | P3 — Mois suivant |
| **Responsable suggéré** | DevOps |
| **Statut** | 🔴 OUVERT |

**Recommandation technique**

```bash
# Récupérer les digests actuels
docker pull postgres:16-alpine && docker inspect postgres:16-alpine --format '{{index .RepoDigests 0}}'
docker pull redis:7.4-alpine && docker inspect redis:7.4-alpine --format '{{index .RepoDigests 0}}'
```

```yaml
# docker-compose.prod.yml
services:
  postgres:
    image: postgres:16-alpine@sha256:DIGEST_SHA256_ICI
  redis:
    image: redis:7.4.1-alpine@sha256:DIGEST_SHA256_ICI
```

**Critères d'acceptation**

- [ ] Toutes les images dans `docker-compose.prod.yml` utilisent des références `image:tag@sha256:DIGEST`
- [ ] `docker-compose pull` télécharge les images exactes sans ambiguïté
- [ ] Les images sont testées et fonctionnelles en environnement de staging avant déploiement
- [ ] Un processus trimestriel de mise à jour des digests est documenté

---

### SEC-021 — Supprimer l'adresse IP de production du code source versionné

| Champ | Détail |
|-------|--------|
| **ID** | SEC-021 |
| **Titre** | Remplacer l'IP hardcodée `87.106.171.35` dans `docker-compose.prod.yml` par une variable d'environnement |
| **Criticité** | 🟢 FAIBLE |
| **Composant** | Infrastructure / Docker |
| **Fichier(s)** | `docker-compose.prod.yml` |
| **Cause racine** | L'adresse IP du serveur de production est visible en clair dans le dépôt Git. |
| **Effort estimé** | 30 min (Quick Win) |
| **Priorité** | P3 — Mois suivant |
| **Responsable suggéré** | DevOps |
| **Statut** | 🔴 OUVERT |

**Recommandation technique**

```yaml
# docker-compose.prod.yml
services:
  api:
    environment:
      CORS_ORIGIN: ${PRODUCTION_URL}
      APP_URL: ${PRODUCTION_URL}
```

```bash
# .env.prod (non commité — voir SEC-001)
PRODUCTION_URL=https://maisonparfum.com
```

**Critères d'acceptation**

- [ ] `grep -r "87.106.171.35" .` → aucun résultat
- [ ] `PRODUCTION_URL` est défini via variable d'environnement
- [ ] L'application démarre correctement avec la nouvelle configuration
- [ ] Idéalement, un nom de domaine est utilisé à la place de l'IP

---

## 8. Backlog — Recommandations architecturales (P3+)

> **Horizon : 1 à 3 mois. Ces tickets impliquent des refactorings ou changements d'architecture.**

---

### SEC-022 — Migrer JWT de HS256 vers RS256 (algorithme asymétrique)

| Champ | Détail |
|-------|--------|
| **ID** | SEC-022 |
| **Titre** | Remplacer l'algorithme HS256 par RS256 pour les tokens JWT (clé publique/privée) |
| **Criticité** | 🟡 ARCHITECTURAL |
| **Composant** | Backend — Auth / Frontend — Edge Middleware |
| **Cause racine** | HS256 partage le même secret entre signature et vérification. Exposer `JWT_ACCESS_SECRET` côté Edge Runtime (SEC-006) crée un risque. RS256 permet de vérifier avec la clé publique uniquement. |
| **Risque actuel** | Exposition nécessaire du secret JWT côté Edge Next.js pour vérifier les rôles |
| **Effort estimé** | 8–12h (génération des clés, migration, tests) |
| **Priorité** | P3+ — Architecturale |
| **Responsable suggéré** | Lead Dev / Architecte |
| **Statut** | 🔴 OUVERT |

**Recommandation technique**

```bash
# Générer la paire de clés RSA-2048
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem

# Stocker private.pem dans le secret manager (jamais dans le repo)
# Exposer public.pem côté Next.js via une variable d'environnement (non préfixée NEXT_PUBLIC_)
```

```typescript
// NestJS — JwtModule
JwtModule.register({
  privateKey: config.get('JWT_PRIVATE_KEY'),
  publicKey: config.get('JWT_PUBLIC_KEY'),
  signOptions: { algorithm: 'RS256', expiresIn: '15m' },
  verifyOptions: { algorithms: ['RS256'] },
})

// Next.js Edge Middleware — vérification avec clé publique uniquement
import { createRemoteJWKSet, jwtVerify } from 'jose';
const JWKS = createRemoteJWKSet(new URL(`${API_URL}/.well-known/jwks.json`));
const { payload } = await jwtVerify(token, JWKS);
```

**Critères d'acceptation**

- [ ] Les tokens JWT sont signés avec RSA-2048 (algorithme `RS256`)
- [ ] Le middleware Next.js Edge vérifie les tokens sans accès au secret de signature
- [ ] Un endpoint `/.well-known/jwks.json` expose la clé publique
- [ ] Les tokens HS256 existants sont invalidés lors de la migration (rotation)
- [ ] Tous les tests d'authentification passent avec les nouveaux tokens RS256

---

### SEC-023 — Adopter un gestionnaire de secrets centralisé (Doppler / Vault)

| Champ | Détail |
|-------|--------|
| **ID** | SEC-023 |
| **Titre** | Migrer la gestion des secrets des fichiers `.env` vers un gestionnaire centralisé (Doppler ou HashiCorp Vault) |
| **Criticité** | 🟡 ARCHITECTURAL |
| **Composant** | Infrastructure / DevOps |
| **Cause racine** | Les secrets sont gérés dans des fichiers `.env` sujets aux erreurs de versionning (cf. SEC-001). |
| **Effort estimé** | 12h |
| **Priorité** | P3+ — Architecturale |
| **Responsable suggéré** | DevOps / RSSI |
| **Statut** | 🔴 OUVERT |

**Recommandation technique**

```bash
# Option Doppler (SaaS, simple à démarrer)
doppler setup --project maison-parfum --config production
doppler run -- docker compose up

# Intégration CI/CD
- name: Fetch secrets from Doppler
  run: doppler secrets download --no-file --format env > /tmp/secrets.env
```

**Critères d'acceptation**

- [ ] Aucun fichier `.env.prod` ou équivalent dans le dépôt ou sur le serveur
- [ ] Les secrets sont injectés au runtime depuis le gestionnaire centralisé
- [ ] La rotation des secrets déclenche une alerte et un redémarrage automatique des services
- [ ] Un audit trail des accès aux secrets est disponible
- [ ] Les développeurs peuvent travailler en local sans accès aux secrets de production

---

### SEC-024 — Mettre en place un Web Application Firewall (WAF)

| Champ | Détail |
|-------|--------|
| **ID** | SEC-024 |
| **Titre** | Déployer Cloudflare WAF ou AWS WAF en amont de l'API pour filtrer le trafic malveillant |
| **Criticité** | 🟡 ARCHITECTURAL |
| **Composant** | Infrastructure |
| **Cause racine** | L'API est directement exposée sur internet sans couche de filtrage du trafic malveillant. |
| **Effort estimé** | 4–8h |
| **Priorité** | P3+ — Architecturale |
| **Responsable suggéré** | DevOps / SRE |
| **Statut** | 🔴 OUVERT |

**Critères d'acceptation**

- [ ] Le WAF filtre les patterns d'injection SQL, XSS, et path traversal
- [ ] Les bots et scanners sont bloqués ou ralentis (CAPTCHA)
- [ ] Les alertes DDoS sont configurées avec seuils d'activation automatique
- [ ] Les logs WAF sont centralisés et consultables

---

### SEC-025 — Planifier la mise à jour des dépendances majeures (NestJS 11, Prisma 6)

| Champ | Détail |
|-------|--------|
| **ID** | SEC-025 |
| **Titre** | Mettre à jour NestJS (10.4 → 11.x) et Prisma (5.20 → 6.x) avec tests de régression complets |
| **Criticité** | 🟢 MAINTENANCE |
| **OWASP** | A06 |
| **Composant** | Backend — Dépendances |
| **Cause racine** | NestJS 10.4.4 et Prisma 5.20.0 ne sont plus les versions majeures actives. Des corrections de sécurité sont intégrées dans les versions ultérieures. |
| **Effort estimé** | 8–16h (migration + tests) |
| **Priorité** | P3+ — Maintenance |
| **Responsable suggéré** | Lead Dev |
| **Statut** | 🔴 OUVERT |

**Critères d'acceptation**

- [ ] `pnpm audit` → 0 vulnérabilité high/critical sur les dépendances principales
- [ ] La suite de tests passe à 100% après la mise à jour
- [ ] Les changelogs de NestJS 11 et Prisma 6 sont revus pour les breaking changes de sécurité
- [ ] Dependabot est activé pour les futures alertes automatiques

---

## 9. Roadmap de remédiation

```
MAI 2026 (Semaine 1-2)          JUIN 2026 (Semaine 3-6)        JUILLET 2026 (Semaine 7-10)
══════════════════════          ═══════════════════════         ═══════════════════════════

PHASE 1 — URGENCE (J+0 à J+2)  PHASE 2 — CRITIQUE (J+3 à J+7) PHASE 3 — SPRINT (J+8 à J+21)
──────────────────────────────  ────────────────────────────── ──────────────────────────────
SEC-001  Rotation secrets    ✅  SEC-004  HTTPS + TLS         ✅  SEC-011  CSP explicite
SEC-002  Fix bypass 2FA      ✅  SEC-003  Hardcoded creds     ✅  SEC-012  Trust proxy / IP
SEC-005  Stripe webhook      ✅  SEC-006  Middleware admin FE  ✅  SEC-013  Chiffrement TOTP
SEC-010  Stripe live keys    ✅  SEC-007  Throttle refresh    ✅  SEC-014  CI Security scan
                                 SEC-008  Throttle TOTP       ✅  SEC-015  Masquer path erreurs
                                 SEC-009  Account lockout     ✅  SEC-016  Valider metric param
                                                                  SEC-017  Tokens URL → path


AOÛT 2026 (Semaine 11-14)       SEPT–OCT 2026 (Mois 3-4)
═══════════════════════         ═════════════════════════

PHASE 4 — HARDENING             PHASE 5 — ARCHITECTURE
──────────────────────────────  ──────────────────────────────
SEC-018  Sentry 401/403/429     SEC-022  Migration JWT RS256
SEC-019  Cookie SameSite strict SEC-023  Gestionnaire secrets
SEC-020  Images Docker épinglées SEC-024  WAF Cloudflare
SEC-021  IP prod → variable env SEC-025  Maj NestJS 11 + Prisma 6
```

### Jalons clés

| Jalon | Date cible | Condition |
|-------|-----------|-----------|
| 🔴 **Go/No-Go production** | J+7 | SEC-001, SEC-002, SEC-004, SEC-005, SEC-010 terminés |
| 🟠 **Audit intermédiaire** | J+21 | Phase 2 et 3 complètes — score cible ≥ 70/100 |
| 🟡 **Certification sécurité** | J+42 | Phase 4 complète — score cible ≥ 80/100 |
| 🟢 **Architecture cible** | J+90 | Phase 5 complète — score cible ≥ 90/100 |

---

## 10. Indicateurs de pilotage sécurité

### KPIs de suivi backlog

| Indicateur | Valeur actuelle | Cible J+7 | Cible J+21 | Cible J+42 |
|-----------|----------------|-----------|------------|------------|
| Vulnérabilités critiques ouvertes | 4 | 0 | 0 | 0 |
| Vulnérabilités hautes ouvertes | 6 | 2 | 0 | 0 |
| Vulnérabilités moyennes ouvertes | 7 | 7 | 2 | 0 |
| Score sécurité global | 42/100 | 65/100 | 75/100 | 85/100 |
| Couverture scanning CI | 0% | 0% | 100% | 100% |
| Endpoints sans rate limiting | 3 | 0 | 0 | 0 |
| Secrets exposés dans Git | Oui | Non | Non | Non |

### Tableau de suivi des tickets

| ID | Titre court | Criticité | Priorité | Effort | Responsable | Statut |
|----|-------------|-----------|----------|--------|-------------|--------|
| SEC-001 | Secrets dans Git — révocation + purge | 🔴 CRITIQUE | P0 | 3h | DevOps/Lead Dev | ✅ CORRIGÉ |
| SEC-002 | Bypass 2FA — secret JWT distinct | 🔴 CRITIQUE | P0 | 3h | Backend Dev | ✅ CORRIGÉ |
| SEC-003 | Credentials admin hardcodés | 🔴 CRITIQUE | P0 | 2h | Backend Dev | ✅ CORRIGÉ |
| SEC-004 | HTTPS + TLS + HSTS | 🔴 CRITIQUE | P0 | 5h | DevOps | ✅ CORRIGÉ |
| SEC-005 | Stripe webhook secret placeholder | 🟠 HAUTE | P1 | 30m | DevOps | 🔴 OUVERT |
| SEC-006 | Middleware admin frontend rôle ADMIN | 🟠 HAUTE | P1 | 3h | Frontend Dev | ✅ CORRIGÉ |
| SEC-007 | Throttle sur /auth/refresh | 🟠 HAUTE | P1 | 30m | Backend Dev | ✅ CORRIGÉ |
| SEC-008 | Throttle sur endpoints TOTP | 🟠 HAUTE | P1 | 45m | Backend Dev | ✅ CORRIGÉ |
| SEC-009 | Account lockout après 5 échecs login | 🟠 HAUTE | P1 | 4h | Backend Dev | 🔴 OUVERT |
| SEC-010 | Stripe live keys en production | 🟠 HAUTE | P1 | 30m | DevOps | 🔴 OUVERT |
| SEC-011 | CSP explicite Helmet | 🟡 MOYENNE | P2 | 3h | Backend Dev | 🔴 OUVERT |
| SEC-012 | Trust proxy + req.ip | 🟡 MOYENNE | P2 | 1h | Backend Dev | 🔴 OUVERT |
| SEC-013 | Chiffrement TOTP secret (AES-256-GCM) | 🟡 MOYENNE | P2 | 4h | Backend Dev | 🔴 OUVERT |
| SEC-014 | CI/CD — pnpm audit + Trivy + CodeQL | 🟡 MOYENNE | P2 | 2h | DevOps | 🔴 OUVERT |
| SEC-015 | Masquer path dans erreurs production | 🟡 MOYENNE | P2 | 30m | Backend Dev | 🔴 OUVERT |
| SEC-016 | Valider paramètre `metric` admin | 🟡 MOYENNE | P2 | 1h | Backend Dev | 🔴 OUVERT |
| SEC-017 | Tokens reset → path (non query string) | 🟡 MOYENNE | P2 | 3h | BE + FE Dev | 🔴 OUVERT |
| SEC-018 | Sentry — tracer 401/403/429 | 🟢 FAIBLE | P3 | 1h | Backend Dev | 🔴 OUVERT |
| SEC-019 | Cookie SameSite strict + path restreint | 🟢 FAIBLE | P3 | 1h | Backend Dev | ✅ CORRIGÉ |
| SEC-020 | Images Docker — digests SHA256 | 🟢 FAIBLE | P3 | 2h | DevOps | 🔴 OUVERT |
| SEC-021 | IP prod → variable d'environnement | 🟢 FAIBLE | P3 | 30m | DevOps | 🔴 OUVERT |
| SEC-022 | Migration JWT HS256 → RS256 | 🟡 ARCHI | P3+ | 12h | Lead Dev | 🔴 OUVERT |
| SEC-023 | Gestionnaire de secrets centralisé | 🟡 ARCHI | P3+ | 12h | DevOps/RSSI | 🔴 OUVERT |
| SEC-024 | WAF Cloudflare / AWS WAF | 🟡 ARCHI | P3+ | 6h | DevOps | 🔴 OUVERT |
| SEC-025 | Mise à jour NestJS 11 + Prisma 6 | 🟢 MAINT | P3+ | 12h | Lead Dev | 🔴 OUVERT |

### Vélocité recommandée par sprint

| Sprint | Dates | Tickets | Effort total |
|--------|-------|---------|--------------|
| Emergency Sprint | J+0 → J+2 | SEC-001, SEC-002, SEC-003*, SEC-005, SEC-010 | ~10h |
| Sprint Sécurité 1 | J+3 → J+7 | SEC-004, SEC-006, SEC-007, SEC-008, SEC-009 | ~13h |
| Sprint Sécurité 2 | J+8 → J+21 | SEC-011 à SEC-017 | ~15h |
| Sprint Hardening | J+22 → J+42 | SEC-018 à SEC-021 | ~5h |
| Sprint Architecture | J+43 → J+90 | SEC-022 à SEC-025 | ~42h |

> *SEC-003 peut être parallélisé avec SEC-001

---

*Backlog généré le 2026-05-07 à partir du rapport d'audit SECURITY_AUDIT.md*  
*Révision recommandée après chaque sprint de remédiation — mettre à jour les statuts et les KPIs*  
*Prochaine revue complète : après la Phase 2 (J+7)*
