const axios = require('axios');

async function verify() {
    const baseUrl = 'http://localhost:3002/api/institutional';
    // We need a token. Let's assume we can get one or the service is running in a way we can test.
    // Since I can't easily get a valid JWT here without a user, I'll check if the route is at least registered.

    try {
        console.log('Testing GET /api/institutional (should return 401 if unauthenticated)...');
        const res = await axios.get('http://localhost:3002/api/institutional');
        console.log('Success:', res.status, res.data);
    } catch (error) {
        if (error.response?.status === 401) {
            console.log('Verified: Route is registered and requires authentication.');
        } else {
            console.error('Error:', error.response?.status, error.response?.data || error.message);
        }
    }
}

verify();
