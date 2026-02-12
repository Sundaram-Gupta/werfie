import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    console.log('🔍 Inspecting public."Participant" columns...');
    try {
        const cols = await prisma.$queryRawUnsafe(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'Participant'
            ORDER BY ordinal_position
        `);
        console.log('📊 Participant columns:');
        cols.forEach(c => console.log(`- [${c.column_name}]`));
    } catch (e) {
        console.error('❌ Error:', e.message);
    }
}

main().finally(() => prisma.$disconnect());
