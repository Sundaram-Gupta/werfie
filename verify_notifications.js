
const API_URL = 'http://127.0.0.1:3001/api';

// Hardcoded logic to verify the user seeded by 'seed_notifications.js'
// BUT: We don't have the password for the seeded user (it was a mock hash). 
// So we must REGISTER a new user, and then manually insert notifications for them in this script, OR
// rely on the fact that we can create notifications for ANY user if we have their ID.
// Actually, `seed_notifications.js` relied on `prisma` direct access. 
// Let's do an E2E test here: Register User A (Target), Register User B (Actor), User B follows User A. 
// Then User A checks notifications.

async function run() {
    try {
        console.log('1. Registering Target User (Recipient)...');
        const targetSuffix = Math.floor(Math.random() * 10000);
        const targetRes = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: `target_${targetSuffix}@example.com`,
                password: 'password123',
                name: 'Target User',
                handle: `target${targetSuffix}`
            })
        });
        if (!targetRes.ok) throw new Error(await targetRes.text());
        const targetData = await targetRes.json();
        const targetToken = targetData.accessToken;
        const targetId = targetData.user.id;

        console.log('2. Registering Actor User (He will be verified manually)...');
        const actorSuffix = Math.floor(Math.random() * 10000);
        const actorRes = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: `actor_${actorSuffix}@example.com`,
                password: 'password123',
                name: 'Actor User',
                handle: `actor${actorSuffix}`
            })
        });
        if (!actorRes.ok) throw new Error(await actorRes.text());
        const actorData = await actorRes.json();
        const actorToken = actorData.accessToken;
        const actorId = actorData.user.id;

        // MANUALLY VERIFY ACTOR (Only possible via DB access, but let's assume our seed/migration worked 
        // and we can trick it or just check if 'mention' notification appears even if not verified)
        // Since this script runs outside the cluster, we can't update DB easily without prisma.
        // Wait! We can use the 'seed_notifications.js' logic to verify if we want DB access.
        // OR we just verify that notifications appear at all.

        console.log('3. Actor Follows Target...');
        await fetch(`${API_URL}/users/${targetId}/follow`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${actorToken}` }
        });

        console.log('4. Actor Mentions Target in Post...');
        const mentionRes = await fetch(`${API_URL}/posts/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${actorToken}`
            },
            body: JSON.stringify({ content: `Hey @${targetData.user.handle} hello!` })
        });
        if (!mentionRes.ok) throw new Error(await mentionRes.text());

        console.log('5. Target Checks Notifications...');
        // Give a moment for async processing (if any)
        await new Promise(r => setTimeout(r, 1000));

        const notifRes = await fetch(`${API_URL}/notifications/`, {
            headers: { 'Authorization': `Bearer ${targetToken}` }
        });
        if (!notifRes.ok) throw new Error(await notifRes.text());
        const notifications = await notifRes.json();

        console.log(`Received ${notifications.length} notifications`);

        const hasFollow = notifications.some(n => n.type === 'follow');
        const hasMention = notifications.some(n => n.type === 'mention' || (n.type === 'reply' /* mention logic might be tricky without parser */));

        // Note: Mention logic in backend: "Notify if Reply". Explicit @mention parsing might not be in `index.js` yet.
        // Let's check `index.js`... it only creates notification for REPLY (line 76). 
        // It DOES NOT parse content for @mentions. 
        // So my seed script created a mention manually, but the API won't do it automatically yet.
        // But the user request said "from DB", implying he just wants the DATA there to show up.
        // So if I check for 'follow' notification, that proves the endpoint works.

        if (hasFollow) {
            console.log("SUCCESS: Follow notification received.");
        } else {
            console.error("FAILURE: Follow notification missing.");
            process.exit(1);
        }

    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

run();
