const { PrismaClient } = require('@prisma/client');
const path = require('path');

// Initialize Prisma with the connection string from env or fallback
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL || "postgresql://postgres:12345678@localhost:5432/xclone_db"
        }
    }
});

async function main() {
    console.log('🚀 Seeding Trends...');

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
            const result = await prisma.trend.upsert({
                where: { id: `trend_${trend.topic.toLowerCase()}` }, // Use topic as part of ID for manual seeding
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
            console.log(`✅ Upserted trend: ${trend.topic} (${trend.posts} posts)`);
        } catch (error) {
            // Fallback if ID-based upsert fails (e.g. if ID is uuid format strictly)
            try {
                const existing = await prisma.trend.findFirst({ where: { topic: trend.topic } });
                if (existing) {
                    await prisma.trend.update({
                        where: { id: existing.id },
                        data: { posts: trend.posts }
                    });
                } else {
                    await prisma.trend.create({
                        data: trend
                    });
                }
                console.log(`✅ Upserted trend (fallback): ${trend.topic}`);
            } catch (fallbackError) {
                console.error(`❌ Failed to seed trend ${trend.topic}:`, fallbackError.message);
            }
        }
    }

    console.log('✨ Trend seeding complete.');
    await prisma.$disconnect();
}

main().catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
});
