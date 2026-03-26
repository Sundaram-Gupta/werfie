import fetch from 'node-fetch';

async function test() {
  try {
    console.log('--- Logging in User 1 ---');
    const login1 = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'user1@xclone.com', password: 'password123' })
    });
    const { data: { accessToken: token1, id: user1Id } } = await login1.json();
    
    // Using a known secondary user (admin or any user from DB)
    const user2Id = '0001f475-39f8-4865-a2b6-75ad3b39fc09';

    console.log('--- User 1 Sends Message to User 2 ---');
    const msgRes = await fetch(`http://localhost:3001/api/messages/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token1}` },
      body: JSON.stringify({ recipientId: user2Id, content: 'Secret Message from User 1 to 2' })
    });
    const msgData = await msgRes.json();
    const msgId = msgData.data.id;
    const convId = msgData.data.conversationId;
    console.log('Message ID:', msgId, 'Conv ID:', convId);

    console.log('--- User 1 Hides the Message ---');
    const hideRes = await fetch(`http://localhost:3001/api/messages/${msgId}/hide`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token1}` }
    });
    const hideData = await hideRes.json();
    console.log('Hide OK:', hideRes.ok, hideData.message);

    console.log('--- Fetching Messages for User 1 ---');
    const get1Res = await fetch(`http://localhost:3001/api/messages/conversations/${convId}/messages`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token1}` }
    });
    const get1Data = await get1Res.json();
    const visibleForUser1 = get1Data.data.some(m => m.id === msgId);
    console.log('Is message visible for User 1?', visibleForUser1); // Should be false
    
    // Now let's try to query as User 2 to ensure it IS visible.
    // Wait, I need User 2's token for this. But I don't know the password for User 2.
    // However, I can temporarily write a mock script or just trust the DB logic for now, 
    // or I can do a direct Prisma check! Let's do a direct Prisma check to prove it's still in the DB 
    // and that it's only marked in HiddenMessage for User 1.

    console.log('--- Verifying DB State Directly ---');
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient({datasources:{db:{url:'postgresql://postgres:root@localhost:5432/xclone_db'}}});
    
    const hiddenEntries = await prisma.hiddenMessage.findMany({ where: { messageId: msgId } });
    console.log('Hidden entries:', hiddenEntries);
    
    const theMessage = await prisma.message.findUnique({ where: { id: msgId } });
    console.log('Does the message STILL EXIST in DB?:', !!theMessage);

    // Simulate getMessages for User 2
    const msgsForUser2 = await prisma.message.findMany({
        where: {
            conversationId: convId,
            NOT: { hiddenBy: { some: { userId: user2Id } } }
        }
    });
    const visibleForUser2 = msgsForUser2.some(m => m.id === msgId);
    console.log('Is message query returning it for User 2?:', visibleForUser2); // Should be true
    
    await prisma.$disconnect();

  } catch(e) {
    console.error('Error:', e);
  }
}
test();
