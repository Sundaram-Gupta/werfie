const { PrismaClient } = require('./apps/services/content/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Starting seed...');

    const emailSuffix = Math.floor(Math.random() * 10000);

    // 1. Create a Verified User
    const verifiedUser = await prisma.user.create({
        data: {
            email: `verified_star_${emailSuffix}@example.com`,
            passwordHash: 'hashed_password', // Mock hash
            profile: {
                create: {
                    name: "Elon Clone",
                    handle: `elon_${emailSuffix}`,
                    bio: "Building chips for brains.",
                    avatar: "https://github.com/shadcn.png",
                    isVerified: true
                }
            }
        },
        include: { profile: true }
    });
    console.log(`Created Verified User: ${verifiedUser.profile.handle}`);

    // 2. Create a Regular User (The one receiving notifications - let's find the 'biz' owner from previous step or create new)
    // For this seed, we'll create a new "Active User" to log in as.
    const activeUser = await prisma.user.create({
        data: {
            email: `active_user_${emailSuffix}@example.com`,
            passwordHash: 'hashed_password',
            profile: {
                create: {
                    name: "Active Reader",
                    handle: `reader_${emailSuffix}`,
                    bio: "I read notifications.",
                    isVerified: false
                }
            }
        },
        include: { profile: true }
    });
    console.log(`Created Active User (Recipient): ${activeUser.profile.handle}`);

    // 3. Create a Post for Active User
    const post = await prisma.post.create({
        data: {
            userId: activeUser.id,
            content: "Just setting up my X clone profile! #coding"
        }
    });

    // 4. Generate Verified Notification (Verified User follows Active User)
    await prisma.follow.create({
        data: {
            followerId: verifiedUser.id,
            followingId: activeUser.id
        }
    });

    // Create 'follow' notification manually since no API triggered it
    await prisma.notification.create({
        data: {
            userId: activeUser.id,
            type: 'follow',
            actorId: verifiedUser.id,
            read: false
        }
    });
    console.log('Created Verified Follow Notification');

    // 5. Generate Mention Notification
    // Verified user mentions Active User in a post
    const mentionPost = await prisma.post.create({
        data: {
            userId: verifiedUser.id,
            content: `Hey @${activeUser.profile.handle}, welcome to the platform!`,
        }
    });

    await prisma.notification.create({
        data: {
            userId: activeUser.id,
            type: 'mention',
            actorId: verifiedUser.id,
            postId: mentionPost.id,
            read: false
        }
    });
    console.log('Created Mention Notification');

    // 6. Generate Verified Like (Verified User likes Active User's post)
    await prisma.like.create({
        data: { userId: verifiedUser.id, postId: post.id }
    });

    await prisma.notification.create({
        data: {
            userId: activeUser.id,
            type: 'like',
            actorId: verifiedUser.id,
            postId: post.id,
            read: false
        }
    });
    console.log('Created Verified Like Notification');

    console.log('Seed completed.');
    console.log('==========================================');
    console.log('LOGIN AS: ');
    console.log(`Email: active_user_${emailSuffix}@example.com`);
    console.log('Password: (You need to register this user properly via API to get a real password hash/token, or use existing user)');
    console.log('BUT: Since this script sets a mock hash, you cannot log in efficiently.');
    console.log('BETTER APPROACH: Use existing user logic or just creating notifications for ALL users?');
    console.log('Let\'s create notifications for the last created user in the DB to make it easy.');

}

// Improved Logic: Fetch the most recent user and give them notifications
async function seedForLatestUser() {
    const latestUser = await prisma.user.findFirst({
        orderBy: { createdAt: 'desc' }
    });

    if (!latestUser) {
        console.log("No users found. Run verify_business.js first.");
        return;
    }

    console.log(`Seeding notifications for latest user: ${latestUser.email}`);

    const emailSuffix = Math.floor(Math.random() * 10000);
    const verifiedUser = await prisma.user.create({
        data: {
            email: `verified_${emailSuffix}@example.com`,
            passwordHash: 'hashed',
            profile: {
                create: {
                    name: "Verified Celeb",
                    handle: `celeb_${emailSuffix}`,
                    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=2576&auto=format&fit=crop",
                    isVerified: true
                }
            }
        }
    });

    // 1. Verified Follow
    await prisma.notification.create({
        data: {
            userId: latestUser.id,
            type: 'follow',
            actorId: verifiedUser.id
        }
    });

    // 2. Mention
    const post = await prisma.post.create({
        data: {
            userId: verifiedUser.id,
            content: "Shoutout to the new joiners!"
        }
    });

    await prisma.notification.create({
        data: {
            userId: latestUser.id,
            type: 'mention',
            actorId: verifiedUser.id,
            postId: post.id
        }
    });

    console.log("Seeded notifications.");
}

seedForLatestUser()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
