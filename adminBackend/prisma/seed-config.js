const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Seeding dynamic configuration data...');

    // 1. Create default Push Configurations
    const fcm = await prisma.pushConfig.upsert({
        where: { id: 'default-fcm' },
        update: {},
        create: {
            id: 'default-fcm',
            provider: 'FCM',
            credentials: JSON.stringify({
                type: "service_account",
                project_id: "werfie-prod",
                private_key: "********************",
                client_email: "firebase-adminsdk@werfie-prod.iam.gserviceaccount.com"
            }, null, 2),
            enabled: true,
            allowedTypes: ["likes", "mentions", "replies", "direct_messages", "system"]
        }
    });

    const apns = await prisma.pushConfig.upsert({
        where: { id: 'default-apns' },
        update: {},
        create: {
            id: 'default-apns',
            provider: 'APNS',
            credentials: JSON.stringify({
                team_id: "TEAM12345",
                key_id: "KEY67890",
                bundle_id: "com.werfie.app"
            }, null, 2),
            enabled: false,
            allowedTypes: ["system"]
        }
    });

    // 2. Create some mock Broadcast Notifications
    const broadcast1 = await prisma.broadcastNotification.create({
        data: {
            title: "Welcome to Werfie!",
            message: "We're excited to have you here. Explore the new Audio Spaces!",
            targetType: "all",
            authorId: "system",
            status: "sent",
            metrics: JSON.stringify({ delivered: 12450, failures: 3 })
        }
    });

    const broadcast2 = await prisma.broadcastNotification.create({
        data: {
            title: "System Maintenance",
            message: "Brief maintenance scheduled for tonight at 2 AM UTC.",
            targetType: "all",
            authorId: "system",
            status: "sent",
            metrics: JSON.stringify({ delivered: 11980, failures: 12 })
        }
    });

    console.log('Seeding completed successfully:');
    console.log(`- Push Configs: ${fcm.provider}, ${apns.provider}`);
    console.log(`- Broadcasts: 2 items created`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
