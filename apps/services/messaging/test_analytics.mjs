import fetch from 'node-fetch';

async function test() {
  // Login first  
  const loginRes = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'user1@xclone.com', password: 'password123' })
  });
  const loginData = await loginRes.json();
  const token = loginData.data?.accessToken;
  if (!token) { console.error('Login failed', loginData); return; }
  console.log('✅ Logged in');

  // Get a post
  const postsRes = await fetch('http://localhost:3001/api/posts/timeline/home?limit=3', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const postsData = await postsRes.json();
  const posts = postsData.data?.posts || postsData.posts || postsData;
  if (!posts?.length) { console.error('No posts', postsData); return; }
  const postId = posts[0].id;
  console.log(`✅ Got post ID: ${postId}`);

  // Test analytics endpoint
  const analyticsRes = await fetch(`http://localhost:3001/api/posts/${postId}/analytics`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log(`Analytics status: ${analyticsRes.status}`);
  const analyticsData = await analyticsRes.json();
  console.log('Analytics response:', JSON.stringify(analyticsData, null, 2));
}

test().catch(console.error);
