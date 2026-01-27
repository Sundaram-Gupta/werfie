const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // Seed for ALL users to ensure the logged-in user gets data
    const users = await prisma.user.findMany();

    if (users.length === 0) {
        console.log('No users found to assign ads to.');
        return;
    }

    for (const user of users) {
        console.log(`Seeding ads for user: ${user.email} (${user.id})`);


        const campaigns = [
            {
                userId: user.id,
                name: 'Summer Sale 2026',
                goal: 'Traffic',
                budget: '$500',
                status: 'Active',
                impressions: '12.5K',
                clicks: '450'
            },
            {
                userId: user.id,
                name: 'Brand Awareness',
                goal: 'Reach',
                budget: '$200',
                status: 'Active',
                impressions: '45.2K',
                clicks: '1.2K'
            },
            {
                userId: user.id,
                name: 'App Install Campaign',
                goal: 'Sales',
                budget: '$1000',
                status: 'Paused',
                impressions: '5.1K',
                clicks: '80'
            }
        ];

        for (const data of campaigns) {
            // Check if exists to avoid duplicates
            const exists = await prisma.adCampaign.findFirst({
                where: { userId: user.id, name: data.name }
            });
            if (!exists) {
                const ad = await prisma.adCampaign.create({ data });
                console.log(`  -> Created: ${ad.name}`);
            } else {
                console.log(`  -> Skipped (Exists): ${data.name}`);
            }
        }
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
