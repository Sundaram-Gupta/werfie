import fetch from 'node-fetch';

async function test() {
  // Login as user1
  const loginRes = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'user1@xclone.com', password: 'password123' })
  });
  const loginData = await loginRes.json();
  const token1 = loginData.data?.accessToken;
  const userId1 = loginData.data?.id;
  console.log('✅ Logged in as user1, id:', userId1);

  // Get posts - find one NOT owned by user1
  const postsRes = await fetch('http://localhost:3001/api/posts/timeline/home?limit=20', {
    headers: { 'Authorization': `Bearer ${token1}` }
  });
  const postsData = await postsRes.json();
  const posts = postsData.data?.posts || postsData.posts || postsData;
  
  const ownPost = posts.find(p => (p.userId || p.user?.id) === userId1);
  const otherPost = posts.find(p => (p.userId || p.user?.id) !== userId1);

  console.log('Post owner IDs (first 3):', posts.slice(0,3).map(p=> p.userId || p.user?.id));
  console.log('Own post:', ownPost?.id, 'owner:', ownPost?.userId);
  console.log('Other post:', otherPost?.id, 'owner:', otherPost?.userId);

  if (ownPost) {
    const res = await fetch(`http://localhost:3001/api/posts/${ownPost.id}/analytics`, {
      headers: { 'Authorization': `Bearer ${token1}` }
    });
    console.log('\n✅ OWN POST analytics -> Status:', res.status, '(expected 200)');
  }

  if (otherPost) {
    const res = await fetch(`http://localhost:3001/api/posts/${otherPost.id}/analytics`, {
      headers: { 'Authorization': `Bearer ${token1}` }
    });
    const body = await res.json();
    console.log('\n🚫 OTHER user post analytics -> Status:', res.status, '(expected 403)');
    console.log('Message:', body.message);
  }
}

test().catch(console.error);
