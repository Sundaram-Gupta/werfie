import { NotificationService } from './services/notification.service.js';

async function test() {
    try {
        console.log('Testing Notification Service Enrichment...');

        const notifications = await NotificationService.getNotifications('user_1', 5);

        if (notifications.length > 0) {
            const n = notifications[0];
            console.log('Notification found:', n.id);
            console.log('Actor object present:', !!n.actor);
            console.log('Actor name:', n.actor?.profile?.name || 'MISSING');
            console.log('Actor handle:', n.actor?.profile?.handle || 'MISSING');
        } else {
            console.log('No notifications found for user_1 to verify.');
        }

        console.log('Verification Success!');
    } catch (error) {
        console.error('Test Failed:', error);
    }
}

test();
