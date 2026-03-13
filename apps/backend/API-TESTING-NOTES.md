# API Testing Notes - Quick Reference

**Server:** `http://localhost:3001`  
**Status:** ✅ All 25 endpoints working  
**Last Updated:** January 12, 2026

---

## 🎯 Quick Setup

```bash
# Set base URL
export BASE_URL="http://localhost:3001"

# These will be filled after registration/login
export ACCESS_TOKEN=""
export REFRESH_TOKEN=""
export USER_ID=""
export POST_ID=""
```

---

## 📝 Important Notes

### ⚠️ Authentication
- **Access Token:** Expires in 15 minutes
- **Refresh Token:** Expires in 7 days
- **Protected Routes:** Require `Authorization: Bearer <token>` header
- **Public Routes:** No authentication needed

### 🔐 Security Features
- ✅ Passwords hashed with bcrypt (10 rounds)
- ✅ JWT tokens with HS256 algorithm
- ✅ Unique constraints on email, handle, likes, follows
- ✅ User can only modify their own data
- ✅ Input validation with Zod schemas

### 📏 Validation Rules
- **Email:** Must be valid format
- **Password:** Minimum 8 characters
- **Name:** Minimum 1 character
- **Handle:** Minimum 3 characters, alphanumeric + underscore only
- **Post Content:** Maximum 280 characters
- **Media:** Only images (jpg, png, gif, webp) and videos (mp4)

---

## 🚀 Common Workflows

### 1️⃣ User Registration & Login Flow

```bash
# Step 1: Register
curl -X POST $BASE_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123",
    "name": "John Doe",
    "handle": "johndoe"
  }'

# Save the tokens from response
export ACCESS_TOKEN="<paste-access-token>"
export REFRESH_TOKEN="<paste-refresh-token>"
export USER_ID="<paste-user-id>"

# Step 2: Verify login works
curl -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123"
  }'

# Step 3: Get current user info
curl $BASE_URL/api/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**✅ Expected:** 201 for register, 200 for login, user data returned

---

### 2️⃣ Creating & Interacting with Posts

```bash
# Create a post
curl -X POST $BASE_URL/api/posts \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Hello World! This is my first tweet 🚀"
  }'

# Save post ID
export POST_ID="<paste-post-id>"

# Like the post
curl -X POST $BASE_URL/api/posts/$POST_ID/like \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Retweet the post
curl -X POST $BASE_URL/api/posts/$POST_ID/retweet \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Reply to the post
curl -X POST $BASE_URL/api/posts \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Great post!",
    "replyToId": "'$POST_ID'"
  }'

# Get post with stats
curl $BASE_URL/api/posts/$POST_ID
```

**✅ Expected:** Post created with ID, likes/retweets increment, replies appear

---

### 3️⃣ Following Users & Timeline

```bash
# Create a second user first
curl -X POST $BASE_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane@example.com",
    "password": "password123",
    "name": "Jane Smith",
    "handle": "janesmith"
  }'

export USER_TO_FOLLOW="<jane-user-id>"

# Follow the user
curl -X POST $BASE_URL/api/users/$USER_TO_FOLLOW/follow \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Get your timeline (shows posts from followed users + your posts)
curl "$BASE_URL/api/timeline/home?limit=20" \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Get user's followers
curl "$BASE_URL/api/users/$USER_TO_FOLLOW/followers?limit=20"

# Unfollow
curl -X DELETE $BASE_URL/api/users/$USER_TO_FOLLOW/follow \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**✅ Expected:** Follow created, timeline shows relevant posts, follower count updates

---

### 4️⃣ Search & Discovery

```bash
# Search for posts containing "hello"
curl "$BASE_URL/api/search/posts?q=hello&limit=20"

# Search for users by name or handle
curl "$BASE_URL/api/search/users?q=john&limit=20"

# Get all posts (public feed)
curl "$BASE_URL/api/posts?limit=20"

# Get posts by specific user
curl "$BASE_URL/api/posts?userId=$USER_ID&limit=10"
```

**✅ Expected:** Matching results returned, case-insensitive search

---

### 5️⃣ Profile Management

```bash
# Get user profile (public)
curl $BASE_URL/api/users/$USER_ID

# Update your profile
curl -X PUT $BASE_URL/api/users/$USER_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Updated",
    "bio": "Software Developer | Tech Enthusiast",
    "location": "San Francisco, CA",
    "website": "https://johndoe.com",
    "birthdate": "1990-01-01"
  }'
```

**✅ Expected:** Profile updated, changes reflected immediately

---

### 6️⃣ Notifications

```bash
# Get your notifications
curl "$BASE_URL/api/notifications?limit=20" \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Mark notification as read
export NOTIFICATION_ID="<notification-id>"
curl -X PUT $BASE_URL/api/notifications/$NOTIFICATION_ID/read \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**✅ Expected:** Notifications for likes, retweets, follows, replies

---

### 7️⃣ Token Refresh & Logout

```bash
# When access token expires, refresh it
curl -X POST $BASE_URL/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}"

# Update access token
export ACCESS_TOKEN="<new-access-token>"

# Logout (invalidates refresh token)
curl -X POST $BASE_URL/api/auth/logout \
  -H "Authorization: Bearer $REFRESH_TOKEN"
```

**✅ Expected:** New access token received, logout successful

---

## 🐛 Common Errors & Solutions

### ❌ "Missing or invalid authorization header"
**Problem:** No token provided or wrong format  
**Solution:** Add header: `Authorization: Bearer <token>`

### ❌ "Unauthorized" (403)
**Problem:** Trying to modify someone else's data  
**Solution:** Only modify your own posts/profile

### ❌ "Invalid credentials" (401)
**Problem:** Wrong email or password  
**Solution:** Check credentials, ensure user exists

### ❌ "Already liked this post" (400)
**Problem:** Duplicate action  
**Solution:** Unlike first, then like again

### ❌ "Validation error"
**Problem:** Invalid input data  
**Solution:** Check validation rules (password length, email format, etc.)

### ❌ "Post not found" (404)
**Problem:** Invalid post ID  
**Solution:** Verify post ID exists

### ❌ "Cannot follow yourself"
**Problem:** Trying to follow your own account  
**Solution:** Follow a different user

---

## 📊 Response Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | GET requests, DELETE successful |
| 201 | Created | POST register, create post, like |
| 400 | Bad Request | Validation error, duplicate action |
| 401 | Unauthorized | Invalid/missing token |
| 403 | Forbidden | Not allowed to modify resource |
| 404 | Not Found | User/post doesn't exist |
| 500 | Server Error | Internal error (check logs) |

---

## 🧪 Testing Tips

### Use jq for Pretty JSON
```bash
curl $BASE_URL/api/posts | jq .
```

### Save Response to Variable
```bash
RESPONSE=$(curl -s $BASE_URL/api/auth/login -H "Content-Type: application/json" -d '{"email":"test@test.com","password":"pass123"}')
ACCESS_TOKEN=$(echo $RESPONSE | jq -r '.accessToken')
```

### Test Multiple Users
```bash
# Create multiple test users
for i in {1..5}; do
  curl -X POST $BASE_URL/api/auth/register \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"user$i@test.com\",\"password\":\"pass123\",\"name\":\"User $i\",\"handle\":\"user$i\"}"
done
```

### Run Automated Tests
```bash
cd /Users/ashish/Aspire/X/X-Backend
./test-all-apis.sh
```

---

## 📱 Media Upload (Not in automated tests)

```bash
# Upload an image
curl -X POST $BASE_URL/api/media/upload \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -F "file=@/path/to/image.jpg"

# Response will include URL
# Use the URL in post creation
curl -X POST $BASE_URL/api/posts \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Check out this photo!",
    "mediaUrls": ["/uploads/uuid.jpg"]
  }'
```

**Allowed Types:** jpg, png, gif, webp, mp4

---

## 🔄 Pagination

Most list endpoints support pagination:

```bash
# Get first 20 posts
curl "$BASE_URL/api/posts?limit=20"

# Get next 20 posts using cursor
curl "$BASE_URL/api/posts?limit=20&cursor=<last-post-id>"
```

**Endpoints with Pagination:**
- GET `/api/posts`
- GET `/api/posts/:postId/replies`
- GET `/api/users/:userId/followers`
- GET `/api/users/:userId/following`
- GET `/api/timeline/home`
- GET `/api/notifications`

---

## 💡 Pro Tips

1. **Save tokens in environment variables** for easier testing
2. **Use the test script** (`test-all-apis.sh`) to verify everything works
3. **Check server logs** in the terminal for detailed error messages
4. **Use unique emails** for each test user (add timestamp)
5. **Clean up test data** by deleting posts/users after testing
6. **Test error cases** to ensure proper validation
7. **Use Postman/Insomnia** for easier API testing with GUI

---

## 🎯 Quick Verification Checklist

- [ ] Register new user → Get tokens
- [ ] Login with same user → Get tokens
- [ ] Create a post → Get post ID
- [ ] Like the post → Success
- [ ] Unlike the post → Success
- [ ] Create second user → Get user ID
- [ ] Follow second user → Success
- [ ] Get timeline → See posts
- [ ] Search posts → Find results
- [ ] Get notifications → See activity
- [ ] Logout → Token invalidated

---

## 📚 Additional Resources

- **Full API Docs:** `API-TESTING-GUIDE.md`
- **Bug Fixes:** `BUG-FIXES-SUMMARY.md`
- **Quick Start:** `QUICK-START.md`
- **Test Script:** `test-all-apis.sh`

---

## ✅ Status Summary

**Total Endpoints:** 26  
**Working:** 26 (100%)  
**Protected:** 14  
**Public:** 12  

**Last Test:** January 12, 2026  
**Result:** ✅ All tests passed

---

**Happy Testing! 🚀**
