import { PrismaClient } from '@prisma/client'
import fs from 'fs'

const prisma = new PrismaClient()

async function main() {
    let log = '🧪 STARTING SELF-VALIDATING PATCH\n';
    try {
        // 1. Initial State
        const before = await prisma.$queryRawUnsafe('SELECT id FROM "Conversation" WHERE "lastMessageAt" IS NULL');
        log += `🔍 Before: Found ${before.length} nulls.\n`;

        if (before.length > 0) {
            for (const row of before) {
                log += `🛠️ Patching ${row.id} via raw query...\n`;
                const upd = await prisma.$executeRawUnsafe(`UPDATE "Conversation" SET "lastMessageAt" = NOW() WHERE id = '${row.id}'`);
                log += `✅ Affected rows: ${upd}\n`;
            }
        }

        // 2. Final State
        const after = await prisma.$queryRawUnsafe('SELECT id FROM "Conversation" WHERE "lastMessageAt" IS NULL');
        log += `🔍 After: ${after.length} nulls remain.\n`;

        if (after.length === 0) {
            log += '🎉 SUCCESS: All records patched!\n';
        } else {
            log += '❌ FAILURE: Some records still null.\n';
        }

    } catch (e) {
        log += `❌ CRITICAL ERROR: ${e.message}\n`;
    } finally {
        fs.writeFileSync('patch-verify.txt', log);
        await prisma.$disconnect();
        console.log('Done. check patch-verify.txt');
    }
}

main();
