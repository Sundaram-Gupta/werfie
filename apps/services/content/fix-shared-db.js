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

        // Fix User table
        console.log('Syncing "User" table...');
        await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "institutionType" TEXT;`);
        console.log('✔ "User" table synced.');

        // Fix Profile table
        console.log('Syncing "Profile" table...');
        await prisma.$executeRawUnsafe(`ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "verified" BOOLEAN DEFAULT false;`);
        console.log('✔ "Profile" table synced.');

        // Fix Announcement table (ensure all fields exist)
        console.log('Syncing "Announcement" table...');
        await prisma.$executeRawUnsafe(`ALTER TABLE "Announcement" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;`);
        console.log('✔ "Announcement" table synced.');

        // Recreate InstitutionalProfile if missing
        console.log('Creating "InstitutionalProfile" table...');
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "InstitutionalProfile" (
                "id" TEXT NOT NULL,
                "userId" TEXT NOT NULL,
                "institutionName" TEXT NOT NULL,
                "institutionType" TEXT NOT NULL,
                "country" TEXT,
                "state" TEXT,
                "website" TEXT,
                "officialEmailDomain" TEXT,
                "description" TEXT,
                "logoUrl" TEXT,
                "bannerUrl" TEXT,
                "repFullName" TEXT,
                "repJobTitle" TEXT,
                "repDepartment" TEXT,
                "repOfficialEmail" TEXT,
                "repPhone" TEXT,
                "repIdUrl" TEXT,
                "repLinkedInUrl" TEXT,
                "repAuthLetterUrl" TEXT,
                "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
                "primaryRole" TEXT NOT NULL DEFAULT 'publisher',
                "recoveryEmail" TEXT,
                "recoveryPhone" TEXT,
                "isVerified" BOOLEAN NOT NULL DEFAULT false,
                "isDomainVerified" BOOLEAN NOT NULL DEFAULT false,
                "supportingDocs" JSONB,
                "transparencyAccepted" BOOLEAN NOT NULL DEFAULT false,
                "termsAccepted" BOOLEAN NOT NULL DEFAULT false,
                "publicDisplayName" TEXT,
                "publicBio" TEXT,
                "headquarters" TEXT,
                "categories" JSONB,
                "languages" JSONB,
                "status" TEXT NOT NULL DEFAULT 'pending',
                "adminNotes" TEXT,
                "badgeType" TEXT,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "InstitutionalProfile_pkey" PRIMARY KEY ("id")
            );
        `);

        try {
            await prisma.$executeRawUnsafe(`
                CREATE UNIQUE INDEX "InstitutionalProfile_userId_key" ON "InstitutionalProfile"("userId");
            `);
        } catch (e) { /* index might exist */ }

        try {
            await prisma.$executeRawUnsafe(`
                ALTER TABLE "InstitutionalProfile" 
                ADD CONSTRAINT "InstitutionalProfile_userId_fkey" 
                FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
            `);
        } catch (e) { /* constraint might exist */ }

        console.log('✔ "InstitutionalProfile" table created.');

        // Add WorldLeader Table
        console.log('Creating "WorldLeader" table...');
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "WorldLeader" (
                "id" TEXT NOT NULL,
                "institutionId" TEXT NOT NULL,
                "leaderName" TEXT NOT NULL,
                "title" TEXT NOT NULL,
                "profileImage" TEXT,
                "region" TEXT NOT NULL,
                "country" TEXT NOT NULL,
                "priorityRank" INTEGER NOT NULL DEFAULT 0,
                "autoPushEnabled" BOOLEAN NOT NULL DEFAULT false,
                "verifiedStatus" BOOLEAN NOT NULL DEFAULT false,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "WorldLeader_pkey" PRIMARY KEY ("id")
            );
        `);

        try {
            await prisma.$executeRawUnsafe(`
                ALTER TABLE "WorldLeader" 
                ADD CONSTRAINT "WorldLeader_institutionId_fkey" 
                FOREIGN KEY ("institutionId") REFERENCES "InstitutionalProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
            `);
        } catch (e) { /* constraint might exist */ }

        console.log('✔ "WorldLeader" table created.');

        // Add AnnouncementTranslation Table
        console.log('Creating "AnnouncementTranslation" table...');
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "AnnouncementTranslation" (
                "id" TEXT NOT NULL,
                "announcementId" TEXT NOT NULL,
                "languageCode" TEXT NOT NULL,
                "title" TEXT,
                "content" TEXT,
                "status" TEXT NOT NULL DEFAULT 'pending',
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP(3) NOT NULL,
                CONSTRAINT "AnnouncementTranslation_pkey" PRIMARY KEY ("id")
            );
        `);
        // Add foreign key correctly
        try {
            await prisma.$executeRawUnsafe(`
                ALTER TABLE "AnnouncementTranslation" 
                ADD CONSTRAINT "AnnouncementTranslation_announcementId_fkey" 
                FOREIGN KEY ("announcementId") REFERENCES "Announcement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
            `);
        } catch (e) { /* constraint might already exist */ }

        try {
            await prisma.$executeRawUnsafe(`
                CREATE UNIQUE INDEX "AnnouncementTranslation_announcementId_languageCode_key" ON "AnnouncementTranslation"("announcementId", "languageCode");
            `);
        } catch (e) { /* index might already exist */ }

        console.log('✔ "AnnouncementTranslation" table created.');

        // Add MarketSignal Table
        console.log('Creating "MarketSignal" table...');
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "MarketSignal" (
                "id" TEXT NOT NULL,
                "announcementId" TEXT NOT NULL,
                "institutionId" TEXT NOT NULL,
                "category" TEXT NOT NULL,
                "region" TEXT NOT NULL,
                "sector" TEXT,
                "severity" INTEGER NOT NULL,
                "impactScore" INTEGER NOT NULL,
                "volatilityIndex" DOUBLE PRECISION,
                "confidenceScore" INTEGER NOT NULL,
                "detectedKeywords" JSONB,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "MarketSignal_pkey" PRIMARY KEY ("id")
            );
        `);
        try {
            await prisma.$executeRawUnsafe(`
                ALTER TABLE "MarketSignal" 
                ADD CONSTRAINT "MarketSignal_announcementId_fkey" 
                FOREIGN KEY ("announcementId") REFERENCES "Announcement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
            `);
        } catch (e) { /* constraint might exist */ }

        // Add EnterpriseUser Table
        console.log('Creating "EnterpriseUser" table...');
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "EnterpriseUser" (
                "id" TEXT NOT NULL,
                "organizationName" TEXT NOT NULL,
                "userId" TEXT NOT NULL,
                "subscriptionTier" TEXT NOT NULL DEFAULT 'standard',
                "apiAccessEnabled" BOOLEAN NOT NULL DEFAULT false,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "EnterpriseUser_pkey" PRIMARY KEY ("id")
            );
        `);
        try {
            await prisma.$executeRawUnsafe(`
                ALTER TABLE "EnterpriseUser" 
                ADD CONSTRAINT "EnterpriseUser_userId_fkey" 
                FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
            `);
        } catch (e) { /* constraint might exist */ }
        try {
            await prisma.$executeRawUnsafe(`
                CREATE UNIQUE INDEX "EnterpriseUser_userId_key" ON "EnterpriseUser"("userId");
            `);
        } catch (e) { /* index might exist */ }

        // Add EnterpriseAlertRule Table
        console.log('Creating "EnterpriseAlertRule" table...');
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "EnterpriseAlertRule" (
                "id" TEXT NOT NULL,
                "userId" TEXT NOT NULL,
                "categories" JSONB,
                "regions" JSONB,
                "severityThreshold" INTEGER NOT NULL DEFAULT 0,
                "impactThreshold" INTEGER NOT NULL DEFAULT 50,
                "keywords" JSONB,
                "deliveryMethod" TEXT NOT NULL DEFAULT 'web',
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "EnterpriseAlertRule_pkey" PRIMARY KEY ("id")
            );
        `);
        try {
            await prisma.$executeRawUnsafe(`
                ALTER TABLE "EnterpriseAlertRule" 
                ADD CONSTRAINT "EnterpriseAlertRule_userId_fkey" 
                FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
            `);
        } catch (e) { /* constraint might exist */ }

        // Add EnterpriseAlertLog Table
        console.log('Creating "EnterpriseAlertLog" table...');
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "EnterpriseAlertLog" (
                "id" TEXT NOT NULL,
                "ruleId" TEXT NOT NULL,
                "signalId" TEXT NOT NULL,
                "triggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "deliveryStatus" TEXT NOT NULL DEFAULT 'pending',
                CONSTRAINT "EnterpriseAlertLog_pkey" PRIMARY KEY ("id")
            );
        `);
        try {
            await prisma.$executeRawUnsafe(`
                ALTER TABLE "EnterpriseAlertLog" 
                ADD CONSTRAINT "EnterpriseAlertLog_ruleId_fkey" 
                FOREIGN KEY ("ruleId") REFERENCES "EnterpriseAlertRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
            `);
            await prisma.$executeRawUnsafe(`
                ALTER TABLE "EnterpriseAlertLog" 
                ADD CONSTRAINT "EnterpriseAlertLog_signalId_fkey" 
                FOREIGN KEY ("signalId") REFERENCES "MarketSignal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
            `);
        } catch (e) { /* constraint might exist */ }

        console.log('✔ Enterprise Intelligence tables created.');

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
