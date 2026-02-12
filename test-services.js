const axios = require('axios');

const services = [
    { name: 'Auth', port: 3001, url: 'http://localhost:3001/api/health' },
    { name: 'User', port: 3002, url: 'http://localhost:3002/health' }, // assuming health endpoint
    { name: 'Content', port: 3003, url: 'http://localhost:3003/health' },
    { name: 'Timeline', port: 3004, url: 'http://localhost:3004/health' },
    { name: 'Notification', port: 3005, url: 'http://localhost:3005/health' },
    { name: 'Search', port: 3006, url: 'http://localhost:3006/health' },
];

async function checkService(service) {
    try {
        await axios.get(service.url, { timeout: 2000 });
        console.log(`[PASS] ${service.name} Service is UP (Port ${service.port})`);
    } catch (error) {
        console.log(`[FAIL] ${service.name} Service is DOWN or Erroring (Port ${service.port}) - ${error.message}`);
        if (error.response) {
            console.log(`       Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`);
        }
    }
}

async function main() {
    console.log('Checking Service Health...');
    for (const service of services) {
        await checkService(service);
    }
}

main();
