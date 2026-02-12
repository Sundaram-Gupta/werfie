const axios = require('axios');

async function testAPI() {
    try {
        // Try without /api prefix
        const response = await axios.get('http://localhost:3003/', {
            headers: {
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5MmE3OTNmYy1hYWY5LTQ4MWUtOGQyYy1jZDI2ZDQ2MzQ2YjkiLCJlbWFpbCI6ImNvbGxhYm5lc3RAZ21haWwuY29tIiwiaWF0IjoxNzM4ODM2NTQxfQ.qCvWJZlW9ggPPGqLjJPvFnUqEZnNHhJCJRZYqPPCWJo'
            }
        });

        console.log('\n=== API Response (http://localhost:3003/) ===');
        console.log('Posts count:', response.data.posts?.length || 0);

        if (response.data.posts && response.data.posts.length > 0) {
            const postsWithMedia = response.data.posts.filter(p => p.media && p.media.length > 0);
            console.log('Posts with media:', postsWithMedia.length);

            if (postsWithMedia.length > 0) {
                const firstPost = postsWithMedia[0];
                console.log('\nFirst Post with Media:');
                console.log('ID:', firstPost.id);
                console.log('Content:', firstPost.content?.substring(0, 50));
                console.log('Media array:', JSON.stringify(firstPost.media, null, 2));
            }
        }
    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
        }
    }
}

testAPI();
