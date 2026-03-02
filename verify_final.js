async function verify() {
    try {
        // 1. Login with a seeded user
        // Note: Using the handle from previous output
        const loginRes = await fetch('http://localhost:3001/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'seeded_user_1771224470838@example.com', // Derived from timestamp
                password: 'password123'
            })
        });

        if (!loginRes.ok) {
            console.error('Login failed, trying with handle/password if email failing...');
            // Fallback just in case
        }

        const loginData = await loginRes.json();
        const token = loginData.accessToken;

        if (!token) {
            console.error('Could not get token. Testing with suggestions for posts...');
            return;
        }

        // 2. Fetch posts
        const postsRes = await fetch('http://localhost:3001/api/posts', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await postsRes.json();
        const posts = data.posts || [];

        console.log('--- Final Post Verification Report ---');
        console.log(`Total posts found: ${posts.length}`);

        const seededPosts = posts.filter(p => p.content && p.content.includes('#seeded'));
        console.log(`Seeded posts found in latest feed: ${seededPosts.length}`);

        if (seededPosts.length > 0) {
            console.log('Details of seeded posts:');
            seededPosts.slice(0, 5).forEach((p, idx) => {
                console.log(`${idx + 1}. By: ${p.user?.profile?.name || 'Unknown'} (@${p.user?.profile?.handle})`);
                console.log(`   Content: ${p.content}`);
                console.log(`   Media: ${p.media?.length || 0} items`);
                if (p.media?.[0]) {
                    console.log(`   Media Type: ${p.media[0].type}`);
                }
            });
        }
    } catch (e) {
        console.error('Final verification failed:', e.message);
    }
}
verify();
