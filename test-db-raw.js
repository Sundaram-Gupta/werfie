const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testFetch() {
    try {
        console.log('Testing raw SQL on VerificationRequest...');
        const res = await prisma.$queryRaw`SELECT * FROM "VerificationRequest" LIMIT 1`;
        console.log('SQL Result:', JSON.stringify(res, null, 2));
    } catch (e) {
        console.error('SQL Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

testFetch();
