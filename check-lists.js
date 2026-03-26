const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLists() {
    try {
        const publicLists = await prisma.list.findMany({
            where: { isPrivate: false },
            select: { id: true, name: true, ownerId: true }
        });
        console.log('Public Lists:', JSON.stringify(publicLists, null, 2));

        const users = await prisma.user.findMany({
            select: { id: true, email: true }
        });
        console.log('Users:', JSON.stringify(users, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkLists();
