const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('📊 Dumping row keys from InstitutionalProfile...');
    try {
        const result = await prisma.$queryRawUnsafe('SELECT * FROM "InstitutionalProfile" LIMIT 1');
        if (result.length > 0) {
            console.log('Row Keys:', Object.keys(result[0]));
        } else {
            // If empty, insert a dummy and check
            console.log('Table empty. Checking status of a mock insert...');
            const columns = await prisma.$queryRawUnsafe(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'InstitutionalProfile'
            `);
            console.log('Information Schema says:', columns.map(c => c.column_name));
        }
    } catch (e) {
        console.error('❌ Error:', e.message);
    }
}

main().finally(() => prisma.$disconnect());
