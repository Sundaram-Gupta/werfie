import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const trends = await prisma.trend.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' }
        });
        console.log('Current Trends:', JSON.stringify(trends, null, 2));
    } catch (error) {
        console.error('Error fetching trends:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
