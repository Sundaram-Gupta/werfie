const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Database Table Inspection ---');
    try {
        const tables = await prisma.$queryRawUnsafe(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `);
        console.log('Tables found in "public" schema:');
        tables.forEach(t => console.log(`- "${t.table_name}"`));

        const modelMatch = tables.find(t => t.table_name.toLowerCase() === 'announcement');
        if (modelMatch) {
            console.log(`\nMatch found! Exact name in DB: "${modelMatch.table_name}"`);
        } else {
            console.log('\n❌ No table matching "announcement" (case-insensitive) found.');
        }

    } catch (e) {
        console.error('❌ Error querying database:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
