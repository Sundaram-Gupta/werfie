const http = require('http');

const req = http.request({
    hostname: '127.0.0.1',
    port: 3002,
    path: '/api/business/request-verification',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'a402bff3-f913-4d0b-a410-fff31b556aaa', // Replace with the real user id if needed
        'x-verified-gateway': 'true'
    }
}, (res) => {
    let rawData = '';
    console.log(`STATUS: ${res.statusCode}`);
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', () => {
        console.log(`BODY: ${rawData}`);
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});
req.end();
