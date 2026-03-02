const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('📊 Checking exact column names in InstitutionalProfile...');
    try {
        const result = await prisma.$queryRawUnsafe(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'InstitutionalProfile'
            ORDER BY column_name
        `);
        console.log('COLUMN_LIST_JSON:', JSON.stringify(result.map(r => r.column_name)));
    } catch (e) {
        console.error('❌ Error:', e.message);
    }
}

main().finally(() => prisma.$disconnect());
