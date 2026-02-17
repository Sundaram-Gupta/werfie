const fs = require('fs');
const path = require('path');
const http = require('http');

const API_BASE = 'http://localhost:3001';
const IMAGE_PATH = path.join(__dirname, 'apps/client/public/websplash.png');
const VIDEO_PATH = path.join(__dirname, 'apps/services/content/temp/1770383474329-WhatsApp Video 2025-12-27 at 17.07.06.mp4');

const ITERATIONS = 10;

// Helper for JSON requests (Registration)
async function jsonRequest(method, path, body = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(API_BASE + path);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: { 'Content-Type': 'application/json' }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try { resolve(JSON.parse(data)); } catch (e) { resolve(data); }
                } else {
                    reject({ statusCode: res.statusCode, body: data });
                }
            });
        });
        req.on('error', reject);
        if (body) req.write(body);
        req.end();
    });
}

// Helper for Multipart Post Creation
async function createMultipartPost(token, content, filePath, isVideo = false) {
    return new Promise((resolve, reject) => {
        const boundary = '----WebKitFormBoundaryPost' + Date.now();
        const fileContent = fs.readFileSync(filePath);
        const fileName = path.basename(filePath);
        const contentType = isVideo ? 'video/mp4' : 'image/png';

        const postDataChunks = [];

        // Content Field
        postDataChunks.push(Buffer.from(
            `--${boundary}\r\n` +
            `Content-Disposition: form-data; name="content"\r\n\r\n` +
            `${content}\r\n`
        ));

        // Media Field
        postDataChunks.push(Buffer.from(
            `--${boundary}\r\n` +
            `Content-Disposition: form-data; name="media"; filename="${fileName}"\r\n` +
            `Content-Type: ${contentType}\r\n\r\n`
        ));
        postDataChunks.push(fileContent);
        postDataChunks.push(Buffer.from(`\r\n--${boundary}--\r\n`));

        const totalLength = postDataChunks.reduce((acc, chunk) => acc + chunk.length, 0);

        const options = {
            hostname: 'localhost',
            port: 3001,
            path: '/api/posts/', // Important to match gateway location
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Content-Length': totalLength
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try { resolve(JSON.parse(data)); } catch (e) { resolve(data); }
                } else {
                    reject({ statusCode: res.statusCode, body: data });
                }
            });
        });

        req.on('error', reject);
        postDataChunks.forEach(chunk => req.write(chunk));
        req.end();
    });
}

async function main() {
    console.log('Starting seed process for 10 users and 10 posts...');

    for (let i = 0; i < ITERATIONS; i++) {
        const timestamp = Date.now() + i;
        const user = {
            email: `seeded_user_${timestamp}@example.com`,
            password: 'password123',
            name: `Seeded User ${i + 1}`,
            handle: `user_seed_${timestamp}`
        };

        try {
            console.log(`\n--- Iteration ${i + 1}/${ITERATIONS} ---`);

            // 1. Register User
            console.log(`Registering user: ${user.handle}...`);
            const authData = await jsonRequest('POST', '/api/auth/register', JSON.stringify(user));
            const token = authData.accessToken;
            console.log('User registered successfully.');

            // 2. Create Post with Media
            const isVideo = i % 2 !== 0;
            const mediaPath = isVideo ? VIDEO_PATH : IMAGE_PATH;
            const content = `This is a seeded post from ${user.name}. It contains a nice ${isVideo ? 'video' : 'image'}! #seeded #test_${i}`;

            console.log(`Creating post with ${isVideo ? 'video' : 'image'}...`);
            const post = await createMultipartPost(token, content, mediaPath, isVideo);
            console.log(`Post created successfully. ID: ${post.id}`);

            // Delay
            await new Promise(r => setTimeout(r, 1000));

        } catch (e) {
            console.error(`Error in iteration ${i + 1}:`, e);
        }
    }

    console.log('\nSeeding complete.');
}

main();
