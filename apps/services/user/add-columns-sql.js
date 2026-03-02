const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Manually adding missing columns to InstitutionalProfile...');

    const queries = [
        `ALTER TABLE "InstitutionalProfile" ADD COLUMN IF NOT EXISTS "country" TEXT`,
        `ALTER TABLE "InstitutionalProfile" ADD COLUMN IF NOT EXISTS "state" TEXT`,
        `ALTER TABLE "InstitutionalProfile" ADD COLUMN IF NOT EXISTS "officialEmailDomain" TEXT`,
        `ALTER TABLE "InstitutionalProfile" ADD COLUMN IF NOT EXISTS "bannerUrl" TEXT`,
        `ALTER TABLE "InstitutionalProfile" ADD COLUMN IF NOT EXISTS "repFullName" TEXT`,
        `ALTER TABLE "InstitutionalProfile" ADD COLUMN IF NOT EXISTS "repJobTitle" TEXT`,
        `ALTER TABLE "InstitutionalProfile" ADD COLUMN IF NOT EXISTS "repDepartment" TEXT`,
        `ALTER TABLE "InstitutionalProfile" ADD COLUMN IF NOT EXISTS "repOfficialEmail" TEXT`,
        `ALTER TABLE "InstitutionalProfile" ADD COLUMN IF NOT EXISTS "repPhone" TEXT`,
        `ALTER TABLE "InstitutionalProfile" ADD COLUMN IF NOT EXISTS "repIdUrl" TEXT`,
        `ALTER TABLE "InstitutionalProfile" ADD COLUMN IF NOT EXISTS "repLinkedInUrl" TEXT`,
        `ALTER TABLE "InstitutionalProfile" ADD COLUMN IF NOT EXISTS "repAuthLetterUrl" TEXT`,
        `ALTER TABLE "InstitutionalProfile" ADD COLUMN IF NOT EXISTS "twoFactorEnabled" BOOLEAN DEFAULT false`,
        `ALTER TABLE "InstitutionalProfile" ADD COLUMN IF NOT EXISTS "primaryRole" TEXT DEFAULT 'publisher'`,
        `ALTER TABLE "InstitutionalProfile" ADD COLUMN IF NOT EXISTS "recoveryEmail" TEXT`,
        `ALTER TABLE "InstitutionalProfile" ADD COLUMN IF NOT EXISTS "recoveryPhone" TEXT`,
        `ALTER TABLE "InstitutionalProfile" ADD COLUMN IF NOT EXISTS "isDomainVerified" BOOLEAN DEFAULT false`,
        `ALTER TABLE "InstitutionalProfile" ADD COLUMN IF NOT EXISTS "supportingDocs" JSONB`,
        `ALTER TABLE "InstitutionalProfile" ADD COLUMN IF NOT EXISTS "transparencyAccepted" BOOLEAN DEFAULT false`,
        `ALTER TABLE "InstitutionalProfile" ADD COLUMN IF NOT EXISTS "termsAccepted" BOOLEAN DEFAULT false`,
        `ALTER TABLE "InstitutionalProfile" ADD COLUMN IF NOT EXISTS "publicDisplayName" TEXT`,
        `ALTER TABLE "InstitutionalProfile" ADD COLUMN IF NOT EXISTS "publicBio" TEXT`,
        `ALTER TABLE "InstitutionalProfile" ADD COLUMN IF NOT EXISTS "headquarters" TEXT`,
        `ALTER TABLE "InstitutionalProfile" ADD COLUMN IF NOT EXISTS "categories" JSONB`,
        `ALTER TABLE "InstitutionalProfile" ADD COLUMN IF NOT EXISTS "languages" JSONB`,
        `ALTER TABLE "InstitutionalProfile" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'pending'`,
        `ALTER TABLE "InstitutionalProfile" ADD COLUMN IF NOT EXISTS "adminNotes" TEXT`,
        `ALTER TABLE "InstitutionalProfile" ADD COLUMN IF NOT EXISTS "badgeType" TEXT`
    ];

    for (const query of queries) {
        try {
            await prisma.$executeRawUnsafe(query);
            console.log(`✅ Success: ${query.substring(0, 50)}...`);
        } catch (e) {
            console.error(`❌ Failed: ${query.substring(0, 50)}...`, e.message);
        }
    }
}

main().finally(() => prisma.$disconnect());
