async function verify() {
    try {
        const res = await fetch('http://localhost:3001/api/posts/search?q=%23seeded');
        const data = await res.json();

        console.log('--- Verification Report ---');
        console.log('Response Type:', typeof data);
        console.log('Is Array:', Array.isArray(data));

        const posts = Array.isArray(data) ? data : (data.posts || []);
        console.log(`Seeded posts found: ${posts.length}`);

        if (posts.length > 0) {
            console.log('Details of latest seeded posts:');
            posts.slice(0, 3).forEach((p, idx) => {
                console.log(`${idx + 1}. Author: ${p.user?.profile?.name || 'Unknown'}`);
                console.log(`   Content: ${p.content}`);
                console.log(`   Media: ${p.media?.length || 0} items`);
            });
        } else {
            console.log('No posts found with #seeded tag.');
            console.log('Raw response (first 200 chars):', JSON.stringify(data).substring(0, 200));
        }
    } catch (e) {
        console.error('Verification failed:', e.message);
    }
}
verify();
