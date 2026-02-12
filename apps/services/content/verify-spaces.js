const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
    try {
        console.log('Testing Space creation...');

        // 1. Get a user
        const user = await prisma.user.findFirst();
        if (!user) {
            console.log('No users found in database.');
            return;
        }

        console.log(`Using User: ${user.id} to host a space`);

        // 2. Create a space
        const space = await prisma.space.create({
            data: {
                title: 'Verification Space',
                hostId: user.id,
                topics: ['Testing', 'Dev'],
                privacy: 'public',
                status: 'live',
                isLive: true,
                startedAt: new Date(),
                time: 'Live'
            }
        });

        console.log('Space created successfully:', space.id);

        // 3. Fetch spaces
        const spaces = await prisma.space.findMany({
            where: { id: space.id }
        });
        console.log('Space fetch check:', spaces.length > 0 ? 'Found' : 'Not found');

        // Cleanup
        await prisma.space.delete({ where: { id: space.id } });
        console.log('Cleanup completed.');

        console.log('Verification Success!');
    } catch (error) {
        console.error('Verification Failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

test();
