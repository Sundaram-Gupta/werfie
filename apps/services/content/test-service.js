const AnnouncementService = require('./src/services/announcement.service');

async function test() {
    console.log('--- Testing AnnouncementService.createAnnouncement ---');
    try {
        const testData = {
            title: 'System Verification',
            content: 'Manual table creation verification successful.',
            category: 'Systems',
            institutionId: 'mock-inst-id',
            status: 'draft'
        };
        const userId = 'admin-user-id';

        const result = await AnnouncementService.createAnnouncement(testData, userId);
        console.log('✔ Successfully created announcement:', result.id);

        // Clean up
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        await prisma.announcement.delete({ where: { id: result.id } });
        console.log('✔ Cleaned up test record.');

    } catch (e) {
        console.error('❌ Service Test Failed:', e.message);
    }
}

test();
