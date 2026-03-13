const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding trending topics...');

    const trends = [
        // Trending
        { topic: '#AI', category: 'trending', posts: 15420 },
        { topic: '#WebDevelopment', category: 'trending', posts: 12350 },
        { topic: '#JavaScript', category: 'trending', posts: 11200 },
        { topic: '#React', category: 'trending', posts: 9800 },
        { topic: '#NextJS', category: 'trending', posts: 8500 },
        { topic: '#TypeScript', category: 'trending', posts: 7600 },
        { topic: '#Docker', category: 'trending', posts: 6900 },
        { topic: '#DevOps', category: 'trending', posts: 6200 },
        { topic: '#CloudComputing', category: 'trending', posts: 5800 },
        { topic: '#Microservices', category: 'trending', posts: 5100 },

        // News
        { topic: 'Tech Summit 2026', category: 'news', posts: 18500 },
        { topic: 'New AI Breakthrough', category: 'news', posts: 16200 },
        { topic: 'Climate Action', category: 'news', posts: 14800 },
        { topic: 'Space Exploration', category: 'news', posts: 13500 },
        { topic: 'Economic Summit', category: 'news', posts: 12100 },
        { topic: 'Healthcare Innovation', category: 'news', posts: 10900 },
        { topic: 'Education Reform', category: 'news', posts: 9700 },
        { topic: 'Renewable Energy', category: 'news', posts: 8800 },
        { topic: 'Cybersecurity Alert', category: 'news', posts: 7900 },
        { topic: 'Global Trade', category: 'news', posts: 6800 },

        // Sports
        { topic: 'World Cup 2026', category: 'sports', posts: 25600 },
        { topic: 'NBA Finals', category: 'sports', posts: 22300 },
        { topic: 'Olympics Training', category: 'sports', posts: 19800 },
        { topic: 'Tennis Grand Slam', category: 'sports', posts: 17200 },
        { topic: 'Formula 1', category: 'sports', posts: 15900 },
        { topic: 'Cricket World Cup', category: 'sports', posts: 14500 },
        { topic: 'Super Bowl', category: 'sports', posts: 13200 },
        { topic: 'Champions League', category: 'sports', posts: 11800 },
        { topic: 'Golf Masters', category: 'sports', posts: 9500 },
        { topic: 'Marathon Season', category: 'sports', posts: 8200 },

        // Entertainment
        { topic: 'New Movie Release', category: 'entertainment', posts: 28900 },
        { topic: 'Music Awards', category: 'entertainment', posts: 24500 },
        { topic: 'Gaming Expo', category: 'entertainment', posts: 21700 },
        { topic: 'TV Series Finale', category: 'entertainment', posts: 19300 },
        { topic: 'Concert Tour', category: 'entertainment', posts: 17800 },
        { topic: 'Streaming Wars', category: 'entertainment', posts: 15400 },
        { topic: 'Celebrity News', category: 'entertainment', posts: 13900 },
        { topic: 'Book Release', category: 'entertainment', posts: 11600 },
        { topic: 'Theater Opening', category: 'entertainment', posts: 9800 },
        { topic: 'Art Exhibition', category: 'entertainment', posts: 8100 },
    ];

    let created = 0;
    for (const trend of trends) {
        try {
            await prisma.trend.create({ data: trend });
            created++;
        } catch (error) {
            console.log(`⚠️  Trend "${trend.name}" might already exist`);
        }
    }

    const totalTrends = await prisma.trend.count();
    console.log(`✅ Created ${created} new trends`);
    console.log(`📊 Total trends in database: ${totalTrends}`);

    const byCategory = await prisma.trend.groupBy({
        by: ['category'],
        _count: true,
    });

    console.log('\n📈 Trends by category:');
    byCategory.forEach(cat => {
        console.log(`  ${cat.category}: ${cat._count} items`);
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
