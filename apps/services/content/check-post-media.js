
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Checking PostMedia table...');
        const postMedia = await prisma.$queryRaw`SELECT 1 FROM "PostMedia" LIMIT 1`;
        console.log('✅ PostMedia table exists.');

        console.log('Checking mediaUrls column in Post table...');
        const postColumns = await prisma.$queryRaw`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'Post' AND column_name = 'mediaUrls'
        `;

        if (postColumns.length > 0) {
            console.log('✅ mediaUrls column exists in Post table.');
        } else {
            console.log('❌ mediaUrls column MISSING in Post table.');
        }

    } catch (e) {
        if (e.message.includes('does not exist')) {
            console.log('❌ Table or column check failed:', e.message);
        } else {
            console.log('⚠️ Error during verification:', e.message);
        }
    } finally {
        await prisma.$disconnect();
    }
}

main();
