const AnnouncementService = require('./src/services/announcement.service');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyAnnouncementSystem() {
    console.log('--- Verifying Official Announcement System ---');

    const testUserId = 'test-admin-user-id'; // Mock ID
    const testData = {
        institutionId: 'mock-institution-id',
        title: 'Security Protocol: Emergency Response v2.4',
        content: 'This is a strictly confidential document containing official emergency procedures. Authority signature required for physical distribution.',
        severityLevel: 4,
        category: 'Security',
        regions: ['International', 'APAC'],
        effectiveDate: new Date(),
        expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365), // 1 year
        livestreamUrl: 'https://official.werfie.com/live/emergency',
        status: 'published'
    };

    try {
        console.log('1. Creating Test Announcement...');
        const announcement = await AnnouncementService.createAnnouncement(testData, testUserId);
        console.log('✔ Success! Announcement ID:', announcement.id);
        console.log('✔ Immutable Hash generated:', announcement.immutableHash);
        console.log('✔ AI Summary generated:', announcement.aiSummary);

        console.log('2. Verifying in Database...');
        const saved = await prisma.announcement.findUnique({
            where: { id: announcement.id },
            include: { revisions: true }
        });

        if (saved && saved.immutableHash === announcement.immutableHash) {
            console.log('✔ Database Verification Passed!');
        } else {
            throw new Error('Database verification failed: Hash mismatch or not found.');
        }

        console.log('3. Fetching Official Feed...');
        const feed = await AnnouncementService.getFeed({ category: 'Security' });
        const inFeed = feed.some(a => a.id === announcement.id);
        if (inFeed) {
            console.log('✔ Feed Verification Passed!');
        } else {
            throw new Error('Feed verification failed: New announcement not found in filtered feed.');
        }

        console.log('\n--- ALL VERIFICATIONS PASSED ---');

    } catch (error) {
        console.error('❌ Verification FAILED:', error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

verifyAnnouncementSystem();
