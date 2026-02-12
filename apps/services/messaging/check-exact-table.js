import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    console.log('🏁 Starting Exact Table Check...');
    const tests = [
        'SELECT count(*) FROM "Message"',
        'SELECT count(*) FROM public."Message"',
        'SELECT count(*) FROM message',
        'SELECT count(*) FROM public.message',
        'SELECT count(*) FROM "message"',
        'SELECT count(*) FROM public."message"'
    ];

    for (const sql of tests) {
        try {
            const res = await prisma.$queryRawUnsafe(sql);
            console.log(`✅ SUCCESS: ${sql}`, res);
        } catch (e) {
            console.log(`❌ FAILED:  ${sql} -> ${e.message.split('\n')[0]}`);
        }
    }

    try {
        const rawTbls = await prisma.$queryRawUnsafe(`
            SELECT n.nspname as schema, c.relname as table
            FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE c.relname ILIKE '%message%'
        `);
        console.log('🔍 exact pg_class match:', rawTbls);
    } catch (e) {
        console.error('❌ pg_class error:', e.message);
    }
}

main().finally(() => prisma.$disconnect());
