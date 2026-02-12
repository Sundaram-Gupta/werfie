const http = require('http');
const fs = require('fs');

const fileName = 'test-upload.txt';
if (!fs.existsSync(fileName)) fs.writeFileSync(fileName, 'This is a test content');

const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
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
    res.setEncoding('utf8');
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        console.log(`STATUS: ${res.statusCode}`);
        // Write body to file
        fs.writeFileSync('upload_result.json', body);
        console.log('Result written to upload_result.json');
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.write(postData);
req.end();
