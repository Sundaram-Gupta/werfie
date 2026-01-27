
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Verifying notifications...');

    const user = await prisma.user.findUnique({
        where: { email: 'john@example.com' },
    });

    if (!user) {
        console.log('User john@example.com not found.');
        return;
    }

    console.log(`User: ${user.email} (${user.id})`);

    const notifications = await prisma.notification.findMany({
        where: { userId: user.id },
        include: {
            actor: { select: { email: true, profile: { select: { isVerified: true } } } },
            post: { select: { id: true } }
        }
    });

    console.log(`Found ${notifications.length} notifications.`);
    notifications.forEach(n => {
        console.log(`- Type: ${n.type}, Actor: ${n.actor.email} (Verified: ${n.actor.profile?.isVerified}), Read: ${n.read}`);
    });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
