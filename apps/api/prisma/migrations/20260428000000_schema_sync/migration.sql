-- ============================================================
-- Migration de rattrapage : colonnes/enums/tables manquants
-- Utilise IF NOT EXISTS pour être idempotent
-- ============================================================

-- -----------------------------------------------------------
-- 1. Nouveaux ENUMs
-- -----------------------------------------------------------

DO $$ BEGIN
  CREATE TYPE "Occasion" AS ENUM ('DAILY', 'EVENING', 'SPECIAL', 'SPORT', 'OFFICE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "Concentration" AS ENUM ('EAU_FRAICHE', 'EAU_DE_COLOGNE', 'EAU_DE_TOILETTE', 'EAU_DE_PARFUM', 'PARFUM', 'EXTRAIT_DE_PARFUM');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "OlfactoryFamily" AS ENUM ('HESPERIDE', 'FLORAL', 'BOISE', 'ORIENTAL', 'AMBRE', 'FOUGERE', 'CHYPRE', 'CUIR');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "PaymentMethod" AS ENUM ('ONLINE', 'CASH_ON_DELIVERY');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Ajouter CASH à PaymentProvider (idempotent dans Postgres 12+)
DO $$ BEGIN
  ALTER TYPE "PaymentProvider" ADD VALUE IF NOT EXISTS 'CASH';
EXCEPTION WHEN others THEN NULL; END $$;

-- -----------------------------------------------------------
-- 2. AlterTable Product — colonnes manquantes
-- -----------------------------------------------------------

ALTER TABLE "Product"
  ADD COLUMN IF NOT EXISTS "sizeMl"        INTEGER,
  ADD COLUMN IF NOT EXISTS "concentration" "Concentration",
  ADD COLUMN IF NOT EXISTS "family"        "OlfactoryFamily",
  ADD COLUMN IF NOT EXISTS "occasions"     "Occasion"[] DEFAULT ARRAY[]::"Occasion"[];

-- Index manquants sur Product
CREATE INDEX IF NOT EXISTS "Product_gender_idx"            ON "Product"("gender");
CREATE INDEX IF NOT EXISTS "Product_stockStatus_isActive_idx" ON "Product"("stockStatus", "isActive");
CREATE INDEX IF NOT EXISTS "Product_priceCents_idx"         ON "Product"("priceCents");

-- -----------------------------------------------------------
-- 3. AlterTable Order — paymentMethod manquant
-- -----------------------------------------------------------

ALTER TABLE "Order"
  ADD COLUMN IF NOT EXISTS "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'ONLINE';

-- -----------------------------------------------------------
-- 4. AlterTable Cart — reminderStage manquant
-- -----------------------------------------------------------

ALTER TABLE "Cart"
  ADD COLUMN IF NOT EXISTS "reminderStage" INTEGER NOT NULL DEFAULT 0;

-- -----------------------------------------------------------
-- 5. AlterTable ProductVariant — rendre priceCents et sku nullables
-- -----------------------------------------------------------

ALTER TABLE "ProductVariant"
  ALTER COLUMN "priceCents" DROP NOT NULL,
  ALTER COLUMN "sku"        DROP NOT NULL;

-- -----------------------------------------------------------
-- 6. AlterTable EmailLog — metadata manquant + FK userId
-- -----------------------------------------------------------

ALTER TABLE "EmailLog"
  ADD COLUMN IF NOT EXISTS "metadata" JSONB;

ALTER TABLE "EmailLog"
  ADD CONSTRAINT "EmailLog_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE
  NOT VALID; -- NOT VALID pour éviter le scan de table, validable plus tard

-- -----------------------------------------------------------
-- 7. CreateTable PromoCode
-- -----------------------------------------------------------

CREATE TABLE IF NOT EXISTS "PromoCode" (
    "id"                   TEXT        NOT NULL,
    "code"                 TEXT        NOT NULL,
    "type"                 "DiscountType" NOT NULL,
    "value"                INTEGER     NOT NULL,
    "isActive"             BOOLEAN     NOT NULL DEFAULT true,
    "validFrom"            TIMESTAMP(3),
    "validUntil"           TIMESTAMP(3),
    "minOrderCents"        INTEGER,
    "maxUses"              INTEGER,
    "usedCount"            INTEGER     NOT NULL DEFAULT 0,
    "maxUsesPerUser"       INTEGER,
    "applicableProductIds"   TEXT[]    NOT NULL DEFAULT ARRAY[]::TEXT[],
    "applicableCategoryIds"  TEXT[]    NOT NULL DEFAULT ARRAY[]::TEXT[],
    "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromoCode_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PromoCode_code_key" ON "PromoCode"("code");
CREATE INDEX        IF NOT EXISTS "PromoCode_code_idx"  ON "PromoCode"("code");

-- -----------------------------------------------------------
-- 8. CreateTable PromoCodeUsage
-- -----------------------------------------------------------

CREATE TABLE IF NOT EXISTS "PromoCodeUsage" (
    "id"            TEXT        NOT NULL,
    "promoCodeId"   TEXT        NOT NULL,
    "userId"        TEXT        NOT NULL,
    "orderId"       TEXT        NOT NULL,
    "discountCents" INTEGER     NOT NULL,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromoCodeUsage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PromoCodeUsage_orderId_key"      ON "PromoCodeUsage"("orderId");
CREATE INDEX        IF NOT EXISTS "PromoCodeUsage_promoCodeId_idx"  ON "PromoCodeUsage"("promoCodeId");
CREATE INDEX        IF NOT EXISTS "PromoCodeUsage_userId_idx"       ON "PromoCodeUsage"("userId");

ALTER TABLE "PromoCodeUsage"
  ADD CONSTRAINT "PromoCodeUsage_promoCodeId_fkey"
    FOREIGN KEY ("promoCodeId") REFERENCES "PromoCode"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "PromoCodeUsage_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "PromoCodeUsage_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- -----------------------------------------------------------
-- 9. CreateTable QuizResult
-- -----------------------------------------------------------

CREATE TABLE IF NOT EXISTS "QuizResult" (
    "id"              TEXT         NOT NULL,
    "userId"          TEXT,
    "answers"         JSONB        NOT NULL,
    "recommendations" TEXT[]       NOT NULL DEFAULT ARRAY[]::TEXT[],
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuizResult_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "QuizResult_userId_idx" ON "QuizResult"("userId");

ALTER TABLE "QuizResult"
  ADD CONSTRAINT "QuizResult_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
