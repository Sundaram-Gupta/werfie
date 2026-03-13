const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const communities = [
    {
        name: "Tech Insiders",
        description: "The place for deep tech discussions, coding dilemmas, and industry news.",
        avatar: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2670&auto=format&fit=crop",
        banner: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=2670&auto=format&fit=crop",
        membersCount: "125K"
    },
    {
        name: "Startup Founders",
        description: "Connect with fellow founders, share learnings, and get feedback on your pitch.",
        avatar: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=2670&auto=format&fit=crop",
        banner: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?q=80&w=2670&auto=format&fit=crop",
        membersCount: "45K"
    },
    {
        name: "AI Revolution",
        description: "Discussing the latest in LLMs, diffusion models, and the future of AGI.",
        avatar: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=2565&auto=format&fit=crop",
        banner: "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=2832&auto=format&fit=crop",
        membersCount: "890K"
    },
    {
        name: "Sports Central",
        description: "Everything sports. Football, Basketball, Cricket, F1, and more.",
        avatar: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=2670&auto=format&fit=crop",
        banner: null,
        membersCount: "2.5M"
    },
    {
        name: "Movie Buffs",
        description: "Reviews, trailers, and discussions about cinema.",
        avatar: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2525&auto=format&fit=crop",
        banner: null,
        membersCount: "1.2M"
    },
    {
        name: "Crypto Talk",
        description: "Bitcoin, Ethereum, DeFi, and Web3 discussions.",
        avatar: "https://images.unsplash.com/photo-1621504450168-38f6d5ae5884?q=80&w=2670&auto=format&fit=crop",
        banner: null,
        membersCount: "670K"
    },
    {
        name: "Design Systems",
        description: "For UI/UX designers obsessed with consistency and scalability.",
        avatar: "https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=2564&auto=format&fit=crop",
        banner: null,
        membersCount: "89K"
    }
];

async function main() {
    console.log('🏘️  Seeding communities...');

    // Get some users to be members and moderators
    const users = await prisma.user.findMany({ take: 20 });

    if (users.length === 0) {
        console.error('❌ No users found. Please run seed-dummy-data.js first.');
        return;
    }

    for (const communityData of communities) {
        console.log(`Creating community: ${communityData.name}`);

        const community = await prisma.community.create({
            data: communityData
        });

        // Add random members (5-10 members per community)
        const memberCount = Math.floor(Math.random() * 6) + 5;
        const shuffledUsers = users.sort(() => 0.5 - Math.random());

        for (let i = 0; i < Math.min(memberCount, users.length); i++) {
            try {
                await prisma.communityMember.create({
                    data: {
                        userId: shuffledUsers[i].id,
                        communityId: community.id
                    }
                });
            } catch (error) {
                // Skip if already exists
            }
        }

        // Add 1-2 moderators
        const modCount = Math.floor(Math.random() * 2) + 1;
        for (let i = 0; i < modCount; i++) {
            try {
                await prisma.communityModerator.create({
                    data: {
                        userId: shuffledUsers[i].id,
                        communityId: community.id
                    }
                });
            } catch (error) {
                // Skip if already exists
            }
        }

        console.log(`✅ Created ${communityData.name} with ${memberCount} members and ${modCount} moderators`);
    }

    console.log('✅ Communities seeded successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding communities:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
