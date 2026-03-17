// One-off: create demo1@example.com for login testing
// Run: cd apps/backend/auth-service-js && node seed-demo1.cjs

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();
const DEMO_PASSWORD = 'Werfie@123';

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: 'demo1@example.com' } });
  if (existing) {
    console.log('demo1@example.com already exists. Updating password...');
    const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
    await prisma.user.update({ where: { email: 'demo1@example.com' }, data: { passwordHash: hash } });
    console.log('Password updated.');
  } else {
    const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
    await prisma.user.create({
      data: { email: 'demo1@example.com', passwordHash: hash, preferredLanguage: 'en' },
    });
    console.log('Created demo1@example.com');
  }
  console.log('Credentials: demo1@example.com /', DEMO_PASSWORD);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
