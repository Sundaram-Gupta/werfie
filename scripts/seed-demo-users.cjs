// Seed 5000 demo users and reassign orphan posts to them.
// Run from repo root:
//   cd "c:\\Users\\ASPIRE 6\\Werfie-Repo\\adminBackend"
//   node ../scripts/seed-demo-users.cjs

/* eslint-disable @typescript-eslint/no-var-requires */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const TOTAL_DEMO_USERS = 5000;
  const DEMO_PASSWORD = 'Werfie@123'; // known password for all demo users

  console.log('--- Werfie demo user seeder ---');
  console.log('Creating demo users (total:', TOTAL_DEMO_USERS, ')');

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const demoUserIds = [];
  const batchSize = 500;

  for (let start = 0; start < TOTAL_DEMO_USERS; start += batchSize) {
    const batch = [];
    const end = Math.min(start + batchSize, TOTAL_DEMO_USERS);

    for (let i = start; i < end; i++) {
      const index = i + 1;
      const email = `demo${index}@example.com`;

      batch.push(
        prisma.user.create({
          data: {
            email,
            passwordHash,
            preferredLanguage: 'en',
          },
          select: { id: true },
        })
      );
    }

    const created = await prisma.$transaction(batch);
    demoUserIds.push(...created.map((u) => u.id));
    console.log(`Created demo users ${start + 1}–${end}`);
  }

  console.log('Finding posts whose user no longer exists...');

  // Find posts with userId that has no corresponding User row
  const orphanPosts = await prisma.$queryRaw`
    SELECT p."id"
    FROM "Post" p
    LEFT JOIN "User" u ON p."userId" = u."id"
    WHERE u."id" IS NULL
  `;

  if (!orphanPosts.length) {
    console.log('No orphan posts found. Existing posts already point to valid users.');
    console.log('Demo users created. Example credentials:');
    console.log('  email: demo1@example.com');
    console.log('  password:', DEMO_PASSWORD);
    return;
  }

  console.log('Orphan posts found:', orphanPosts.length);
  console.log('Reassigning them to demo users in round-robin fashion...');

  const updates = [];
  const userCount = demoUserIds.length;

  orphanPosts.forEach((row, idx) => {
    const userId = demoUserIds[idx % userCount];
    updates.push(
      prisma.post.update({
        where: { id: row.id },
        data: { userId },
      })
    );
  });

  const updateBatchSize = 500;
  for (let start = 0; start < updates.length; start += updateBatchSize) {
    const slice = updates.slice(start, start + updateBatchSize);
    await prisma.$transaction(slice);
    console.log(
      `Updated orphan posts ${start + 1}–${Math.min(start + updateBatchSize, updates.length)}`
    );
  }

  console.log('Done.');
  console.log('Demo user credentials (all users):');
  console.log('  email: demo1@example.com  ... demo5000@example.com');
  console.log('  password:', DEMO_PASSWORD);
}

main()
  .catch((err) => {
    console.error('Seeder failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

