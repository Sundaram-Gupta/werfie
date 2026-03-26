const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const requests = await prisma.verificationRequest.findMany();
    console.log('All Verification Requests:', JSON.stringify(requests, null, 2));
    
    const profiles = await prisma.businessProfile.findMany();
    console.log('All Business Profiles Status:', JSON.stringify(profiles.map(p => ({ id: p.id, status: p.status })), null, 2));
    
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
