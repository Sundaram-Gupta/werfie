const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const prisma = new PrismaClient();

async function main() {
    console.log('Seeding Posts...');

    // Get seeded users
    const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10
    });

    if (users.length === 0) {
        console.log('No users found. Please run seed-users.js first.');
        return;
    }

    const postsContent = [
        "Just launched my new project! #coding #startup",
        "The weather is amazing today ☀️",
        "Exploring the new features of Next.js 15. Mind blown 🤯",
        "Coffee is life ☕️",
        "Anyone watching the game tonight?",
        "Working on a secret project... stay tuned!",
        "Why is CSS so hard sometimes? 😅",
        "Just learned about PrismaORM, it's a game changer.",
        "Beautiful sunset.",
        "Who else is excited for the weekend?"
    ];

    for (const user of users) {
        // Create 2-3 posts per user
        for (let i = 0; i < 3; i++) {
            const content = postsContent[Math.floor(Math.random() * postsContent.length)];

            await prisma.post.create({
                data: {
                    userId: user.id,
                    content: `${content} (by ${user.email.split('@')[0]})`,
                    createdAt: new Date(Date.now() - Math.floor(Math.random() * 1000 * 60 * 60 * 24 * 7)) // last 7 days
                }
            });
        }
        console.log(`Created posts for ${user.email}`);
    }

    console.log('Seeding Posts Completed.');
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
