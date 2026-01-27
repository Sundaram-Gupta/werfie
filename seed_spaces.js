
const { PrismaClient } = require('./apps/services/content/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Seeding Spaces...');

    // 1. Get some hosts
    let users = await prisma.user.findMany({
        take: 3,
        include: { profile: true }
    });

    if (users.length === 0) {
        console.log("No users found. Creating a host...");
        const suffix = Math.floor(Math.random() * 9000);
        const host = await prisma.user.create({
            data: {
                email: `host_${suffix}@example.com`,
                passwordHash: 'hashed',
                profile: {
                    create: {
                        name: "Tech Host",
                        handle: `techie_${suffix}`,
                        avatar: "https://github.com/shadcn.png"
                    }
                }
            },
            include: { profile: true }
        });
        users = [host];
    }

    const host1 = users[0];
    const host2 = users[1] || users[0];
    const host3 = users[2] || users[0];

    // 2. Create Live Space
    console.log('Creating Live Space...');
    await prisma.space.create({
        data: {
            title: "Tech Talk: The Future of AI",
            hostId: host1.id,
            topics: ["Technology", "AI"],
            status: "live",
            isLive: true,
            startedAt: new Date(),
            privacy: "public"
        }
    });

    // 3. Create Scheduled Spaces
    console.log('Creating Scheduled Spaces...');

    // In 2 hours
    const date1 = new Date();
    date1.setHours(date1.getHours() + 2);

    await prisma.space.create({
        data: {
            title: "Indie Hacking 101",
            hostId: host2.id,
            topics: ["Business", "Startups"],
            status: "scheduled",
            isLive: false,
            scheduledAt: date1,
            privacy: "public"
        }
    });

    // Tomorrow
    const date2 = new Date();
    date2.setDate(date2.getDate() + 1);

    await prisma.space.create({
        data: {
            title: "Music Production Masterclass",
            hostId: host3.id,
            topics: ["Music", "Art"],
            status: "scheduled",
            isLive: false,
            scheduledAt: date2,
            privacy: "followers"
        }
    });

    console.log('Spaces seeded successfully.');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
