import fetch from 'node-fetch';

async function test() {
  try {
    console.log('--- Logging in User 1 ---');
    const loginRes = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'user1@xclone.com', password: 'password123' })
    });
    if (!loginRes.ok) throw new Error('User 1 login failed');
    const { data: { accessToken: token1, id: user1Id } } = await loginRes.json();
    
    const user2Id = '0001f475-39f8-4865-a2b6-75ad3b39fc09';

    console.log('--- Sending Message ---');
    const msgRes = await fetch(`http://localhost:3001/api/messages/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token1}` },
      body: JSON.stringify({ recipientId: user2Id, content: 'Hello World!' })
    });
    const msgData = await msgRes.json();
    if (!msgData.status) {
        console.error('Failed to send message:', msgData);
        return;
    }
    const msgId = msgData.data.id;
    console.log('Message ID:', msgId);

    console.log('--- Testing Reaction (POST /react) ---');
    const reactRes = await fetch(`http://localhost:3001/api/messages/${msgId}/react`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token1}` },
      body: JSON.stringify({ emoji: '👍' })
    });
    const reactData = await reactRes.json();
    console.log('React OK:', reactData.status === true);
    
    console.log('--- Testing Edit (PATCH /) ---');
    const editRes = await fetch(`http://localhost:3001/api/messages/${msgId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token1}` },
      body: JSON.stringify({ content: 'Edited Hello World!' })
    });
    const editData = await editRes.json();
    console.log('Edit OK:', editData.status === true);
    
    console.log('--- Testing Hide (DELETE /hide) ---');
    const hideRes = await fetch(`http://localhost:3001/api/messages/${msgId}/hide`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token1}` }
    });
    const hideData = await hideRes.json();
    console.log('Hide OK:', hideData.status === true);

  } catch(e) {
    console.error('Error:', e);
  }
}
test();
