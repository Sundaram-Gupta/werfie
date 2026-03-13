const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🎙️  Seeding spaces...');

    // Get some users to be hosts
    const users = await prisma.user.findMany({ take: 10 });

    if (users.length === 0) {
        console.error('❌ No users found. Please run seed-dummy-data.js first.');
        return;
    }

    const spaces = [
        {
            title: "State of AI 2026",
            time: "Today, 8:00 PM",
            hostId: users[0].id,
            isLive: false
        },
        {
            title: "Post-Game Analysis: Champions League Final",
            time: "Tomorrow, 10:00 AM",
            hostId: users[1].id,
            isLive: false
        },
        {
            title: "Indie Hacking 101: From 0 to $10K MRR",
            time: "Fri, 6:00 PM",
            hostId: users[2].id,
            isLive: false
        },
        {
            title: "Crypto Market Outlook 2026",
            time: "Sat, 3:00 PM",
            hostId: users[3].id,
            isLive: false
        },
        {
            title: "React 19: What's New?",
            time: "Sun, 5:00 PM",
            hostId: users[4].id,
            isLive: false
        }
    ];

    for (const spaceData of spaces) {
        const space = await prisma.space.create({
            data: spaceData
        });
        console.log(`✅ Created space: ${space.title}`);
    }

    console.log('✅ Spaces seeded successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding spaces:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
