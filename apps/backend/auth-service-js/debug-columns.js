const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('📊 Checking User table columns...');
    try {
        const columns = await prisma.$queryRawUnsafe(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'User'
        `);
        console.log('Columns found in User table:');
        columns.forEach(c => console.log(`- ${c.column_name} (${c.data_type})`));

        const hasInstitutionType = columns.some(c => c.column_name === 'institutionType');
        console.log(`\nHas institutionType: ${hasInstitutionType}`);
    } catch (e) {
        console.error('❌ Error:', e.message);
    }
}

main().finally(() => prisma.$disconnect());
