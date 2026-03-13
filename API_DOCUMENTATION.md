# X-Clone API Documentation

## Base URL
```
http://localhost:3001/api
```

## Authentication
Most endpoints require a JWT Bearer token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 📋 Table of Contents
- [Authentication Endpoints](#authentication-endpoints)
- [User Endpoints](#user-endpoints)
- [Post Endpoints](#post-endpoints)
- [Media Endpoints](#media-endpoints)
- [Timeline Endpoints](#timeline-endpoints)

---

## Authentication Endpoints

### Register User
**POST** `/auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "handle": "johndoe"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

**cURL Test:**
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "password123",
    "name": "Test User",
    "handle": "testuser"
  }'
```

---

### Login
**POST** `/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

**cURL Test:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "password123"
  }'
```

---

### Get Current User
**GET** `/auth/me`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "profile": {
    "name": "John Doe",
    "handle": "johndoe",
    "bio": "Software Developer",
    "avatar": "/api/media/uploads/avatar.jpg",
    "banner": "/api/media/uploads/banner.jpg"
  }
}
```

**cURL Test:**
```bash
# First, save your token from login/register
TOKEN="your_access_token_here"

curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

---

## User Endpoints

### Get User Profile
**GET** `/users/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "profile": {
    "name": "John Doe",
    "handle": "johndoe",
    "bio": "Software Developer",
    "avatar": "/api/media/uploads/avatar.jpg",
    "banner": "/api/media/uploads/banner.jpg",
    "location": "San Francisco",
    "website": "example.com"
  },
  "stats": {
    "posts": 42,
    "followers": 150,
    "following": 200
  }
}
```

**cURL Test:**
```bash
USER_ID="user_uuid_here"
TOKEN="your_access_token_here"

curl -X GET "http://localhost:3001/api/users/$USER_ID/" \
  -H "Authorization: Bearer $TOKEN"
```

---

### Update User Profile
**PUT** `/users/:id`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "John Doe Updated",
  "bio": "Full Stack Developer",
  "location": "New York",
  "website": "johndoe.com",
  "avatar": "/api/media/uploads/new-avatar.jpg",
  "banner": "/api/media/uploads/new-banner.jpg"
}
```

**Response:**
```json
{
  "id": "profile_uuid",
  "userId": "user_uuid",
  "name": "John Doe Updated",
  "handle": "johndoe",
  "bio": "Full Stack Developer",
  "avatar": "/api/media/uploads/new-avatar.jpg",
  "banner": "/api/media/uploads/new-banner.jpg",
  "location": "New York",
  "website": "johndoe.com",
  "createdAt": "2026-01-14T07:32:48.433Z",
  "updatedAt": "2026-01-14T07:50:00.000Z"
}
```

**cURL Test:**
```bash
USER_ID="your_user_id_here"
TOKEN="your_access_token_here"

curl -X PUT "http://localhost:3001/api/users/$USER_ID/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Name",
    "bio": "This is my new bio",
    "location": "San Francisco, CA",
    "website": "mywebsite.com"
  }'
```

---

## Post Endpoints

### Create Post
**POST** `/posts/`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "content": "Hello, world! 🌍",
  "mediaUrls": [
    "/api/media/uploads/image1.jpg",
    "/api/media/uploads/image2.jpg"
  ],
  "replyToId": null
}
```

**Response:**
```json
{
  "id": "post_uuid",
  "userId": "user_uuid",
  "content": "Hello, world! 🌍",
  "mediaUrls": "[...]",
  "replyToId": null,
  "createdAt": "2026-01-14T08:00:00.000Z",
  "user": {
    "id": "user_uuid"
  }
}
```

**cURL Test:**
```bash
TOKEN="your_access_token_here"

curl -X POST http://localhost:3001/api/posts/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "My first post via API! 🚀",
    "mediaUrls": []
  }'
```

---

### Get All Posts (Feed)
**GET** `/posts/`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `userId` (optional): Filter posts by user ID

**Response:**
```json
{
  "posts": [
    {
      "id": "post_uuid",
      "userId": "user_uuid",
      "content": "Post content",
      "mediaUrls": "[...]",
      "createdAt": "2026-01-14T08:00:00.000Z",
      "user": {
        "id": "user_uuid",
        "email": "user@example.com",
        "profile": { ... }
      },
      "_count": {
        "replies": 5,
        "likes": 10,
        "retweets": 3
      }
    }
  ]
}
```

**cURL Test:**
```bash
TOKEN="your_access_token_here"

# Get all posts
curl -X GET http://localhost:3001/api/posts/ \
  -H "Authorization: Bearer $TOKEN"

# Get posts by specific user
curl -X GET "http://localhost:3001/api/posts/?userId=user_uuid_here" \
  -H "Authorization: Bearer $TOKEN"
```

---

### Get Single Post
**GET** `/posts/:id`

**Response:**
```json
{
  "id": "post_uuid",
  "userId": "user_uuid",
  "content": "Post content",
  "mediaUrls": "[...]",
  "createdAt": "2026-01-14T08:00:00.000Z",
  "user": { ... },
  "_count": {
    "replies": 5,
    "likes": 10,
    "retweets": 3
  }
}
```

**cURL Test:**
```bash
POST_ID="post_uuid_here"

curl -X GET "http://localhost:3001/api/posts/$POST_ID" \
  -H "Authorization: Bearer $TOKEN"
```

---

### Like Post
**POST** `/posts/:id/like`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "like_uuid",
  "userId": "user_uuid",
  "postId": "post_uuid",
  "createdAt": "2026-01-14T08:00:00.000Z"
}
```

**cURL Test:**
```bash
POST_ID="post_uuid_here"
TOKEN="your_access_token_here"

curl -X POST "http://localhost:3001/api/posts/$POST_ID/like" \
  -H "Authorization: Bearer $TOKEN"
```

---

### Unlike Post
**DELETE** `/posts/:id/like`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true
}
```

**cURL Test:**
```bash
POST_ID="post_uuid_here"
TOKEN="your_access_token_here"

curl -X DELETE "http://localhost:3001/api/posts/$POST_ID/like" \
  -H "Authorization: Bearer $TOKEN"
```

---

### Retweet Post
**POST** `/posts/:id/retweet`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "retweet_uuid",
  "userId": "user_uuid",
  "postId": "post_uuid",
  "createdAt": "2026-01-14T08:00:00.000Z"
}
```

**cURL Test:**
```bash
POST_ID="post_uuid_here"
TOKEN="your_access_token_here"

curl -X POST "http://localhost:3001/api/posts/$POST_ID/retweet" \
  -H "Authorization: Bearer $TOKEN"
```

---

### Unretweet Post
**DELETE** `/posts/:id/retweet`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true
}
```

**cURL Test:**
```bash
POST_ID="post_uuid_here"
TOKEN="your_access_token_here"

curl -X DELETE "http://localhost:3001/api/posts/$POST_ID/retweet" \
  -H "Authorization: Bearer $TOKEN"
```

---

### Get Post Replies
**GET** `/posts/:id/replies`

**Response:**
```json
[
  {
    "id": "reply_uuid",
    "userId": "user_uuid",
    "content": "Reply content",
    "replyToId": "original_post_uuid",
    "createdAt": "2026-01-14T08:00:00.000Z",
    "user": { ... },
    "_count": {
      "replies": 2,
      "likes": 5,
      "retweets": 1
    }
  }
]
```

**cURL Test:**
```bash
POST_ID="post_uuid_here"

curl -X GET "http://localhost:3001/api/posts/$POST_ID/replies"
```

---

## Media Endpoints

### Upload Media
**POST** `/media/upload`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body:**
```
Form Data:
- file: <binary file>
```

**Response:**
```json
{
  "url": "/api/media/uploads/1768376722983.jpg"
}
```

**cURL Test:**
```bash
TOKEN="your_access_token_here"

# Upload an image
curl -X POST http://localhost:3001/api/media/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/your/image.jpg"

# Upload from current directory
curl -X POST http://localhost:3001/api/media/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@./profile-pic.png"
```

---

### Access Uploaded Media
**GET** `/media/uploads/:filename`

**Response:**
```
Binary image data (JPEG, PNG, etc.)
```

**cURL Test:**
```bash
# Download an uploaded image
curl -X GET http://localhost:3001/api/media/uploads/1768376722983.jpg \
  --output downloaded-image.jpg

# View image headers
curl -I http://localhost:3001/api/media/uploads/1768376722983.jpg
```

---

## Timeline Endpoints

### Get Home Timeline
**GET** `/timeline/home`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": "post_uuid",
    "userId": "user_uuid",
    "content": "Post content",
    "mediaUrls": "[...]",
    "createdAt": "2026-01-14T08:00:00.000Z",
    "user": { ... },
    "_count": {
      "replies": 5,
      "likes": 10,
      "retweets": 3
    }
  }
]
```

**cURL Test:**
```bash
TOKEN="your_access_token_here"

curl -X GET http://localhost:3001/api/timeline/home \
  -H "Authorization: Bearer $TOKEN"
```

---

## Complete Test Flow

Here's a complete workflow to test the API:

```bash
#!/bin/bash

# 1. Register a new user
echo "=== Registering User ==="
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "apitest@example.com",
    "password": "test123",
    "name": "API Test User",
    "handle": "apitest"
  }')

echo $REGISTER_RESPONSE | jq '.'

# Extract token and user ID
TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.accessToken')
USER_ID=$(echo $REGISTER_RESPONSE | jq -r '.user.id')

echo "Token: $TOKEN"
echo "User ID: $USER_ID"

# 2. Get current user
echo -e "\n=== Getting Current User ==="
curl -s -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# 3. Update profile
echo -e "\n=== Updating Profile ==="
curl -s -X PUT "http://localhost:3001/api/users/$USER_ID/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "API Test User Updated",
    "bio": "Testing the X-Clone API",
    "location": "API Land"
  }' | jq '.'

# 4. Create a post
echo -e "\n=== Creating Post ==="
POST_RESPONSE=$(curl -s -X POST http://localhost:3001/api/posts/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Hello from the API! 🚀"
  }')

echo $POST_RESPONSE | jq '.'
POST_ID=$(echo $POST_RESPONSE | jq -r '.id')

# 5. Like the post
echo -e "\n=== Liking Post ==="
curl -s -X POST "http://localhost:3001/api/posts/$POST_ID/like" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# 6. Get timeline
echo -e "\n=== Getting Timeline ==="
curl -s -X GET http://localhost:3001/api/timeline/home \
  -H "Authorization: Bearer $TOKEN" | jq '.'

echo -e "\n=== Test Complete ==="
```

Save this as `test_api.sh`, make it executable (`chmod +x test_api.sh`), and run it!

---

## Error Responses

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden"
}
```

### 404 Not Found
```json
{
  "error": "Post not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to create post"
}
```

---

## Rate Limits
Currently no rate limiting is implemented. Consider adding rate limiting for production use.

## Notes
- All timestamps are in ISO 8601 format
- Media files are limited to 5MB per upload
- JWT tokens expire after 15 minutes (access token)
- Refresh tokens expire after 7 days
