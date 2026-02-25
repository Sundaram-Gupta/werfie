const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Fixing Shared Database Schema ---');
    try {
        // Fix Post table
        console.log('Syncing "Post" table...');
        await prisma.$executeRawUnsafe(`ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "mediaUrls" TEXT;`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;`);
        console.log('✔ "Post" table synced.');

        // Fix Announcement table (ensure all fields exist)
        console.log('Syncing "Announcement" table...');
        await prisma.$executeRawUnsafe(`ALTER TABLE "Announcement" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;`);
        console.log('✔ "Announcement" table synced.');

        console.log('--- Verification ---');
        const posts = await prisma.post.findMany({ take: 1 });
        console.log('✔ Successfully queried Post table.');

        const announcements = await prisma.announcement.findMany({ take: 1 });
        console.log('✔ Successfully queried Announcement table.');

    } catch (e) {
        console.error('❌ Schema Fix Failed:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
