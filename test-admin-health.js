const http = require('http');

const req = http.request({
    hostname: '127.0.0.1',
    port: 3012,
    path: '/api/admin/health',
    method: 'GET'
}, (res) => {
    let rawData = '';
    console.log(`STATUS: ${res.statusCode}`);
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', () => {
        console.log(`RAW: ${rawData}`);
    });
});

req.on('error', (e) => {
    console.error(`Error: ${e.message}`);
});
req.end();
