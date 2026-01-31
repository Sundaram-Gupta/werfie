const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const userCount = await prisma.user.count();
    const postCount = await prisma.post.count();
    const reportCount = await prisma.report.count();
    const communityCount = await prisma.community.count();

    console.log('User Count:', userCount);
    console.log('Post Count:', postCount);
    console.log('Report Count:', reportCount);
    console.log('Community Count:', communityCount);

    const reportTypes = await prisma.report.groupBy({
        by: ['type'],
        _count: {
            id: true
        }
    });
    console.log('Report Types:', reportTypes);

    const recentReports = await prisma.report.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
            reporter: {
                include: {
                    profile: true
                }
            }
        }
    });
    console.log('Recent Reports:', JSON.stringify(recentReports, null, 2));

    const recentUsers = await prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
            profile: true
        }
    });
    console.log('Recent Users:', JSON.stringify(recentUsers, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
