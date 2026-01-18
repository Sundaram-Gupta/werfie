const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding Follow Relationships...');

    // Get all users
    const users = await prisma.user.findMany({
        select: { id: true },
        take: 50
    });

    if (users.length < 2) {
        console.log('Not enough users to create follow relationships');
        return;
    }

    console.log(`Found ${users.length} users`);

    // Create follow relationships
    // Each user will follow 3-8 random other users
    const followsCreated = [];

    for (const user of users) {
        // Random number of follows between 3 and 8
        const numFollows = Math.floor(Math.random() * 6) + 3;

        // Get random users to follow (excluding self)
        const otherUsers = users.filter(u => u.id !== user.id);
        const shuffled = otherUsers.sort(() => 0.5 - Math.random());
        const toFollow = shuffled.slice(0, numFollows);

        for (const followUser of toFollow) {
            try {
                // Check if already following
                const existing = await prisma.follow.findFirst({
                    where: {
                        followerId: user.id,
                        followingId: followUser.id
                    }
                });

                if (!existing) {
                    await prisma.follow.create({
                        data: {
                            followerId: user.id,
                            followingId: followUser.id
                        }
                    });
                    followsCreated.push({ followerId: user.id, followingId: followUser.id });
                }
            } catch (e) {
                // Ignore duplicates
                if (e.code !== 'P2002') {
                    console.error('Error creating follow:', e.message);
                }
            }
        }
    }

    console.log(`✅ Created ${followsCreated.length} follow relationships`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
