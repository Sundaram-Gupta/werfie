const axios = require('axios');

async function testFeed() {
    try {
        console.log('Testing Content Service directly on port 3003...');
        // We need a valid token or just use the fallback if permitted (though my middleware enforces)
        // Let's try to hit it. If it returns 401, at least we know it's hitting MY middleware.
        const response = await axios.get('http://localhost:3003/timeline/home', {
            headers: {
                'x-user-id': 'user-1' // Fallback handled in my auth middleware
            }
        });
        console.log('Response status:', response.status);
        console.log('Data keys:', Object.keys(response.data));
        console.log('Posts count:', response.data.posts?.length);
        if (response.data.posts && response.data.posts.length > 0) {
            console.log('First item:', JSON.stringify(response.data.posts[0], null, 2));
        }
    } catch (error) {
        console.error('Error hitting Content Service:', error.response?.status, error.response?.data || error.message);
    }
}

testFeed();
