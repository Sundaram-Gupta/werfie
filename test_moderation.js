const jwt = require('jsonwebtoken');
const axios = require('axios');

const JWT_SECRET = 'dev-secret';
const token = jwt.sign({ sub: 'admin-123', email: 'admin@example.com' }, JWT_SECRET);

async function test() {
    try {
        const response = await axios.post('http://localhost:3010/api/moderation/report', {
            contentType: 'post',
            contentId: 'test-post-id',
            reason: 'testing 500 error'
        }, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        console.log('Success:', response.data);
    } catch (error) {
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Error Data:', error.response.data);
        } else {
            console.log('Error:', error.message);
        }
    }
}

test();
