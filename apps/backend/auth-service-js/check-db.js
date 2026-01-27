const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
    try {
        const users = await prisma.user.count();
        const posts = await prisma.post.count();
        const trends = await prisma.trend.count();
        const communities = await prisma.community.count();
        const spaces = await prisma.space.count();
        const notifications = await prisma.notification.count();
        const likes = await prisma.like.count();
        const follows = await prisma.follow.count();

        console.log('📊 Database Counts:');
        console.log(`  Users: ${users}`);
        console.log(`  Posts: ${posts}`);
        console.log(`  Trends: ${trends}`);
        console.log(`  Communities: ${communities}`);
        console.log(`  Spaces: ${spaces}`);
        console.log(`  Notifications: ${notifications}`);
        console.log(`  Likes: ${likes}`);
        console.log(`  Follows: ${follows}`);

        if (users === 0) {
            console.log('\n❌ No users found - need to run seed-dummy-data.js');
        }
        if (posts === 0) {
            console.log('\n❌ No posts found - need to run seed-dummy-data.js');
        }
        if (trends === 0) {
            console.log('\n❌ No trends found - need to run seed-trends.js');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkData();
