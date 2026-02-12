const axios = require('axios');

async function testEndpoints() {
    const API = 'http://localhost:3003';
    // Ideally we need a token, but let's check basic health first or assume we have a test token.
    // Since I can't easily get a token without logging in, I'll rely on server logs or 'health'.

    try {
        const health = await axios.get(`${API}/health`);
        console.log('Health:', health.data);
    } catch (e) {
        console.error('Health check failed:', e.message);
    }
}

testEndpoints();
