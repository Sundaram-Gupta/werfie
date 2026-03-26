const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSchema() {
    try {
        const res = await prisma.$queryRaw`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'VerificationRequest'
        `;
        console.log('Schema:', JSON.stringify(res, null, 2));
    } catch (e) {
        console.error('Schema Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

checkSchema();
