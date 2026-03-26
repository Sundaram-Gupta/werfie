const axios = require('axios');

async function benchmark() {
    const urls = [
        'http://localhost:3003/timeline/home',
        'http://localhost:3003/timeline/home?random=1',
        'http://localhost:3003/health'
    ];

    for (const url of urls) {
        console.log(`\nTesting ${url}...`);
        const start = Date.now();
        try {
            const res = await axios.get(url, { timeout: 10000 });
            const duration = Date.now() - start;
            console.log(`Success! Status: ${res.status}, Duration: ${duration}ms, Posts: ${res.data.posts?.length || res.data.length || 0}`);
        } catch (err) {
            const duration = Date.now() - start;
            console.error(`Error! Duration: ${duration}ms, Message: ${err.message}`);
        }
    }
}

benchmark();
