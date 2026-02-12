
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Checking Message table columns...');
        const columns = ['thumbnailUrl', 'duration', 'size', 'mimeType'];
        const results = {};

        for (const col of columns) {
            const result = await prisma.$queryRawUnsafe(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'Message' AND column_name = '${col}'
            `);
            results[col] = result.length > 0;
        }

        console.log('Results:', results);

        const allExists = Object.values(results).every(v => v);
        if (allExists) {
            console.log('✅ All required Message columns exist.');
        } else {
            console.log('❌ Some columns are missing.');
        }

    } catch (e) {
        console.log('⚠️ Error during verification:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
