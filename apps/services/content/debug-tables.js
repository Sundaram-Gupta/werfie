const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('📊 Checking tables in Content Service DB...');
    try {
        const tables = await prisma.$queryRawUnsafe(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        console.log('Tables found:');
        tables.forEach(t => console.log(`- ${t.table_name}`));

        const hasAnnouncement = tables.some(t => t.table_name.toLowerCase() === 'announcement');
        console.log(`\nHas Announcement table: ${hasAnnouncement}`);
    } catch (e) {
        console.error('❌ Error:', e.message);
    }
}

main().finally(() => prisma.$disconnect());
