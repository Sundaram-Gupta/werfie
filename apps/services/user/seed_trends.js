const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding Trends...');

    const trends = [
        { name: '#ReactJS', category: 'Technology • Trending', volume: '15.4K posts' },
        { name: '#Tailwind', category: 'Technology • Trending', volume: '16.4K posts' },
        { name: '#DeepMind', category: 'Technology • Trending', volume: '17.4K posts' },
        { name: '#AI', category: 'Technology • Trending', volume: '18.4K posts' },
        { name: '#OpenAI', category: 'Technology • Trending', volume: '154K posts' },
        { name: '#Elections2026', category: 'Politics • Trending', volume: '2.1M posts' },
        { name: 'Cristiano Ronaldo', category: 'Sports • Trending', volume: '500K posts' },
        { name: 'Taylor Swift', category: 'Music • Trending', volume: '320K posts' },
        { name: '#BangaloreTraffic', category: 'Trending in India', volume: '12K posts' },
        { name: '#SpaceX', category: 'Science • Trending', volume: '54K posts' },
        { name: '#Bitcoin', category: 'Finance • Trending', volume: '1.2M posts' },
        { name: '#Web3', category: 'Technology • Trending', volume: '230K posts' },
        { name: '#Anime', category: 'Entertainment • Trending', volume: '890K posts' },
        { name: '#WorldCup', category: 'Sports • Trending', volume: '5.6M posts' },
        { name: '#Coding', category: 'Technology • Trending', volume: '45K posts' }
    ];

    for (const t of trends) {
        try {
            await prisma.trend.upsert({
                where: { name: t.name },
                update: {},
                create: t
            });
            console.log(`Created trend: ${t.name}`);
        } catch (e) {
            console.error(`Error creating ${t.name}:`, e.message);
        }
    }
    console.log('✅ Trends seeded.');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
