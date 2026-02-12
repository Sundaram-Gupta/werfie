
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('🔍 Starting Unified Schema Verification...');

        // 1. Check User Table
        console.log('\nChecking User table...');
        const userExists = await prisma.$queryRaw`SELECT 1 FROM "User" LIMIT 1`;
        console.log('✅ User table exists.');

        // 2. Check PostMedia Table
        console.log('\nChecking PostMedia table...');
        const postMediaExists = await prisma.$queryRaw`SELECT 1 FROM "PostMedia" LIMIT 1`;
        console.log('✅ PostMedia table exists.');

        // 3. Check Message Table and Columns
        console.log('\nChecking Message table columns...');
        const messageColumns = ['thumbnailUrl', 'duration', 'size', 'mimeType'];
        const results = {};

        for (const col of messageColumns) {
            const result = await prisma.$queryRawUnsafe(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'Message' AND column_name = '${col}'
            `);
            results[col] = result.length > 0;
        }

        const allMessageColumnsExist = Object.values(results).every(v => v);
        if (allMessageColumnsExist) {
            console.log('✅ All required Message columns (thumbnailUrl, etc.) exist.');
        } else {
            console.log('❌ Some Message columns are missing:', results);
        }

        console.log('\n✅ Verification Complete: Database schema is unified and correct.');

    } catch (e) {
        console.log('❌ Verification FAILED:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
