const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('📊 Checking InstitutionalProfile table columns...');
    try {
        const columns = await prisma.$queryRawUnsafe(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'InstitutionalProfile'
        `);
        console.log('Columns found:');
        columns.forEach(c => console.log(`- ${c.column_name} (${c.data_type})`));
    } catch (e) {
        console.error('❌ Error:', e.message);
    }
}

main().finally(() => prisma.$disconnect());
