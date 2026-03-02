const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function repair() {
    console.log('--- Repairing User user2@xclone.com ---');
    try {
        const user = await prisma.user.findFirst({
            where: { email: 'user2@xclone.com' }
        });

        if (!user) {
            console.log('❌ User not found');
            return;
        }

        // 1. Update User institutionType
        await prisma.user.update({
            where: { id: user.id },
            data: { institutionType: 'government' }
        });
        console.log('✔ Updated User institutionType to "government"');

        // 2. Create InstitutionalProfile if missing
        const existingProfile = await prisma.institutionalProfile.findUnique({
            where: { userId: user.id }
        });

        if (!existingProfile) {
            const newProfile = await prisma.institutionalProfile.create({
                data: {
                    userId: user.id,
                    institutionName: 'Official Werfie Testing Authority',
                    institutionType: 'government',
                    status: 'approved',
                    isVerified: true
                }
            });
            console.log('✔ Created new InstitutionalProfile:', newProfile.id);
        } else {
            console.log('✔ InstitutionalProfile already exists:', existingProfile.id);
        }

    } catch (error) {
        console.error('❌ Repair failed:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

repair();
