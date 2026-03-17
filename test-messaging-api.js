import axios from 'axios';

const API_URL = 'http://localhost:3019'; // Messaging service direct
const USER_ID = '239dacb7-4de7-4e41-8f38-151df39f2f62'; // From logs

async function test() {
    try {
        console.log(`Fetching conversations for user ${USER_ID}...`);
        const response = await axios.get(`${API_URL}/api/messages/conversations`, {
            headers: {
                'x-verified-gateway': 'true',
                'x-user-id': USER_ID
            }
        });
        console.log('Response Status:', response.status);
        console.log('Response Data:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('Error:', error.response?.status, error.response?.data || error.message);
    }
}

test();
