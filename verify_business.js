const API_URL = 'http://127.0.0.1:3001/api';

async function run() {
    try {
        console.log('1. Registering Business Owner...');
        const ownerSuffix = Math.floor(Math.random() * 10000);
        const ownerRes = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: `biz_owner_${ownerSuffix}@example.com`,
                password: 'password123',
                name: 'Business Tycoon',
                handle: `biz${ownerSuffix}`
            })
        });

        if (!ownerRes.ok) {
            const txt = await ownerRes.text();
            throw new Error(`Register failed: ${txt}`);
        }
        const ownerData = await ownerRes.json();
        // console.log('Owner Data:', JSON.stringify(ownerData, null, 2)); 
        const ownerToken = ownerData.accessToken;
        const ownerId = ownerData.user ? ownerData.user.id : ownerData.id;
        console.log('Business Owner registered:', ownerData.user?.handle || ownerData.handle);

        console.log('2. Creating Content...');
        // Create a Post
        const postRes = await fetch(`${API_URL}/posts/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ownerToken}`
            },
            body: JSON.stringify({ content: "Stocks represent ownership in a company!" })
        });
        if (!postRes.ok) {
            const txt = await postRes.text();
            throw new Error(`Create Post failed: ${txt}`);
        }
        const post = await postRes.json();
        console.log('Post created:', post.id);

        console.log('3. Registering Fan User...');
        const fanSuffix = Math.floor(Math.random() * 10000);
        const fanRes = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: `fan_${fanSuffix}@example.com`,
                password: 'password123',
                name: 'Super Fan',
                handle: `fan${fanSuffix}`
            })
        });
        if (!fanRes.ok) throw new Error(await fanRes.text());
        const fanData = await fanRes.json();
        const fanToken = fanData.accessToken;

        console.log('4. Generating Engagement...');
        // Fan Follows Owner
        const followRes = await fetch(`${API_URL}/users/${ownerId}/follow`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${fanToken}` }
        });
        if (!followRes.ok) throw new Error(`Follow failed: ${await followRes.text()}`);
        console.log('Fan followed owner');

        // Fan Likes Post
        const likeRes = await fetch(`${API_URL}/posts/${post.id}/like`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${fanToken}` }
        });
        // Note: Like might return 200 or 201
        if (!likeRes.ok) throw new Error(`Like failed: ${await likeRes.text()}`);
        console.log('Fan liked post');

        console.log('5. Verifying Business Stats...');
        // Fetch stats as owner
        const statsRes = await fetch(`${API_URL}/business/stats`, {
            headers: { 'Authorization': `Bearer ${ownerToken}` }
        });
        const stats = await statsRes.json();

        console.log('Received Stats:', stats);

        // Verification Logic
        // Followers: 1
        // Engagement: 1 (Like)
        // Impressions: 1 * 20 = 20

        if (stats.followers === "1" && stats.engagement === "1" && stats.impressions === "20") {
            console.log("SUCCESS: Business Stats verified correctly!");
        } else {
            console.error("FAILURE: Stats do not match expected values.");
            console.log("Expected: { followers: '1', engagement: '1', impressions: '20' }");
            process.exit(1);
        }

    } catch (e) {
        console.error('VERIFICATION FAILED:', e);
        process.exit(1);
    }
}

run();
