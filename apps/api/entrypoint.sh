#!/bin/sh
# SEC-003: All admin credentials are read from environment variables.
# NEVER hardcode email, password, or personal data in this file.
# Inject via Doppler: doppler run -- docker-compose up
# or via docker-compose environment: ADMIN_EMAIL, ADMIN_PASSWORD
set -e

echo "🔄 Running database migrations..."
prisma migrate deploy --schema=prisma/schema.prisma

echo "👤 Ensuring admin user exists..."
# SEC-003 fix: credentials come exclusively from environment variables.
# If not set, the seed step is skipped with a warning (non-blocking).
if [ -z "${ADMIN_EMAIL}" ] || [ -z "${ADMIN_PASSWORD}" ]; then
  echo "⚠️  ADMIN_EMAIL or ADMIN_PASSWORD not set — skipping admin seed. Set these variables to create the initial admin user."
else
  node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
async function seed() {
  const prisma = new PrismaClient();
  try {
    const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
    const admin = await prisma.user.upsert({
      where: { email: process.env.ADMIN_EMAIL },
      update: {},
      create: {
        email: process.env.ADMIN_EMAIL,
        passwordHash: hash,
        firstName: process.env.ADMIN_FIRST_NAME || 'Admin',
        lastName: process.env.ADMIN_LAST_NAME || 'User',
        role: 'ADMIN',
        emailVerified: true
      }
    });
    console.log('✅ Admin ready:', admin.email);
    await prisma.\$disconnect();
  } catch (e) {
    console.warn('⚠️  Seed note:', e.message);
    await prisma.\$disconnect().catch(() => {});
  }
}
seed().catch(() => process.exit(0));
"
fi

echo "🚀 Starting API..."
exec node dist/main.js
