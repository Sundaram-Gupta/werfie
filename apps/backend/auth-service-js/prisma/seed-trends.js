const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding trending topics...');

    const trends = [
        // Trending
        { name: '#AI', category: 'trending', description: 'Artificial Intelligence discussions', tweetCount: 15420 },
        { name: '#WebDevelopment', category: 'trending', description: 'Latest in web dev', tweetCount: 12350 },
        { name: '#JavaScript', category: 'trending', description: 'JavaScript programming', tweetCount: 11200 },
        { name: '#React', category: 'trending', description: 'React framework updates', tweetCount: 9800 },
        { name: '#NextJS', category: 'trending', description: 'Next.js discussions', tweetCount: 8500 },
        { name: '#TypeScript', category: 'trending', description: 'TypeScript programming', tweetCount: 7600 },
        { name: '#Docker', category: 'trending', description: 'Docker containerization', tweetCount: 6900 },
        { name: '#DevOps', category: 'trending', description: 'DevOps practices', tweetCount: 6200 },
        { name: '#CloudComputing', category: 'trending', description: 'Cloud technologies', tweetCount: 5800 },
        { name: '#Microservices', category: 'trending', description: 'Microservices architecture', tweetCount: 5100 },

        // News
        { name: 'Tech Summit 2026', category: 'news', description: 'Annual technology conference', tweetCount: 18500 },
        { name: 'New AI Breakthrough', category: 'news', description: 'Latest AI research', tweetCount: 16200 },
        { name: 'Climate Action', category: 'news', description: 'Environmental initiatives', tweetCount: 14800 },
        { name: 'Space Exploration', category: 'news', description: 'Mars mission updates', tweetCount: 13500 },
        { name: 'Economic Summit', category: 'news', description: 'Global economic forum', tweetCount: 12100 },
        { name: 'Healthcare Innovation', category: 'news', description: 'Medical breakthroughs', tweetCount: 10900 },
        { name: 'Education Reform', category: 'news', description: 'New learning initiatives', tweetCount: 9700 },
        { name: 'Renewable Energy', category: 'news', description: 'Clean energy advances', tweetCount: 8800 },
        { name: 'Cybersecurity Alert', category: 'news', description: 'Security updates', tweetCount: 7900 },
        { name: 'Global Trade', category: 'news', description: 'International commerce', tweetCount: 6800 },

        // Sports
        { name: 'World Cup 2026', category: 'sports', description: 'Football championship', tweetCount: 25600 },
        { name: 'NBA Finals', category: 'sports', description: 'Basketball championship', tweetCount: 22300 },
        { name: 'Olympics Training', category: 'sports', description: 'Olympic preparations', tweetCount: 19800 },
        { name: 'Tennis Grand Slam', category: 'sports', description: 'Major tennis tournament', tweetCount: 17200 },
        { name: 'Formula 1', category: 'sports', description: 'Racing championship', tweetCount: 15900 },
        { name: 'Cricket World Cup', category: 'sports', description: 'Cricket tournament', tweetCount: 14500 },
        { name: 'Super Bowl', category: 'sports', description: 'American football', tweetCount: 13200 },
        { name: 'Champions League', category: 'sports', description: 'European football', tweetCount: 11800 },
        { name: 'Golf Masters', category: 'sports', description: 'Golf championship', tweetCount: 9500 },
        { name: 'Marathon Season', category: 'sports', description: 'Running events', tweetCount: 8200 },

        // Entertainment
        { name: 'New Movie Release', category: 'entertainment', description: 'Blockbuster premiere', tweetCount: 28900 },
        { name: 'Music Awards', category: 'entertainment', description: 'Annual music ceremony', tweetCount: 24500 },
        { name: 'Gaming Expo', category: 'entertainment', description: 'Video game convention', tweetCount: 21700 },
        { name: 'TV Series Finale', category: 'entertainment', description: 'Popular show ending', tweetCount: 19300 },
        { name: 'Concert Tour', category: 'entertainment', description: 'World tour announcement', tweetCount: 17800 },
        { name: 'Streaming Wars', category: 'entertainment', description: 'Platform competition', tweetCount: 15400 },
        { name: 'Celebrity News', category: 'entertainment', description: 'Hollywood updates', tweetCount: 13900 },
        { name: 'Book Release', category: 'entertainment', description: 'Bestseller launch', tweetCount: 11600 },
        { name: 'Theater Opening', category: 'entertainment', description: 'Broadway premiere', tweetCount: 9800 },
        { name: 'Art Exhibition', category: 'entertainment', description: 'Museum showcase', tweetCount: 8100 },
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
