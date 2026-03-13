# X-Clone API Testing Guide - Complete cURL Reference

## 🔐 Security Features

All endpoints implement the following security measures:

✅ **Authentication Security**
- JWT tokens with HS256 signing algorithm
- Access tokens expire in 15 minutes
- Refresh tokens expire in 7 days
- Passwords hashed with bcrypt (10 rounds)
- Refresh tokens stored in database for revocation

✅ **Authorization Security**
- Protected endpoints require valid Bearer token
- Users can only modify their own data
- Token type validation (access vs refresh)
- User ownership verification on updates/deletes

✅ **Input Validation**
- Zod schema validation on all inputs
- Email format validation
- Password minimum length (8 characters)
- Handle format validation (alphanumeric + underscore)
- Content length limits (280 characters for posts)
- File type validation for uploads

✅ **Data Security**
- Unique constraints prevent duplicates (email, handle, likes, retweets, follows)
- Cascading deletes maintain data integrity
- SQL injection prevention via Prisma ORM
- No password hashes exposed in responses

---

## 📋 Testing Flow

**Recommended Testing Order:**
1. Register → Get tokens
2. Login → Verify authentication
3. Create post → Test content creation
4. Like/Retweet → Test interactions
5. Follow user → Test social features
6. Get timeline → Test feed
7. Get notifications → Test notification system

---

## 🧪 Complete API Test Suite

### Variables Setup

```bash
# Set these variables for easier testing
export BASE_URL="http://localhost:3001"
export ACCESS_TOKEN=""  # Will be set after login/register
export REFRESH_TOKEN="" # Will be set after login/register
export USER_ID=""       # Will be set after login/register
export POST_ID=""       # Will be set after creating a post
```

---

## 1️⃣ AUTHENTICATION ENDPOINTS

### 1.1 Register New User

**Endpoint:** `POST /api/auth/register`  
**Auth Required:** ❌ No  
**Security:** Password hashing, email validation, unique email/handle

```bash
curl -X POST $BASE_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123",
    "name": "John Doe",
    "handle": "johndoe"
  }'
```

**Expected Response (201):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": "uuid-here",
    "email": "john@example.com"
  }
}
```

**Save tokens:**
```bash
export ACCESS_TOKEN="paste-access-token-here"
export REFRESH_TOKEN="paste-refresh-token-here"
export USER_ID="paste-user-id-here"
```

**Validation Rules:**
- Email: Must be valid email format
- Password: Minimum 8 characters
- Name: Minimum 1 character
- Handle: Minimum 3 characters, alphanumeric + underscore only

**Error Cases:**
```bash
# Duplicate email
curl -X POST $BASE_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"pass123","name":"John","handle":"john2"}'
# Response: {"error":"User already exists"}

# Invalid password (too short)
curl -X POST $BASE_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"short","name":"Test","handle":"test"}'
# Response: {"error":"Validation error","details":[...]}
```

---

### 1.2 Login

**Endpoint:** `POST /api/auth/login`  
**Auth Required:** ❌ No  
**Security:** Password verification, rate limiting recommended

```bash
curl -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

**Expected Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": "uuid-here",
    "email": "john@example.com"
  }
}
```

**Error Cases:**
```bash
# Invalid credentials
curl -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"wrongpassword"}'
# Response: {"error":"Invalid credentials"}
```

---

### 1.3 Get Current User

**Endpoint:** `GET /api/auth/me`  
**Auth Required:** ✅ Yes (Access Token)  
**Security:** Token validation, user verification

```bash
curl $BASE_URL/api/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response (200):**
```json
{
  "id": "uuid-here",
  "email": "john@example.com",
  "createdAt": "2026-01-10T12:00:00.000Z"
}
```

**Error Cases:**
```bash
# Missing token
curl $BASE_URL/api/auth/me
# Response: {"error":"Missing or invalid authorization header"}

# Invalid token
curl $BASE_URL/api/auth/me \
  -H "Authorization: Bearer invalid-token"
# Response: {"error":"Unauthorized"}
```

---

### 1.4 Refresh Access Token

**Endpoint:** `POST /api/auth/refresh`  
**Auth Required:** ❌ No (but requires refresh token)  
**Security:** Refresh token validation, expiry check, database verification

```bash
curl -X POST $BASE_URL/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}"
```

**Expected Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9..."
}
```

**Update access token:**
```bash
export ACCESS_TOKEN="new-access-token-here"
```

**Error Cases:**
```bash
# Invalid refresh token
curl -X POST $BASE_URL/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"invalid-token"}'
# Response: {"error":"Invalid refresh token"}

# Expired refresh token
# Response: {"error":"Refresh token expired"}
```

---

### 1.5 Logout

**Endpoint:** `POST /api/auth/logout`  
**Auth Required:** ✅ Yes (Refresh Token)  
**Security:** Token invalidation in database

```bash
curl -X POST $BASE_URL/api/auth/logout \
  -H "Authorization: Bearer $REFRESH_TOKEN"
```

**Expected Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

---

## 2️⃣ USER PROFILE ENDPOINTS

### 2.1 Get User Profile

**Endpoint:** `GET /api/users/:userId`  
**Auth Required:** ❌ No  
**Security:** Public endpoint, no sensitive data exposed

```bash
curl $BASE_URL/api/users/$USER_ID
```

**Expected Response (200):**
```json
{
  "id": "uuid-here",
  "email": "john@example.com",
  "profile": {
    "id": "uuid-here",
    "userId": "uuid-here",
    "name": "John Doe",
    "handle": "johndoe",
    "bio": null,
    "avatar": null,
    "banner": null,
    "location": null,
    "website": null,
    "birthdate": null,
    "createdAt": "2026-01-10T12:00:00.000Z",
    "updatedAt": "2026-01-10T12:00:00.000Z"
  },
  "stats": {
    "followers": 0,
    "following": 0,
    "posts": 0
  },
  "createdAt": "2026-01-10T12:00:00.000Z"
}
```

**Error Cases:**
```bash
# User not found
curl $BASE_URL/api/users/invalid-uuid
# Response: {"error":"User not found"}
```

---

### 2.2 Update User Profile

**Endpoint:** `PUT /api/users/:userId`  
**Auth Required:** ✅ Yes  
**Security:** User can only update own profile

```bash
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

**Expected Response (200):**
```json
{
  "id": "uuid-here",
  "userId": "uuid-here",
  "name": "John Updated",
  "handle": "johndoe",
  "bio": "Software Developer | Tech Enthusiast",
  "avatar": null,
  "banner": null,
  "location": "San Francisco, CA",
  "website": "https://johndoe.com",
  "birthdate": "1990-01-01T00:00:00.000Z",
  "createdAt": "2026-01-10T12:00:00.000Z",
  "updatedAt": "2026-01-10T12:35:00.000Z"
}
```

**Error Cases:**
```bash
# Unauthorized (trying to update another user's profile)
curl -X PUT $BASE_URL/api/users/different-user-id \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Hacker"}'
# Response: {"error":"Unauthorized"}
```

---

### 2.3 Follow User

**Endpoint:** `POST /api/users/:userId/follow`  
**Auth Required:** ✅ Yes  
**Security:** Prevents self-follow, duplicate follows

```bash
# First, create another user to follow
curl -X POST $BASE_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane@example.com",
    "password": "password123",
    "name": "Jane Smith",
    "handle": "janesmith"
  }'

# Save Jane's user ID
export USER_TO_FOLLOW="jane-user-id-here"

# Follow Jane
curl -X POST $BASE_URL/api/users/$USER_TO_FOLLOW/follow \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response (201):**
```json
{
  "id": "uuid-here",
  "followerId": "your-user-id",
  "followingId": "jane-user-id",
  "createdAt": "2026-01-10T12:40:00.000Z"
}
```

**Error Cases:**
```bash
# Cannot follow yourself
curl -X POST $BASE_URL/api/users/$USER_ID/follow \
  -H "Authorization: Bearer $ACCESS_TOKEN"
# Response: {"error":"Cannot follow yourself"}

# Already following
curl -X POST $BASE_URL/api/users/$USER_TO_FOLLOW/follow \
  -H "Authorization: Bearer $ACCESS_TOKEN"
# Response: {"error":"Already following this user"}
```

---

### 2.4 Unfollow User

**Endpoint:** `DELETE /api/users/:userId/follow`  
**Auth Required:** ✅ Yes  
**Security:** User can only unfollow their own follows

```bash
curl -X DELETE $BASE_URL/api/users/$USER_TO_FOLLOW/follow \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response (200):**
```json
{
  "message": "Unfollowed successfully"
}
```

---

### 2.5 Get Followers

**Endpoint:** `GET /api/users/:userId/followers`  
**Auth Required:** ❌ No  
**Security:** Public endpoint

```bash
curl "$BASE_URL/api/users/$USER_ID/followers?limit=20"
```

**Expected Response (200):**
```json
{
  "followers": [
    {
      "id": "follower-user-id",
      "email": "follower@example.com",
      "profile": {
        "name": "Follower Name",
        "handle": "followerhandle",
        "avatar": null
      },
      "followedAt": "2026-01-10T12:45:00.000Z"
    }
  ],
  "nextCursor": null
}
```

**Query Parameters:**
- `limit` (optional): Number of results (default: 20)
- `cursor` (optional): Pagination cursor

---

### 2.6 Get Following

**Endpoint:** `GET /api/users/:userId/following`  
**Auth Required:** ❌ No  
**Security:** Public endpoint

```bash
curl "$BASE_URL/api/users/$USER_ID/following?limit=20"
```

**Expected Response (200):**
```json
{
  "following": [
    {
      "id": "following-user-id",
      "email": "following@example.com",
      "profile": {
        "name": "Following Name",
        "handle": "followinghandle",
        "avatar": null
      },
      "followedAt": "2026-01-10T12:40:00.000Z"
    }
  ],
  "nextCursor": null
}
```

---

## 3️⃣ POST ENDPOINTS

### 3.1 Create Post

**Endpoint:** `POST /api/posts`  
**Auth Required:** ✅ Yes  
**Security:** Content validation, length limits

```bash
curl -X POST $BASE_URL/api/posts \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Hello World! This is my first tweet. 🚀"
  }'
```

**Save post ID:**
```bash
export POST_ID="post-id-from-response"
```

**With media:**
```bash
curl -X POST $BASE_URL/api/posts \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Check out these amazing photos!",
    "mediaUrls": ["/uploads/image1.jpg", "/uploads/image2.jpg"]
  }'
```

**As a reply:**
```bash
curl -X POST $BASE_URL/api/posts \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Great post! I totally agree.",
    "replyToId": "original-post-id"
  }'
```

**Expected Response (201):**
```json
{
  "id": "post-uuid",
  "userId": "your-user-id",
  "content": "Hello World! This is my first tweet. 🚀",
  "mediaUrls": [],
  "replyToId": null,
  "createdAt": "2026-01-10T12:50:00.000Z",
  "updatedAt": "2026-01-10T12:50:00.000Z",
  "user": {
    "id": "your-user-id",
    "email": "john@example.com",
    "profile": {
      "name": "John Doe",
      "handle": "johndoe"
    }
  }
}
```

**Error Cases:**
```bash
# Content too long (>280 characters)
curl -X POST $BASE_URL/api/posts \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"'$(printf 'a%.0s' {1..300})'"}'
# Response: {"error":"Validation error"}

# Missing content
curl -X POST $BASE_URL/api/posts \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
# Response: {"error":"Validation error"}
```

---

### 3.2 Get Posts (List)

**Endpoint:** `GET /api/posts`  
**Auth Required:** ❌ No  
**Security:** Public endpoint

```bash
# Get all posts
curl "$BASE_URL/api/posts?limit=20"

# Get posts by specific user
curl "$BASE_URL/api/posts?userId=$USER_ID&limit=10"

# Pagination
curl "$BASE_URL/api/posts?limit=20&cursor=last-post-id"
```

**Expected Response (200):**
```json
{
  "posts": [
    {
      "id": "post-uuid",
      "userId": "user-id",
      "content": "Post content",
      "mediaUrls": [],
      "replyToId": null,
      "createdAt": "2026-01-10T12:50:00.000Z",
      "updatedAt": "2026-01-10T12:50:00.000Z",
      "user": {
        "profile": {
          "name": "John Doe",
          "handle": "johndoe"
        }
      },
      "stats": {
        "likes": 5,
        "retweets": 2,
        "replies": 3
      }
    }
  ],
  "nextCursor": "next-post-id-or-null"
}
```

---

### 3.3 Get Single Post

**Endpoint:** `GET /api/posts/:postId`  
**Auth Required:** ❌ No  
**Security:** Public endpoint

```bash
curl $BASE_URL/api/posts/$POST_ID
```

**Expected Response (200):**
```json
{
  "id": "post-uuid",
  "userId": "user-id",
  "content": "Post content",
  "mediaUrls": [],
  "replyToId": null,
  "createdAt": "2026-01-10T12:50:00.000Z",
  "updatedAt": "2026-01-10T12:50:00.000Z",
  "user": {
    "profile": {
      "name": "John Doe",
      "handle": "johndoe"
    }
  },
  "stats": {
    "likes": 5,
    "retweets": 2,
    "replies": 3
  }
}
```

---

### 3.4 Delete Post

**Endpoint:** `DELETE /api/posts/:postId`  
**Auth Required:** ✅ Yes  
**Security:** Only post owner can delete

```bash
curl -X DELETE $BASE_URL/api/posts/$POST_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response (200):**
```json
{
  "message": "Post deleted successfully"
}
```

**Error Cases:**
```bash
# Unauthorized (trying to delete someone else's post)
curl -X DELETE $BASE_URL/api/posts/someone-elses-post-id \
  -H "Authorization: Bearer $ACCESS_TOKEN"
# Response: {"error":"Unauthorized"}
```

---

### 3.5 Like Post

**Endpoint:** `POST /api/posts/:postId/like`  
**Auth Required:** ✅ Yes  
**Security:** Prevents duplicate likes

```bash
curl -X POST $BASE_URL/api/posts/$POST_ID/like \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response (201):**
```json
{
  "id": "like-uuid",
  "postId": "post-id",
  "userId": "your-user-id",
  "createdAt": "2026-01-10T13:00:00.000Z"
}
```

**Error Cases:**
```bash
# Already liked
curl -X POST $BASE_URL/api/posts/$POST_ID/like \
  -H "Authorization: Bearer $ACCESS_TOKEN"
# Response: {"error":"Already liked this post"}
```

---

### 3.6 Unlike Post

**Endpoint:** `DELETE /api/posts/:postId/like`  
**Auth Required:** ✅ Yes  
**Security:** User can only unlike their own likes

```bash
curl -X DELETE $BASE_URL/api/posts/$POST_ID/like \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response (200):**
```json
{
  "message": "Unliked successfully"
}
```

---

### 3.7 Retweet Post

**Endpoint:** `POST /api/posts/:postId/retweet`  
**Auth Required:** ✅ Yes  
**Security:** Prevents duplicate retweets

```bash
curl -X POST $BASE_URL/api/posts/$POST_ID/retweet \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response (201):**
```json
{
  "id": "retweet-uuid",
  "postId": "post-id",
  "userId": "your-user-id",
  "createdAt": "2026-01-10T13:05:00.000Z"
}
```

---

### 3.8 Unretweet Post

**Endpoint:** `DELETE /api/posts/:postId/retweet`  
**Auth Required:** ✅ Yes  
**Security:** User can only unretweet their own retweets

```bash
curl -X DELETE $BASE_URL/api/posts/$POST_ID/retweet \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response (200):**
```json
{
  "message": "Unretweeted successfully"
}
```

---

### 3.9 Get Post Replies

**Endpoint:** `GET /api/posts/:postId/replies`  
**Auth Required:** ❌ No  
**Security:** Public endpoint

```bash
curl "$BASE_URL/api/posts/$POST_ID/replies?limit=20"
```

**Expected Response (200):**
```json
{
  "replies": [
    {
      "id": "reply-post-id",
      "userId": "replier-user-id",
      "content": "Reply content",
      "replyToId": "original-post-id",
      "user": {
        "profile": {
          "name": "Replier Name",
          "handle": "replierhandle"
        }
      },
      "stats": {
        "likes": 1,
        "retweets": 0,
        "replies": 0
      }
    }
  ],
  "nextCursor": null
}
```

---

## 4️⃣ TIMELINE ENDPOINT

### 4.1 Get Home Timeline

**Endpoint:** `GET /api/timeline/home`  
**Auth Required:** ✅ Yes  
**Security:** Only shows posts from followed users + own posts

```bash
curl "$BASE_URL/api/timeline/home?limit=20" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response (200):**
```json
{
  "posts": [
    {
      "id": "post-uuid",
      "userId": "user-id",
      "content": "Post from followed user",
      "user": {
        "profile": {
          "name": "Followed User",
          "handle": "followeduser"
        }
      },
      "stats": {
        "likes": 10,
        "retweets": 5,
        "replies": 3
      }
    }
  ],
  "nextCursor": null
}
```

**Query Parameters:**
- `limit` (optional): Number of results (default: 20)
- `cursor` (optional): Pagination cursor

---

## 5️⃣ NOTIFICATION ENDPOINTS

### 5.1 Get Notifications

**Endpoint:** `GET /api/notifications`  
**Auth Required:** ✅ Yes  
**Security:** Only shows user's own notifications

```bash
curl "$BASE_URL/api/notifications?limit=20" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response (200):**
```json
{
  "notifications": [
    {
      "id": "notification-uuid",
      "userId": "your-user-id",
      "type": "like",
      "actorId": "liker-user-id",
      "postId": "post-id",
      "read": false,
      "createdAt": "2026-01-10T13:10:00.000Z",
      "actor": {
        "id": "liker-user-id",
        "email": "liker@example.com",
        "profile": {
          "name": "Liker Name",
          "handle": "likerhandle",
          "avatar": null
        }
      },
      "post": {
        "id": "post-id",
        "content": "Your post content"
      }
    }
  ],
  "nextCursor": null
}
```

**Notification Types:**
- `like` - Someone liked your post
- `retweet` - Someone retweeted your post
- `follow` - Someone followed you
- `reply` - Someone replied to your post

---

### 5.2 Mark Notification as Read

**Endpoint:** `PUT /api/notifications/:notificationId/read`  
**Auth Required:** ✅ Yes  
**Security:** Only notification owner can mark as read

```bash
export NOTIFICATION_ID="notification-id-here"

curl -X PUT $BASE_URL/api/notifications/$NOTIFICATION_ID/read \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response (200):**
```json
{
  "id": "notification-uuid",
  "userId": "your-user-id",
  "type": "like",
  "actorId": "actor-user-id",
  "postId": "post-id",
  "read": true,
  "createdAt": "2026-01-10T13:10:00.000Z"
}
```

**Error Cases:**
```bash
# Unauthorized (trying to mark someone else's notification)
curl -X PUT $BASE_URL/api/notifications/someone-elses-notification \
  -H "Authorization: Bearer $ACCESS_TOKEN"
# Response: {"error":"Unauthorized"}
```

---

## 6️⃣ MEDIA ENDPOINT

### 6.1 Upload Media

**Endpoint:** `POST /api/media/upload`  
**Auth Required:** ✅ Yes  
**Security:** File type validation, authenticated uploads only

```bash
# Upload an image
curl -X POST $BASE_URL/api/media/upload \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -F "file=@/path/to/your/image.jpg"

# Upload a video
curl -X POST $BASE_URL/api/media/upload \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -F "file=@/path/to/your/video.mp4"
```

**Expected Response (201):**
```json
{
  "id": "media-uuid",
  "userId": "your-user-id",
  "filename": "uuid.jpg",
  "mimetype": "image/jpeg",
  "size": 123456,
  "url": "/uploads/uuid.jpg",
  "createdAt": "2026-01-10T13:15:00.000Z"
}
```

**Allowed File Types:**
- `image/jpeg`
- `image/png`
- `image/gif`
- `image/webp`
- `video/mp4`

**Error Cases:**
```bash
# Invalid file type
curl -X POST $BASE_URL/api/media/upload \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -F "file=@/path/to/document.pdf"
# Response: {"error":"Invalid file type"}

# No file provided
curl -X POST $BASE_URL/api/media/upload \
  -H "Authorization: Bearer $ACCESS_TOKEN"
# Response: {"error":"No file provided"}
```

**Usage Flow:**
1. Upload media → Get URL
2. Use URL in post creation:
```bash
curl -X POST $BASE_URL/api/posts \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Check out this photo!",
    "mediaUrls": ["/uploads/uuid.jpg"]
  }'
```

---

## 7️⃣ SEARCH ENDPOINTS

### 7.1 Search Posts

**Endpoint:** `GET /api/search/posts`  
**Auth Required:** ❌ No  
**Security:** Public endpoint, case-insensitive search

```bash
curl "$BASE_URL/api/search/posts?q=hello&limit=20"
```

**Expected Response (200):**
```json
{
  "posts": [
    {
      "id": "post-uuid",
      "userId": "user-id",
      "content": "Hello World! This is my first tweet.",
      "user": {
        "profile": {
          "name": "John Doe",
          "handle": "johndoe"
        }
      },
      "stats": {
        "likes": 5,
        "retweets": 2,
        "replies": 1
      }
    }
  ]
}
```

**Query Parameters:**
- `q` (required): Search query
- `limit` (optional): Number of results (default: 20)

---

### 7.2 Search Users

**Endpoint:** `GET /api/search/users`  
**Auth Required:** ❌ No  
**Security:** Public endpoint, case-insensitive search

```bash
curl "$BASE_URL/api/search/users?q=john&limit=20"
```

**Expected Response (200):**
```json
{
  "users": [
    {
      "id": "user-uuid",
      "email": "john@example.com",
      "profile": {
        "name": "John Doe",
        "handle": "johndoe",
        "bio": "Software Developer",
        "avatar": null
      },
      "stats": {
        "followers": 150,
        "following": 200,
        "posts": 50
      }
    }
  ]
}
```

**Query Parameters:**
- `q` (required): Search query (searches name and handle)
- `limit` (optional): Number of results (default: 20)

---

## 🧪 Complete Test Script

Save this as `test-api.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:3001"

echo "🧪 X-Clone API Test Suite"
echo "=========================="

# 1. Register
echo -e "\n1️⃣ Testing Registration..."
REGISTER_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "TestPass123",
    "name": "Test User",
    "handle": "testuser"
  }')

ACCESS_TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.accessToken')
USER_ID=$(echo $REGISTER_RESPONSE | jq -r '.user.id')

if [ "$ACCESS_TOKEN" != "null" ]; then
  echo "✅ Registration successful"
else
  echo "❌ Registration failed"
  exit 1
fi

# 2. Create Post
echo -e "\n2️⃣ Testing Create Post..."
POST_RESPONSE=$(curl -s -X POST $BASE_URL/api/posts \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"Test post from API test suite"}')

POST_ID=$(echo $POST_RESPONSE | jq -r '.id')

if [ "$POST_ID" != "null" ]; then
  echo "✅ Post created successfully"
else
  echo "❌ Post creation failed"
fi

# 3. Like Post
echo -e "\n3️⃣ Testing Like Post..."
LIKE_RESPONSE=$(curl -s -X POST $BASE_URL/api/posts/$POST_ID/like \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if echo $LIKE_RESPONSE | jq -e '.id' > /dev/null; then
  echo "✅ Post liked successfully"
else
  echo "❌ Like failed"
fi

# 4. Get Timeline
echo -e "\n4️⃣ Testing Timeline..."
TIMELINE_RESPONSE=$(curl -s "$BASE_URL/api/timeline/home?limit=5" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if echo $TIMELINE_RESPONSE | jq -e '.posts' > /dev/null; then
  echo "✅ Timeline retrieved successfully"
else
  echo "❌ Timeline failed"
fi

# 5. Get Notifications
echo -e "\n5️⃣ Testing Notifications..."
NOTIF_RESPONSE=$(curl -s "$BASE_URL/api/notifications" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if echo $NOTIF_RESPONSE | jq -e '.notifications' > /dev/null; then
  echo "✅ Notifications retrieved successfully"
else
  echo "❌ Notifications failed"
fi

echo -e "\n✅ All tests completed!"
```

Run with:
```bash
chmod +x test-api.sh
./test-api.sh
```

---

## 🔒 Security Checklist

✅ **Authentication & Authorization**
- [x] JWT tokens with secure signing
- [x] Access token expiration (15 minutes)
- [x] Refresh token expiration (7 days)
- [x] Password hashing with bcrypt
- [x] Token validation on protected routes
- [x] User ownership verification

✅ **Input Validation**
- [x] Zod schema validation
- [x] Email format validation
- [x] Password strength requirements
- [x] Content length limits
- [x] File type validation
- [x] Handle format validation

✅ **Data Protection**
- [x] Unique constraints (email, handle, likes, follows)
- [x] Cascading deletes
- [x] No password hashes in responses
- [x] SQL injection prevention (Prisma ORM)

✅ **API Security**
- [x] CORS configuration
- [x] Authorization headers required
- [x] Token type validation
- [x] Duplicate prevention (likes, retweets, follows)

---

## 📊 API Summary Table

| # | Endpoint | Method | Auth | Security Features |
|---|----------|--------|------|-------------------|
| 1 | `/api/auth/register` | POST | ❌ | Password hashing, email validation |
| 2 | `/api/auth/login` | POST | ❌ | Password verification |
| 3 | `/api/auth/me` | GET | ✅ | Token validation |
| 4 | `/api/auth/refresh` | POST | ❌ | Refresh token validation |
| 5 | `/api/auth/logout` | POST | ✅ | Token invalidation |
| 6 | `/api/users/:id` | GET | ❌ | Public data only |
| 7 | `/api/users/:id` | PUT | ✅ | Owner-only update |
| 8 | `/api/users/:id/follow` | POST | ✅ | Duplicate prevention |
| 9 | `/api/users/:id/follow` | DELETE | ✅ | Owner-only delete |
| 10 | `/api/users/:id/followers` | GET | ❌ | Public endpoint |
| 11 | `/api/users/:id/following` | GET | ❌ | Public endpoint |
| 12 | `/api/posts` | POST | ✅ | Content validation |
| 13 | `/api/posts` | GET | ❌ | Public endpoint |
| 14 | `/api/posts/:id` | GET | ❌ | Public endpoint |
| 15 | `/api/posts/:id` | DELETE | ✅ | Owner-only delete |
| 16 | `/api/posts/:id/like` | POST | ✅ | Duplicate prevention |
| 17 | `/api/posts/:id/like` | DELETE | ✅ | Owner-only unlike |
| 18 | `/api/posts/:id/retweet` | POST | ✅ | Duplicate prevention |
| 19 | `/api/posts/:id/retweet` | DELETE | ✅ | Owner-only unretweet |
| 20 | `/api/posts/:id/replies` | GET | ❌ | Public endpoint |
| 21 | `/api/timeline/home` | GET | ✅ | User-specific feed |
| 22 | `/api/notifications` | GET | ✅ | User-specific data |
| 23 | `/api/notifications/:id/read` | PUT | ✅ | Owner-only update |
| 24 | `/api/media/upload` | POST | ✅ | File type validation |
| 25 | `/api/search/posts` | GET | ❌ | Public search |
| 26 | `/api/search/users` | GET | ❌ | Public search |

---

**Total Endpoints:** 26  
**Protected Endpoints:** 14  
**Public Endpoints:** 12

**Backend Server:** `http://localhost:3001`  
**Documentation Version:** 1.0.0  
**Last Updated:** January 10, 2026
