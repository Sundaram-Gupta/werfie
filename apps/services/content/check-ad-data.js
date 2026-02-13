const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        // Query using queryRaw to avoid Prisma schema validation issues
        const count = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "Ad"`;
        console.log('Data count in Ad table:', count);
    } catch (error) {
        console.error('Error counting data:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
