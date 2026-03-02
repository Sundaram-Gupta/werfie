const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Seeding Trends from within service...');

    const trends = [
        { category: 'trending', topic: 'SeededTrend', posts: 100 },
        { category: 'trending', topic: 'WerfieTest', posts: 10 },
        { category: 'trending', topic: 'MixedMedia', posts: 85 },
        { category: 'news', topic: 'BotSeeding', posts: 42 },
        { category: 'entertainment', topic: 'AntigravityLive', posts: 156 },
        { category: 'sports', topic: 'MicroserviceOlympics', posts: 30 }
    ];

    for (const trend of trends) {
        try {
            await prisma.trend.upsert({
                where: { id: `trend_${trend.topic.toLowerCase()}` },
                update: {
                    posts: trend.posts,
                    updatedAt: new Date()
                },
                create: {
                    id: `trend_${trend.topic.toLowerCase()}`,
                    category: trend.category,
                    topic: trend.topic,
                    posts: trend.posts
                }
            });
            console.log(`✅ Upserted: ${trend.topic}`);
        } catch (error) {
            console.log(`⚠️  Upsert failed for ${trend.topic}, trying simple create...`);
            try {
                await prisma.trend.create({ data: trend });
                console.log(`✅ Created: ${trend.topic}`);
            } catch (createError) {
                console.error(`❌ Failed: ${trend.topic}`, createError.message);
            }
        }
    }

    console.log('✨ Done.');
    await prisma.$disconnect();
}

main();
