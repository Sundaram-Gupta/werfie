
const { PrismaClient } = require('./apps/services/content/node_modules/@prisma/client');
const prisma = new PrismaClient();
const API_URL = 'http://127.0.0.1:3001/api';

async function run() {
    const suffix = Math.floor(Math.random() * 10000);

    // Register Target
    const targetRes = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: `filter_target_${suffix}@example.com`,
            password: 'password123',
            name: 'Filter Target',
            handle: `filtertarget${suffix}`
        })
    });
    if (!targetRes.ok) throw new Error(await targetRes.text());
    const targetData = await targetRes.json();
    const targetToken = targetData.accessToken;
    const targetId = targetData.user.id;

    // Register Verified Actor
    const actorRes = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: `verified_actor_${suffix}@example.com`,
            password: 'password123',
            name: 'Verified Actor',
            handle: `verifiedactor${suffix}`
        })
    });
    if (!actorRes.ok) throw new Error(await actorRes.text());
    const actorData = await actorRes.json();
    const actorToken = actorData.accessToken;
    const actorId = actorData.user.id;

    // Manually Verify Actor in DB
    await prisma.profile.update({
        where: { userId: actorId },
        data: { isVerified: true }
    });

    // Actor Follows Target
    await fetch(`${API_URL}/users/${targetId}/follow`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${actorToken}` }
    });

    // Wait for async processing
    await new Promise(r => setTimeout(r, 1000));

    // Check All Notifications
    const allRes = await fetch(`${API_URL}/notifications/`, {
        headers: { 'Authorization': `Bearer ${targetToken}` }
    });
    const all = await allRes.json();
    console.log('All Notifications:', all.length);

    // Check Verified Filter
    const verifiedRes = await fetch(`${API_URL}/notifications?filter=verified`, {
        headers: { 'Authorization': `Bearer ${targetToken}` }
    });
    const verified = await verifiedRes.json();
    console.log('Verified Notifications:', verified.length);

    if (verified.length > 0 && verified[0].actor.profile.isVerified) {
        console.log('SUCCESS: Verified filter working properly.');
    } else {
        console.error('FAILURE: Verified filter failed.');
        process.exit(1);
    }
}

run().catch(e => { console.error(e); process.exit(1); });
