#!/bin/sh
set -e

echo "🔄 Running database migrations..."
prisma migrate deploy --schema=prisma/schema.prisma

echo "👤 Ensuring admin user exists..."
node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
async function seed() {
  const prisma = new PrismaClient();
  try {
    const hash = await bcrypt.hash('passer123', 12);
    const admin = await prisma.user.upsert({
      where: { email: 'pamodiallo@gmail.com' },
      update: {},
      create: {
        email: 'pamodiallo@gmail.com',
        passwordHash: hash,
        firstName: 'Papa',
        lastName: 'Diallo',
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

echo "🚀 Starting API..."
exec node dist/main.js
