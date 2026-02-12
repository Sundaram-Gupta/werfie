const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding Trends...');

    try {
        await prisma.trend.deleteMany({}); // Clear existing

        const trends = [
            { category: 'trending', topic: '#SpaceX', posts: 5240 },
            { category: 'trending', topic: '#ArtificialIntelligence', posts: 3105 },
            { category: 'news', topic: 'Global Climate Summit', posts: 890 },
            { category: 'news', topic: 'Tech Giant', posts: 450 },
            { category: 'sports', topic: 'Super Bowl LVIII', posts: 12000 },
            { category: 'sports', topic: 'NBA Finals', posts: 8500 },
            { category: 'entertainment', topic: 'New Marvel Movie', posts: 6700 },
            { category: 'entertainment', topic: 'Grammys 2026', posts: 4300 },
            { category: 'technology', topic: 'React 19', posts: 2100 },
            { category: 'technology', topic: 'Next.js 15', posts: 1800 }
        ];

        for (const item of trends) {
            await prisma.trend.create({ data: item });
            console.log(`Created Trend: ${item.topic}`);
        }

        console.log('✅ Trends seeded.');
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
