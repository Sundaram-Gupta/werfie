const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const users = await prisma.user.count();
        const posts = await prisma.post.count();
        const trends = await prisma.trend.count();
        const communities = await prisma.community.count();
        const conversations = await prisma.conversation.count();
        const notifications = await prisma.notification.count();

        console.log('--- Database Stats ---');
        console.log(`Users: ${users}`);
        console.log(`Posts: ${posts}`);
        console.log(`Trends: ${trends}`);
        console.log(`Communities: ${communities}`);
        console.log(`Conversations: ${conversations}`);
        console.log(`Notifications: ${notifications}`);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
