async function verifyTrends() {
    try {
        const res = await fetch('http://localhost:3001/api/trends');
        const trends = await res.json();

        console.log('--- Trend Verification Report ---');
        console.log(`Total trends found: ${trends.length}`);

        const seededTrends = trends.filter(t => ['SeededTrend', 'WerfieTest', 'MixedMedia'].includes(t.topic));
        console.log(`Seeded trends found: ${seededTrends.length}`);

        if (seededTrends.length > 0) {
            console.log('Top Seeded Trends:');
            seededTrends.forEach(t => {
                console.log(`- ${t.topic} (${t.posts} posts) [${t.category}]`);
            });
        }
    } catch (e) {
        console.error('Trend verification failed:', e.message);
    }
}
verifyTrends();
