
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('⏳ Connecting to database...');
        await prisma.$connect();
        console.log('✅ Database connection successful!');

        const userCount = await prisma.user.count();
        console.log(`📊 Found ${userCount} users in the database.`);

        await prisma.$disconnect();
    } catch (e) {
        console.error('❌ Database connection failed:', e);
        process.exit(1);
    }
}

main();
