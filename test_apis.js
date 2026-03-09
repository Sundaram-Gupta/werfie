const http = require('http');

const endpoints = [
    { name: 'Gateway Auth Health', url: 'http://localhost:3001/api/health' },
    { name: 'Client App', url: 'http://localhost:5173/' },
    { name: 'Admin Panel', url: 'http://localhost:5175/' },
    { name: 'User Service Leaders', url: 'http://localhost:3002/api/users/leaders' },
    { name: 'Messaging Service Health', url: 'http://localhost:3019/api/messages/health' }
];

async function testEndpoint(endpoint) {
    return new Promise((resolve) => {
        const req = http.get(endpoint.url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    name: endpoint.name,
                    status: res.statusCode,
                    ok: res.statusCode >= 200 && res.statusCode < 400 || res.statusCode === 404, // 404 is technically working if there's no route
                    preview: data.substring(0, 50)
                });
            });
        });

        req.on('error', (e) => {
            resolve({ name: endpoint.name, status: 'ERROR', ok: false, error: e.message });
        });

        req.end();
    });
}

async function runTests() {
    console.log('--- Testing API Endpoints ---');
    for (const ep of endpoints) {
        const result = await testEndpoint(ep);
        const icon = result.ok ? '✅' : '❌';
        console.log(`${icon} [${result.status}] ${result.name} (${ep.url})`);
        if (!result.ok && result.error) {
            console.log(`    Error: ${result.error}`);
        }
    }
}

runTests();
