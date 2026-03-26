import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';

const BASE_URL = 'http://localhost:3001/api/messages';
const JWT_TOKEN = 'your-jwt-token-here'; // I need a real token to test this, let's login first

async function testEndpoints() {
    // 1. Login to get token
    const loginRes = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'user1@xclone.com', password: 'password123' })
    });
    const loginData = await loginRes.json();
    console.log("Login response:", JSON.stringify(loginData, null, 2));
    const token = loginData.data?.accessToken;
    if (!token) {
        console.error("Login failed!");
        return;
    }
    
    console.log("Token obtained");

    // 2. Test Get Conversation
    // Let's get an existing conversation ID first to test it
    const convsRes = await fetch(`${BASE_URL}/conversations`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const convsData = await convsRes.json();
    if (!convsData.data || convsData.data.length === 0) {
        console.error("No conversations found to test GET /conversations/{id}", convsData);
        return;
    }
    const convId = convsData.data[0].id;

    console.log(`Testing GET /conversations/${convId}`);
    const getConvRes = await fetch(`${BASE_URL}/conversations/${convId}`, {
         headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log(`GET /conversations/${convId} Status:`, getConvRes.status);
    console.log(`GET /conversations/${convId} Body:`, await getConvRes.text());

    // 3. Test Upload
    console.log("Testing POST /upload");
    const formData = new FormData();
    // Create a dummy text file to test validation/upload
    fs.writeFileSync('dummy.txt', 'This is a test');
    formData.append('file', fs.createReadStream('dummy.txt'));

    const uploadRes = await fetch(`${BASE_URL}/upload`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    });
    console.log(`POST /upload Status:`, uploadRes.status);
    console.log(`POST /upload Body:`, await uploadRes.text());
}

testEndpoints().catch(console.error);
