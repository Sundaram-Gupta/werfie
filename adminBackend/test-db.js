const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Testing Database Connection...');
    const start = Date.now();
    try {
        const count = await prisma.user.count();
        console.log('Connection Successful!');
        console.log('User count:', count);
        console.log('Time taken:', Date.now() - start, 'ms');
    } catch (e) {
        console.error('Connection Failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
