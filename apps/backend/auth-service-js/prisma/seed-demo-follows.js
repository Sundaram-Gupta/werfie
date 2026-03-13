const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedDemoFollows() {
    console.log('🔄 Seeding follows for demo user...');

    try {
        const demoUser = await prisma.user.findFirst({ where: { email: 'demo@xclone.com' } });
        if (!demoUser) throw new Error('Demo user not found');

        const otherUsers = await prisma.user.findMany({
            where: { id: { not: demoUser.id } },
            take: 20
        });

        console.log(`Found ${otherUsers.length} other users.`);

        // Demo user follows others
        let following = 0;
        for (let i = 0; i < 10; i++) {
            try {
                await prisma.follow.create({
                    data: {
                        followerId: demoUser.id,
                        followingId: otherUsers[i].id
                    }
                });
                following++;
            } catch (e) { }
        }

        // Others follow demo user
        let followers = 0;
        for (let i = 10; i < 20; i++) {
            try {
                await prisma.follow.create({
                    data: {
                        followerId: otherUsers[i].id,
                        followingId: demoUser.id
                    }
                });
                followers++;
            } catch (e) { }
        }

        console.log(`✅ Demo user now following ${following} users.`);
        console.log(`✅ Demo user now has ${followers} followers.`);

        // Also ensure some notifications are created for these new follows
        const follows = await prisma.follow.findMany({
            where: { OR: [{ followerId: demoUser.id }, { followingId: demoUser.id }] }
        });

        let notifs = 0;
        for (const f of follows) {
            try {
                await prisma.notification.create({
                    data: {
                        userId: f.followingId,
                        type: 'follow',
                        actorId: f.followerId
                    }
                });
                notifs++;
            } catch (e) { }
        }
        console.log(`✅ Created ${notifs} follow notifications.`);

    } catch (error) {
        console.error('❌ Error seeding demo follows:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seedDemoFollows();
