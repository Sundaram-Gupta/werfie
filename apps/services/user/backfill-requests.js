const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function backfill() {
    const pendingProfiles = await prisma.businessProfile.findMany({
        where: { status: 'pending', isVerified: false }
    });
    
    console.log(`Found ${pendingProfiles.length} pending profiles to backfill.`);
    
    for (const profile of pendingProfiles) {
        // Check if request already exists
        const exists = await prisma.verificationRequest.findFirst({
            where: { businessId: profile.id }
        });
        
        if (!exists) {
            console.log(`Creating request for business ${profile.id} (User: ${profile.userId})`);
            await prisma.verificationRequest.create({
                data: {
                    userId: profile.userId,
                    businessId: profile.id,
                    type: 'BUSINESS',
                    status: 'PENDING'
                }
            });
        }
    }
    
    process.exit(0);
}

backfill().catch(err => {
    console.error(err);
    process.exit(1);
});
