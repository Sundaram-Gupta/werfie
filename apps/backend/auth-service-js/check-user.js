const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listAll() {
    console.log('--- Dumping All Users ---');
    try {
        const users = await prisma.user.findMany({
            select: { id: true, email: true, institutionType: true, role: true }
        });
        console.log(`Found ${users.length} users:`);
        users.forEach(u => {
            console.log(`- ${u.email} (ID: ${u.id}, Type: ${u.institutionType}, Role: ${u.role})`);
        });

        const instCount = await prisma.institutionalProfile.count();
        console.log(`\nInstitutional Profiles Count: ${instCount}`);

    } catch (error) {
        console.error('❌ Failed:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

listAll();
