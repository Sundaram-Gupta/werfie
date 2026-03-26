import fetch from 'node-fetch';

async function test() {
  try {
    const loginRes = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'user1@xclone.com', password: 'password123' })
    });
    const loginData = await loginRes.json();
    const token = loginData.data.accessToken;
    console.log('Login status:', loginRes.status);

    if (!token) {
      console.log('Failed to get token', loginData);
      return;
    }

    const reactRes = await fetch('http://localhost:3001/api/messages/1/react', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ emoji: '👍' })
    });
    
    // Attempt to log the raw text if JSON parsing fails
    let reactData;
    let text = await reactRes.text();
    try {
      reactData = JSON.parse(text);
    } catch(e) {
      reactData = text;
    }
    
    console.log('React status:', reactRes.status);
    console.log('React data:', reactData);
  } catch(e) {
    console.error('Error:', e);
  }
}
test();
