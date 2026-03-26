const http = require('http');

const req = http.request({
    hostname: '127.0.0.1',
    port: 3012,
    path: '/api/admin/verifications?type=BUSINESS',
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
        // Fake admin token - using a pre-known admin token format
        'Authorization': 'Bearer dummy-for-test'
    }
}, (res) => {
    let rawData = '';
    console.log(`STATUS: ${res.statusCode}`);
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', () => {
        try {
            const parsed = JSON.parse(rawData);
            console.log(`RESPONSE: ${JSON.stringify(parsed, null, 2).substring(0, 500)}`);
        } catch(e) {
            console.log(`RAW: ${rawData.substring(0, 500)}`);
        }
    });
});

req.on('error', (e) => {
    console.error(`Error: ${e.message}`);
});
req.end();
