const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        console.log('--- TABLES ---');
        const tables = await prisma.$queryRawUnsafe("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log(JSON.stringify(tables, null, 2));

        console.log('\n--- VERIFICATIONREQUEST COLUMNS ---');
        const columns = await prisma.$queryRawUnsafe("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'VerificationRequest'");
        console.log(JSON.stringify(columns, null, 2));

        console.log('\n--- VERIFICATION DATA CHECK ---');
        const data = await prisma.$queryRawUnsafe("SELECT * FROM \"VerificationRequest\" LIMIT 1");
        console.log(JSON.stringify(data, null, 2));

    } catch (e) {
        console.error('Check failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
