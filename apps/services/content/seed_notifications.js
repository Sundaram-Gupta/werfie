const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding notifications...');

    // 1. Get the main test user (Recipient)
    let user = await prisma.user.findUnique({
        where: { email: 'john@example.com' },
    });

    if (!user) {
        console.log('User john@example.com not found. Creating...');
        user = await prisma.user.create({
            data: {
                email: 'john@example.com',
                passwordHash: 'hashed_password_placeholder', // Not used for login here
                profile: {
                    create: {
                        name: 'John Doe',
                        handle: 'johndoe',
                        bio: 'Just a regular user',
                    },
                },
            },
        });
    }

    console.log(`Targeting user: ${user.email} (${user.id})`);

    // 2. Create/Get Actor Users (Verified and Unverified)
    const actorsData = [
        { email: 'elon@x.com', handle: 'elonmusk', name: 'Elon Musk', isVerified: true },
        { email: 'user1@test.com', handle: 'user1', name: 'User One', isVerified: false },
        { email: 'user2@test.com', handle: 'user2', name: 'User Two', isVerified: false },
        { email: 'verified_fan@test.com', handle: 'verified_fan', name: 'Verified Fan', isVerified: true },
    ];

    const actors = [];
    for (const actorData of actorsData) {
        let actor = await prisma.user.findUnique({ where: { email: actorData.email } });
        if (!actor) {
            actor = await prisma.user.create({
                data: {
                    email: actorData.email,
                    passwordHash: 'placeholder',
                    profile: {
                        create: {
                            name: actorData.name,
                            handle: actorData.handle,
                            isVerified: actorData.isVerified,
                            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${actorData.handle}`,
                        },
                    },
                },
            });
        } else {
            // Ensure verification status is correct
            await prisma.profile.update({
                where: { userId: actor.id },
                data: { isVerified: actorData.isVerified }
            });
        }
        actors.push(actor);
    }

    // 3. Create a post for the main user to receive interactions on
    let post = await prisma.post.findFirst({ where: { userId: user.id } });
    if (!post) {
        post = await prisma.post.create({
            data: {
                userId: user.id,
                content: 'Hello World! This is my first post.',
            }
        });
    }

    // 4. Create Notifications
    const notifications = [
        // Mentions (from Unverified and Verified)
        { type: 'mention', actor: actors[1], message: "Hey @johndoe, check this out!" },
        { type: 'mention', actor: actors[0], message: "Great work @johndoe!" }, // Verified mention

        // Likes (Verified and Unverified)
        { type: 'like', actor: actors[2], postId: post.id },
        { type: 'like', actor: actors[3], postId: post.id }, // Verified like

        // Reposts (Retweet)
        { type: 'retweet', actor: actors[1], postId: post.id },

        // Follows
        { type: 'follow', actor: actors[2] },
        { type: 'follow', actor: actors[0] }, // Verified follow

        // Replies
        { type: 'reply', actor: actors[1], postId: post.id, message: "Nice post!" },
    ];

    for (const notif of notifications) {
        // Create interaction if needed (Like, Follow, etc.) provided schema constraints aren't violated
        // For simplicity, we just create the Notification record directly as that's what drives the UI.
        // In a real app, the business logic triggers this. Here we just seed the Notification table.

        // But wait to satisfy foreign keys, like/retweet/follow records might need to exist if we strictly enforced it, 
        // but Notification table only links to User/Post. It doesn't link to Like/Retweet tables directly.

        await prisma.notification.create({
            data: {
                userId: user.id,
                actorId: notif.actor.id,
                type: notif.type,
                postId: notif.postId,
                read: false,
            }
        });
        console.log(`Created ${notif.type} notification from ${notif.actor.email}`);
    }

    console.log('Seeding completed!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
