const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🗑️ Dropping InstitutionalProfile table...');
    try {
        await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS "InstitutionalProfile" CASCADE');
        console.log('✅ Table dropped successfully.');
    } catch (e) {
        console.error('❌ Error dropping table:', e.message);
    }
}

main().finally(() => prisma.$disconnect());
