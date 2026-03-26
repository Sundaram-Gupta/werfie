const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
    try {
        const users = await prisma.user.findMany({ 
            take: 5,
            include: { profile: true }
        });
        
        if (users.length < 2) {
            console.log('Not enough users to seed discovery lists.');
            return;
        }

        // Use the first user as the "Discoverable list owner" 
        // We'll create lists for multiple users to ensure one is not the logged-in user
        for (const user of users) {
             const handle = user.profile?.handle || user.email.split('@')[0];
             const listNames = [
                 `Top Trends by @${handle}`,
                 `Favorite Accounts of @${handle}`,
                 `Important News for @${handle}`
             ];

             for (const name of listNames) {
                 const exists = await prisma.list.findFirst({
                     where: { ownerId: user.id, name }
                 });

                 if (!exists) {
                     await prisma.list.create({
                         data: {
                             ownerId: user.id,
                             name,
                             description: `A curated list by @${handle} for testing the discovery feature.`,
                             isPrivate: false
                         }
                     });
                     console.log(`Created list "${name}" for user ${user.id}`);
                 }
             }
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

seed();
