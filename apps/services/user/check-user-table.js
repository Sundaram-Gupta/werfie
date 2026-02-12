
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const result = await prisma.$queryRaw`SELECT 1 FROM "User" LIMIT 1`;
        console.log('✅ User table exists and is accessible.');
    } catch (e) {
        if (e.message.includes('relation "User" does not exist')) {
            console.log('❌ User table does not exist.');
        } else {
            console.log('⚠️ Error checking User table:', e.message);
        }
    } finally {
        await prisma.$disconnect();
    }
}

main();
