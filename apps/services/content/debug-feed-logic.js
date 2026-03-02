const axios = require('axios');

async function debugFeed() {
    console.log('--- Debugging Local Feed Endpoint ---');
    try {
        // Need to authenticate or skip check for local test 
        // Logic in index.js requires authenticateToken.
        // I'll use a raw prisma call to see what the merge logic would do.

        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();

        const [posts, announcements] = await Promise.all([
            prisma.post.findMany({
                take: 20,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: { include: { profile: true } },
                    media: true,
                    _count: { select: { replies: true, likes: true, retweets: true } }
                }
            }),
            prisma.announcement.findMany({ where: { status: 'published' }, take: 5, orderBy: { createdAt: 'desc' } })
        ]);

        console.log(`Prisma found: ${posts.length} posts, ${announcements.length} announcements.`);

        const annotatedAnnouncements = announcements.map(ann => ({
            ...ann,
            isOfficialAnnouncement: true
        }));

        const mergedFeed = [...posts, ...annotatedAnnouncements].sort((a, b) =>
            new Date(b.createdAt) - new Date(a.createdAt)
        );

        console.log(`Merged feed has ${mergedFeed.length} items.`);
        if (mergedFeed.length > 0) {
            console.log('First item type:', mergedFeed[0].isOfficialAnnouncement ? 'Announcement' : 'Post');
            console.log('First item title/content:', mergedFeed[0].title || mergedFeed[0].content);
        }

        await prisma.$disconnect();
    } catch (e) {
        console.error('Debug failed:', e.message);
    }
}

debugFeed();
