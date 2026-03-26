const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
    try {
        const usersCount = await prisma.user.count();
        const profilesCount = await prisma.profile.count();
        const usersWithoutProfile = await prisma.user.findMany({
            where: { profile: null },
            select: { id: true, email: true }
        });

        console.log(`Total Users: ${usersCount}`);
        console.log(`Total Profiles: ${profilesCount}`);
        console.log(`Users without Profile: ${usersWithoutProfile.length}`);
        
        if (usersWithoutProfile.length > 0) {
            console.log('\nSample Users without Profile:');
            usersWithoutProfile.slice(0, 5).forEach(u => {
                console.log(`- ID: ${u.id}, Email: ${u.email}`);
            });
        }

        const institutionalProfilesCount = await prisma.institutionalProfile.count();
        console.log(`\nTotal Institutional Profiles: ${institutionalProfilesCount}`);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await prisma.$disconnect();
    }
}

checkUsers();
