const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const userId = 'test_verified_user';
    console.log(`Setting up verified user: ${userId}`);

    try {
        const user = await prisma.user.upsert({
            where: { id: userId },
            update: {},
            create: {
                id: userId,
                email: 'test@werfie.com',
                passwordHash: 'fake_hash',
                role: 'admin'
            }
        });

        await prisma.institutionalProfile.upsert({
            where: { userId: user.id },
            update: { isVerified: true },
            create: {
                userId: user.id,
                institutionName: 'Test Gov Agency',
                institutionType: 'Government',
                isVerified: true,
                status: 'approved'
            }
        });

        console.log("✅ User and InstitutionalProfile created/updated with isVerified: true");
    } catch (e) {
        console.error("Setup failed:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
