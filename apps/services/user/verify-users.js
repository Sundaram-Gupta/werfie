const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Checking User Service database...');
    try {
        const users = await prisma.user.findMany({
            select: { id: true, email: true }
        });
        console.log('👥 Users found:', users.length);
        users.forEach(u => console.log(`- ${u.email} (${u.id})`));
    } catch (e) {
        console.error('❌ Error:', e.message);
    }
}

main().finally(() => prisma.$disconnect());
