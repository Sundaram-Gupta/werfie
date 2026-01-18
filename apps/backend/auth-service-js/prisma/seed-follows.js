const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Creating follow relationships...');

    // Get some users
    const users = await prisma.user.findMany({
        take: 20,
        orderBy: { createdAt: 'asc' }
    });

    if (users.length < 2) {
        console.log('❌ Not enough users to create follow relationships');
        return;
    }

    let created = 0;

    // Create follow relationships
    // User 1 follows users 2-10
    for (let i = 1; i < Math.min(10, users.length); i++) {
        try {
            await prisma.follow.create({
                data: {
                    followerId: users[0].id,
                    followingId: users[i].id,
                }
            });
            created++;
        } catch (error) {
            if (error.code === 'P2002') {
                console.log(`⚠️  Follow relationship already exists`);
            } else {
                console.error(`❌ Error:`, error.message);
            }
        }
    }

    // User 2 follows users 3-8
    for (let i = 2; i < Math.min(8, users.length); i++) {
        try {
            await prisma.follow.create({
                data: {
                    followerId: users[1].id,
                    followingId: users[i].id,
                }
            });
            created++;
        } catch (error) {
            if (error.code === 'P2002') {
                // Already exists
            }
        }
    }

    // User 3 follows users 1, 4-7
    try {
        await prisma.follow.create({
            data: {
                followerId: users[2].id,
                followingId: users[0].id,
            }
        });
        created++;
    } catch (error) { }

    for (let i = 3; i < Math.min(7, users.length); i++) {
        try {
            await prisma.follow.create({
                data: {
                    followerId: users[2].id,
                    followingId: users[i].id,
                }
            });
            created++;
        } catch (error) { }
    }

    const totalFollows = await prisma.follow.count();
    console.log(`✅ Created ${created} new follow relationships`);
    console.log(`📊 Total follow relationships: ${totalFollows}`);

    // Show some stats
    const user1Follows = await prisma.follow.count({
        where: { followerId: users[0].id }
    });
    console.log(`\n👤 ${users[0].email} is following ${user1Follows} users`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
