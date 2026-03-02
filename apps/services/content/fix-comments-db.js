const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Creating Structured Comments Module Tables...");

    try {
        // 1. StructuredComment
        await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "StructuredComment" (
        "id" TEXT NOT NULL,
        "announcementId" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "parentCommentId" TEXT,
        "content" TEXT NOT NULL,
        "factFlag" BOOLEAN NOT NULL DEFAULT false,
        "credibilityScore" INTEGER,
        "moderationStatus" TEXT NOT NULL DEFAULT 'pending',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "StructuredComment_pkey" PRIMARY KEY ("id")
      );
    `);
        console.log("✅ StructuredComment table ensured.");

        // 2. CommentModerationQueue
        await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "CommentModerationQueue" (
        "id" TEXT NOT NULL,
        "commentId" TEXT NOT NULL,
        "reviewerId" TEXT,
        "reviewStatus" TEXT NOT NULL DEFAULT 'pending',
        "notes" TEXT,
        "reviewedAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "CommentModerationQueue_pkey" PRIMARY KEY ("id")
      );
    `);
        console.log("✅ CommentModerationQueue table ensured.");

        // 3. CommentReport
        await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "CommentReport" (
        "id" TEXT NOT NULL,
        "commentId" TEXT NOT NULL,
        "reporterId" TEXT NOT NULL,
        "reason" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'open',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "CommentReport_pkey" PRIMARY KEY ("id")
      );
    `);
        console.log("✅ CommentReport table ensured.");

        // Foreign Keys
        // Add FK from StructuredComment -> Announcement
        try {
            await prisma.$executeRawUnsafe(`
        ALTER TABLE "StructuredComment" ADD CONSTRAINT "StructuredComment_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "Announcement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `);
            console.log("✅ FK StructuredComment -> Announcement added.");
        } catch (e) {
            if (e.message.includes('already exists')) {
                console.log("ℹ️ FK StructuredComment -> Announcement already exists.");
            } else {
                console.log("⚠️ Could not add FK StructuredComment -> Announcement (might exist):", e.message);
            }
        }

        // Add FK from StructuredComment -> parentCommentId
        try {
            await prisma.$executeRawUnsafe(`
          ALTER TABLE "StructuredComment" ADD CONSTRAINT "StructuredComment_parentCommentId_fkey" FOREIGN KEY ("parentCommentId") REFERENCES "StructuredComment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        `);
            console.log("✅ FK StructuredComment -> StructuredComment (Parent) added.");
        } catch (e) {
            if (e.message.includes('already exists')) {
                console.log("ℹ️ FK StructuredComment -> StructuredComment already exists.");
            } else {
                console.log("⚠️ Could not add FK StructuredComment -> StructuredComment (might exist):", e.message);
            }
        }

        // Add FK from CommentModerationQueue -> StructuredComment
        try {
            await prisma.$executeRawUnsafe(`
          ALTER TABLE "CommentModerationQueue" ADD CONSTRAINT "CommentModerationQueue_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "StructuredComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        `);
            console.log("✅ FK CommentModerationQueue -> StructuredComment added.");
        } catch (e) {
            if (e.message.includes('already exists')) {
                console.log("ℹ️ FK CommentModerationQueue -> StructuredComment already exists.");
            } else {
                console.log("⚠️ Could not add FK CommentModerationQueue -> StructuredComment (might exist):", e.message);
            }
        }

        // Add FK from CommentReport -> StructuredComment
        try {
            await prisma.$executeRawUnsafe(`
          ALTER TABLE "CommentReport" ADD CONSTRAINT "CommentReport_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "StructuredComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        `);
            console.log("✅ FK CommentReport -> StructuredComment added.");
        } catch (e) {
            if (e.message.includes('already exists')) {
                console.log("ℹ️ FK CommentReport -> StructuredComment already exists.");
            } else {
                console.log("⚠️ Could not add FK CommentReport -> StructuredComment (might exist):", e.message);
            }
        }

        console.log("✅ Database schema patch complete.");

    } catch (error) {
        console.error("❌ Error setting up database:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
