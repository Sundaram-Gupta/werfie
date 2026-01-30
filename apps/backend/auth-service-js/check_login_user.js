const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUser() {
    try {
        console.log('Connecting to DB...');
        const user = await prisma.user.findUnique({
            where: { email: 'test2@gmail.com' },
            include: { profile: true }
        });
        console.log('User found:', user);
    } catch (e) {
        console.error('Error finding user:', e);
    } finally {
        await prisma.$disconnect();
    }
}

checkUser();
