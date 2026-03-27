require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function tableCount(tableName) {
    try {
        const rows = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int AS count FROM "${tableName}"`);
        return { exists: true, count: rows?.[0]?.count ?? 0 };
    } catch (e) {
        return { exists: false, count: 0, error: e?.message };
    }
}

async function sample(tableName) {
    try {
        const rows = await prisma.$queryRawUnsafe(
            `SELECT "id", "userId", "title", "isPublished", "createdAt" FROM "${tableName}" ORDER BY "createdAt" DESC LIMIT 5`
        );
        return rows;
    } catch {
        return [];
    }
}

(async () => {
    const proper = await tableCount('Article');
    const legacy = await tableCount('article');

    console.log('Table status:', { Article: proper, article: legacy });
    if (proper.exists) console.log('Article sample:', await sample('Article'));
    if (legacy.exists) console.log('article sample:', await sample('article'));
})()
    .catch((e) => {
        console.error(e);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
