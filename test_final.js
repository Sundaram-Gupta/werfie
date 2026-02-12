const http = require('http');
const fs = require('fs');

const fileName = 'test-final.txt';
if (!fs.existsSync(fileName)) fs.writeFileSync(fileName, 'Final Verification');

const boundary = '----WebKitFormBoundaryFinal';
const postData =
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n` +
    `Content-Type: text/plain\r\n\r\n` +
    fs.readFileSync(fileName) + '\r\n' +
    `--${boundary}--`;

const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/media/upload',
    method: 'POST',
    headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': Buffer.byteLength(postData),
        'Origin': 'http://localhost:5173'
    }
};

const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        console.log(`STATUS: ${res.statusCode}`);
        console.log(`BODY: ${body}`);
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.write(postData);
req.end();
