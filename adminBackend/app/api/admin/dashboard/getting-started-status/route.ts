import { prisma } from '@/lib/prisma';
import { apiSuccess } from '@/lib/api-response';

export async function GET() {
    try {
        const adminCount = await prisma.user.count({
            where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } }
        });
        const communityCount = await prisma.community.count();
        const pushConfig = await prisma.pushConfig.findFirst();
        const notificationCount = await prisma.broadcastNotification.count();
        const apiKeyCount = await prisma.apiKey.count();

        const tasks = [
            {
                id: 1,
                title: 'Invite users',
                desc: 'Add team members to your workspace',
                completed: adminCount > 1,
                action: 'Go to Settings'
            },
            {
                id: 2,
                title: 'Create a community',
                desc: 'Organize users into communities',
                completed: communityCount > 0,
                action: 'Go to Communities'
            },
            {
                id: 3,
                title: 'Configure push notifications',
                desc: 'Set up FCM/APNS providers',
                completed: !!pushConfig,
                action: 'Go to Config'
            },
            {
                id: 4,
                title: 'Send first broadcast',
                desc: 'Reach out to all users',
                completed: notificationCount > 0,
                action: 'Go to Notifications'
            },
            {
                id: 5,
                title: 'Generate API Key',
                desc: 'Access the platform programmatically',
                completed: apiKeyCount > 0,
                action: 'Go to API'
            },
        ];

        return apiSuccess(tasks, 'Getting started status fetched successfully');
    } catch (error: unknown) {
        console.error('Getting Started Status API Error:', error);
        const defaultTasks = [
            { id: 1, title: 'Invite users', desc: 'Add team members to your workspace', completed: false, action: 'Go to Settings' },
            { id: 2, title: 'Create a community', desc: 'Organize users into communities', completed: false, action: 'Go to Communities' },
            { id: 3, title: 'Configure push notifications', desc: 'Set up FCM/APNS providers', completed: false, action: 'Go to Config' },
            { id: 4, title: 'Send first broadcast', desc: 'Reach out to all users', completed: false, action: 'Go to Notifications' },
            { id: 5, title: 'Generate API Key', desc: 'Access the platform programmatically', completed: false, action: 'Go to API' },
        ];
        return apiSuccess(defaultTasks, 'Getting started (DB unavailable or tables not migrated)');
    }
}
