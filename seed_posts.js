const fs = require('fs');
const path = require('path');
const http = require('http');

const API_BASE = 'http://localhost:3001';
const IMAGE_PATH = path.join(__dirname, 'apps/client/public/websplash.png');
const ITERATIONS = 10;

// Helper for requests
async function request(method, path, body = null, headers = {}, isMultipart = false) {
    return new Promise((resolve, reject) => {
        const url = new URL(API_BASE + path);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        if (isMultipart) {
            delete options.headers['Content-Type']; // Let the request handle it or set manually
        }

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        resolve(data);
                    }
                } else {
                    reject({ statusCode: res.statusCode, body: data });
                }
            });
        });

        req.on('error', reject);

        if (body) {
            req.write(body);
        }
        req.end();
    });
}

async function uploadImage(token) {
    return new Promise((resolve, reject) => {
        const boundary = '----WebKitFormBoundarySeed';
        const fileContent = fs.readFileSync(IMAGE_PATH);

        const postDataStart =
            `--${boundary}\r\n` +
            `Content-Disposition: form-data; name="file"; filename="seed-image.png"\r\n` +
            `Content-Type: image/png\r\n\r\n`;

        const postDataEnd = `\r\n--${boundary}--`;

        const options = {
            hostname: 'localhost',
            port: 3001,
            path: '/api/media/upload',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Content-Length': Buffer.byteLength(postDataStart) + fileContent.length + Buffer.byteLength(postDataEnd)
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(JSON.parse(data));
                } else {
                    reject(data);
                }
            });
        });

        req.write(postDataStart);
        req.write(fileContent);
        req.write(postDataEnd);
        req.end();
    });
}

async function main() {
    console.log('Starting seed process...');

    // 1. Login/Register
    const user = {
        email: `seed_${Date.now()}@example.com`,
        password: 'password123',
        name: 'Seed Bot',
        handle: `seedbot_${Date.now()}`
    };

    let token;
    try {
        console.log('Registering user...');
        const authData = await request('POST', '/api/auth/register', JSON.stringify({
            email: user.email,
            password: user.password,
            name: user.name,
            handle: user.handle
        }));
        token = authData.accessToken;
        console.log('Registered and logged in.');
    } catch (e) {
        console.log('Registration failed:', e);
        console.log('Trying login with default user...');
        try {
            const loginData = await request('POST', '/api/auth/login', JSON.stringify({
                email: 'user1@xclone.com',
                password: 'password123'
            }));
            token = loginData.accessToken;
            console.log('Logged in as user1.');
        } catch (loginError) {
            console.log('Login failed too. Trying admin...');
            try {
                const loginData = await request('POST', '/api/auth/login', JSON.stringify({
                    email: 'admin@example.com',
                    password: 'password'
                }));
                token = loginData.accessToken;
                console.log('Logged in as admin.');
            } catch (finalError) {
                console.error('All auth attempts failed.');
                return;
            }
        }
    }

    // 2. Loop
    for (let i = 0; i < ITERATIONS; i++) {
        try {
            console.log(`Creating post ${i + 1}/${ITERATIONS}...`);

            // Upload
            console.log('  Uploading image...');
            const uploadRes = await uploadImage(token);
            const mediaUrl = uploadRes.url; // This is the relative path returned by our fix
            console.log(`  Image uploaded: ${mediaUrl}`);

            // Create Post
            console.log('  Submitting post...');
            await request('POST', '/api/posts', JSON.stringify({
                content: `Auto-generated seed post ${i + 1} - ${new Date().toLocaleTimeString()}`,
                mediaUrls: [mediaUrl]
            }), {
                'Authorization': `Bearer ${token}`
            });
            console.log('  Post created successfully.');

            // Small delay to prevent rate limits or race conditions
            await new Promise(r => setTimeout(r, 500));

        } catch (e) {
            console.error(`Error in iteration ${i}:`, e);
        }
    }

    console.log('Seeding complete.');
}

main();
