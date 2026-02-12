const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: "postgresql://postgres:12345678@localhost:5432/xclone_db",
        },
    },
});

async function main() {
    try {
        console.log('Connecting to database from Auth Service...');
        await prisma.$connect();
        console.log('Connected successfully.');

        console.log('Counting users...');
        const userCount = await prisma.user.count();
        console.log('User count:', userCount);

        console.log('Checking PostMedia table...');
        try {
            const media = await prisma.$queryRaw`SELECT count(*) FROM "PostMedia"`;
            console.log('PostMedia table exists. Count:', media);
        } catch (e) {
            console.error('PostMedia table missing:', e.message);
        }

    } catch (error) {
        console.error('Database connection failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
