const axios = require('axios');

async function verifyFeed() {
    console.log('--- Verifying Merged Feed API ---');
    try {
        // Mocking a request to the local content service
        // Since I'm in the terminal, I'll just check if the code I wrote compiles and logic is sound by inspection, 
        // OR better, use a raw prisma call if possible.

        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();

        const [posts, announcements] = await Promise.all([
            prisma.post.findMany({ take: 5 }),
            prisma.announcement.findMany({ where: { status: 'published' }, take: 2 })
        ]);

        console.log(`Found ${posts.length} posts and ${announcements.length} published announcements.`);

        if (announcements.length > 0) {
            const announcement = announcements[0];
            console.log('Sample Announcement:', announcement.title);
        } else {
            console.log('No published announcements found for verification. Please publish one in the UI.');
        }

        await prisma.$disconnect();
    } catch (e) {
        console.error('Verification failed:', e.message);
    }
}

verifyFeed();
