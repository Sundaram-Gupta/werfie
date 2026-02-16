const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const columns = await prisma.$queryRaw`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'Ad';
        `;
        console.log('Columns in Ad table:', JSON.stringify(columns, null, 2));
    } catch (error) {
        console.error('Error querying columns:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
