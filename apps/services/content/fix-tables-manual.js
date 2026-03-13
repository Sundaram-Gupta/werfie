const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Manual Table Creation ---');
    try {
        // Drop tables if they exist to ensure clean state
        await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "AnnouncementRevision" CASCADE;`);
        await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "Announcement" CASCADE;`);
        console.log('✔ Dropped existing tables for clean recreate.');

        // Create Announcement table
        await prisma.$executeRawUnsafe(`
            CREATE TABLE "Announcement" (
                "id" TEXT NOT NULL,
                "institutionId" TEXT NOT NULL,
                "title" TEXT NOT NULL,
                "content" TEXT NOT NULL,
                "category" TEXT NOT NULL,
                "severityLevel" INTEGER NOT NULL DEFAULT 1,
                "regions" JSONB NOT NULL,
                "attachments" JSONB NOT NULL,
                "livestreamUrl" TEXT,
                "effectiveDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "expiryDate" TIMESTAMP(3),
                "lockDurationMinutes" INTEGER NOT NULL DEFAULT 0,
                "aiSummary" TEXT,
                "immutableHash" TEXT NOT NULL,
                "status" TEXT NOT NULL DEFAULT 'draft',
                "createdBy" TEXT NOT NULL,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

                CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
            );
        `);
        console.log('✔ Table "Announcement" created or verified.');

        // Create secondary index or unique constraint
        await prisma.$executeRawUnsafe(`
            CREATE UNIQUE INDEX IF NOT EXISTS "Announcement_immutableHash_key" ON "Announcement"("immutableHash");
        `);
        console.log('✔ Index "Announcement_immutableHash_key" created or verified.');

        // Create AnnouncementRevision table
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "AnnouncementRevision" (
                "id" TEXT NOT NULL,
                "announcementId" TEXT NOT NULL,
                "version" INTEGER NOT NULL,
                "editedBy" TEXT NOT NULL,
                "changes" JSONB NOT NULL,
                "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

                CONSTRAINT "AnnouncementRevision_pkey" PRIMARY KEY ("id")
            );
        `);
        console.log('✔ Table "AnnouncementRevision" created or verified.');

        // Verify with a SELECT
        const tables = await prisma.$queryRawUnsafe("SELECT table_name FROM information_schema.tables WHERE table_name = 'Announcement'");
        console.log('Verification result:', tables);

    } catch (e) {
        console.error('❌ SQL Execution failed:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
