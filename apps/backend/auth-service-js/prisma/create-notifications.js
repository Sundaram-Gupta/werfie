const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createNotifications() {
    console.log('📬 Creating notifications from existing interactions...');

    try {
        // Get all likes and create notifications
        const likes = await prisma.like.findMany({
            include: {
                post: true
            }
        });

        let likeNotifs = 0;
        for (const like of likes) {
            // Don't notify if user liked their own post
            if (like.userId !== like.post.userId) {
                try {
                    await prisma.notification.create({
                        data: {
                            userId: like.post.userId,
                            type: 'like',
                            actorId: like.userId,
                            postId: like.postId
                        }
                    });
                    likeNotifs++;
                } catch (error) {
                    // Skip duplicates
                }
            }
        }
        console.log(`✅ Created ${likeNotifs} like notifications`);

        // Get all follows and create notifications
        const follows = await prisma.follow.findMany();

        let followNotifs = 0;
        for (const follow of follows) {
            try {
                await prisma.notification.create({
                    data: {
                        userId: follow.followingId,
                        type: 'follow',
                        actorId: follow.followerId
                    }
                });
                followNotifs++;
            } catch (error) {
                // Skip duplicates
            }
        }
        console.log(`✅ Created ${followNotifs} follow notifications`);

        // Get all replies and create notifications
        const replies = await prisma.post.findMany({
            where: {
                replyToId: { not: null }
            },
            include: {
                replyTo: true
            }
        });

        let replyNotifs = 0;
        for (const reply of replies) {
            if (reply.replyTo && reply.userId !== reply.replyTo.userId) {
                try {
                    await prisma.notification.create({
                        data: {
                            userId: reply.replyTo.userId,
                            type: 'reply',
                            actorId: reply.userId,
                            postId: reply.id
                        }
                    });
                    replyNotifs++;
                } catch (error) {
                    // Skip duplicates
                }
            }
        }
        console.log(`✅ Created ${replyNotifs} reply notifications`);

        const totalNotifs = likeNotifs + followNotifs + replyNotifs;
        console.log(`\n🎉 Total notifications created: ${totalNotifs}`);

    } catch (error) {
        console.error('❌ Error creating notifications:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createNotifications();
