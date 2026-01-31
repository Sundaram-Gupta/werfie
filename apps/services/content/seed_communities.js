const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const prisma = new PrismaClient();

async function main() {
    console.log('Seeding Communities...');

    // Get a host user
    const user = await prisma.user.findFirst();
    if (!user) {
        console.log('No users found.');
        return;
    }

    const communities = [
        {
            name: 'Tech Enthusiasts',
            description: 'A place for technology lovers to discuss the latest trends.',
            membersCount: '15.2K',
            avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=tech',
            banner: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=1000'
        },
        {
            name: 'React Developers',
            description: 'Everything about React, Next.js, and the ecosystem.',
            membersCount: '42K',
            avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=react',
            banner: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&q=80&w=1000'
        },
        {
            name: 'Startup Founders',
            description: 'Connect, share, and grow your startup journey.',
            membersCount: '8.5K',
            avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=startup',
            banner: 'https://images.unsplash.com/photo-1559136555-930d72f1d300?auto=format&fit=crop&q=80&w=1000'
        },
        {
            name: 'Digital Art',
            description: 'Showcase your digital masterpieces.',
            membersCount: '25K',
            avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=art',
            banner: 'https://images.unsplash.com/photo-1579783902614-a3fb39279c0f?auto=format&fit=crop&q=80&w=1000'
        }
    ];

    for (const comm of communities) {
        const c = await prisma.community.create({
            data: {
                name: comm.name,
                description: comm.description,
                membersCount: comm.membersCount,
                avatar: comm.avatar,
                banner: comm.banner,
                // Add creator as member and moderator
                members: {
                    create: { userId: user.id }
                },
                moderators: {
                    create: { userId: user.id }
                }
            }
        });
        console.log(`Created Community: ${c.name}`);
    }

    console.log('Seeding Communities Completed.');
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
