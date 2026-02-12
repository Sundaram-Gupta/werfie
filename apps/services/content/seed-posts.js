const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Seed Posts Version 2 (Separate Media Creation)');
        // 1. Get a user
        const user = await prisma.user.findFirst();
        if (!user) {
            console.error('No users found. Please run seed-users.js first.');
            process.exit(1);
        }
        console.log(`Creating posts for user: ${user.email} (${user.id})`);

        // 2. Create 10 posts
        for (let i = 1; i <= 10; i++) {
            const imageUrl = `https://picsum.photos/seed/${i + Date.now()}/800/600`;

            const post = await prisma.post.create({
                data: {
                    userId: user.id,
                    content: `Werfie Explore #${i}: Discovering the world, one post at a time! 🌍✨ #explore #nature #image${i}`,
                }
            });

            try {
                // Try to create media entry separately
                // We use raw query as backup if prisma.postMedia is not generated
                await prisma.$executeRaw`
                    INSERT INTO "PostMedia" ("id", "postId", "mediaType", "mediaUrl", "width", "height", "size", "createdAt")
                    VALUES (gen_random_uuid(), ${post.id}, 'image', ${imageUrl}, 800, 600, 51200, NOW())
                `;
            } catch (mediaError) {
                console.warn(`Failed to create media for post ${post.id}:`, mediaError.message);
            }

            console.log(`Created Post ${i}: ${post.id}`);
        }

        console.log('Successfully created 10 posts with images.');

    } catch (error) {
        console.error('Error seeding posts:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
