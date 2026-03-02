const axios = require('axios');

async function testAnnouncementFeed() {
    try {
        console.log('Testing Announcements Feed via Gateway (3001)...');
        const response = await axios.get('http://localhost:3001/api/announcements/feed');
        console.log('Response status:', response.status);
        console.log('Data type:', typeof response.data);
        console.log('Data length:', Array.isArray(response.data) ? response.data.length : 'N/A');
        console.log('Data sample:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('Error hitting Announcements Feed:', error.response?.status, error.response?.data || error.message);
    }
}

testAnnouncementFeed();
