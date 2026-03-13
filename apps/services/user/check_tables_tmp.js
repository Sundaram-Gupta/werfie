const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        const tables = await prisma.$queryRaw`SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'`;
        console.log('Tables in public schema:');
        console.log(JSON.stringify(tables, null, 2));
        
        // Check WorldLeader specifically
        const hasWorldLeader = tables.some(t => t.tablename === 'WorldLeader');
        console.log('\nWorldLeader table exists:', hasWorldLeader);
        
        if (!hasWorldLeader) {
            console.log('CRITICAL: WorldLeader table is missing from the database!');
        }
    } catch (err) {
        console.error('Error checking tables:', err);
    } finally {
        await prisma.$disconnect();
    }
}

check();
