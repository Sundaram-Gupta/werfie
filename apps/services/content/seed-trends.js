import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const trendsData = [
    { category: 'trending', topic: 'WerfieGlobal', posts: 12500 },
    { category: 'news', topic: 'TechRevolution2026', posts: 8400 },
    { category: 'entertainment', topic: 'MovieMilestone', posts: 6200 },
    { category: 'sports', topic: 'ChampionshipFinals', posts: 15600 },
    { category: 'trending', topic: 'ModernWebDesign', posts: 3100 },
    { category: 'news', topic: 'SpaceExploration', posts: 4500 },
    { category: 'entertainment', topic: 'MusicAwards2026', posts: 9800 },
    { category: 'sports', topic: 'OlympicSpirit', posts: 7300 },
    { category: 'trending', topic: 'AIInnovation', posts: 11200 },
    { category: 'news', topic: 'ClimateAction', posts: 5400 }
];

async function main() {
    try {
        console.log('Seeding 10 trends...');

        // Clear existing trends if any
        await prisma.trend.deleteMany({});

        // Create new trends
        const createdTrends = await prisma.trend.createMany({
            data: trendsData
        });

        console.log(`Successfully seeded ${createdTrends.count} trends.`);
    } catch (error) {
        console.error('Error seeding trends:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
