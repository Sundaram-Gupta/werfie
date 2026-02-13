const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const columns = await prisma.$queryRaw`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'Campaign';
        `;
        console.log('Columns in Campaign table:', JSON.stringify(columns, null, 2));

        const count = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "Campaign"`;
        console.log('Data count in Campaign table:', count);
    } catch (error) {
        console.error('Error querying Campaign:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
