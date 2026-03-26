const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
    try {
        console.log('--- Institutional Profiles ---');
        const insts = await prisma.institutionalProfile.findMany({
            include: { user: true },
            take: 5
        });
        insts.forEach(i => {
            console.log(`User: ${i.user.email}, Inst: ${i.institutionName}, Display: ${i.publicDisplayName}`);
        });

        console.log('\n--- Users with NULL profiles ---');
        const usersNoProfile = await prisma.user.findMany({
            where: { profile: null },
            take: 5
        });
        usersNoProfile.forEach(u => {
            console.log(`User: ${u.email}, ID: ${u.id}`);
        });

        console.log('\n--- Media Posts ---');
        const mediaPosts = await prisma.post.findMany({
            where: { media: { some: {} } },
            include: { media: true },
            take: 5
        });
        mediaPosts.forEach(p => {
            console.log(`Post: ${p.id}, Media Count: ${p.media.length}`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}

checkData();
