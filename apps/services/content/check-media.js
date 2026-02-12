const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkMedia() {
    try {
        // Check for posts with media
        const postsWithMedia = await prisma.post.findMany({
            include: {
                media: true,
                user: {
                    select: {
                        id: true,
                        profile: {
                            select: { name: true, handle: true }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 5
        });

        console.log('\n=== Posts with Media ===');
        postsWithMedia.forEach(post => {
            console.log(`\nPost ID: ${post.id}`);
            console.log(`User: ${post.user?.profile?.name || 'Unknown'}`);
            console.log(`Content: ${post.content.substring(0, 50)}...`);
            console.log(`Media Count: ${post.media.length}`);
            if (post.media.length > 0) {
                post.media.forEach((m, i) => {
                    console.log(`  Media ${i + 1}:`);
                    console.log(`    Type: ${m.mediaType}`);
                    console.log(`    URL: ${m.mediaUrl}`);
                    console.log(`    Dimensions: ${m.width}x${m.height}`);
                });
            }
        });

        // Check total media count
        const totalMedia = await prisma.postMedia.count();
        console.log(`\n=== Total Media Records: ${totalMedia} ===\n`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkMedia();
