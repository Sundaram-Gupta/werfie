const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testUpdate() {
    const id = '027f7012-3ae6-4272-bf6e-0d73bdc5efd4';
    const status = 'APPROVED';
    const notes = 'Testing from CLI';

    try {
        console.log(`Starting test update for ID: ${id}`);
        
        // Try the exact same raw SQL with extra logging
        const result = await prisma.$executeRaw`
            UPDATE "VerificationRequest"
            SET status = CAST(${status} AS TEXT), notes = CAST(${notes} AS TEXT), "updatedAt" = NOW()
            WHERE id = CAST(${id} AS UUID)
        `;
        
        console.log('Update result rows affected:', result);

    } catch (e) {
        console.error('Update FAILED with error:');
        console.error(e);
        if (e.meta) console.error('Meta:', e.meta);
        if (e.code) console.error('Code:', e.code);
    } finally {
        await prisma.$disconnect();
    }
}

testUpdate();
