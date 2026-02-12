const axios = require('axios');

async function main() {
    try {
        console.log('Testing Auth Service APIs (Port 3001)...');

        // 1. Health Check
        try {
            const health = await axios.get('http://localhost:3001/api/health');
            console.log('Health Endpoint Status:', health.status);
        } catch (e) {
            console.log('Health Endpoint Failed:', e.message);
            if (e.response) console.log('Data:', e.response.data);
        }

        // 2. Auth Endpoint (e.g., trying to login with dummy data to see if it hits DB)
        try {
            console.log('Testing Login...');
            const login = await axios.post('http://localhost:3001/api/auth/login', {
                email: 'test@example.com',
                password: 'password'
            });
            console.log('Login Status:', login.status);
        } catch (e) {
            console.log('Login Endpoint Failed:', e.message);
            if (e.response) {
                console.log('Status:', e.response.status);
                // console.log('Data:', e.response.data); // Uncomment if needed
            }
        }

    } catch (error) {
        console.error('Test Script Error:', error.message);
    }
}

main();
