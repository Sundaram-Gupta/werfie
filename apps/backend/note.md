# X-Clone Backend API Documentation

## 🚀 Overview

Complete REST API for X-Clone (Twitter clone) built with Next.js, Prisma, and SQLite.

**Base URL**: `http://localhost:3001`  
**Authentication**: JWT Bearer tokens  
**Database**: SQLite with Prisma ORM

---

## 📋 Table of Contents

1. [Authentication](#authentication)
2. [User Profiles](#user-profiles)
3. [Posts](#posts)
4. [Timeline](#timeline)
5. [Notifications](#notifications)
6. [Media](#media)
7. [Search](#search)
8. [Database Schema](#database-schema)
9. [Error Handling](#error-handling)

---

## 🔐 Authentication

### Register

Create a new user account with profile.

**Endpoint**: `POST /api/auth/register`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "handle": "johndoe"
}
```

**Response** (201):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

**cURL Example**:
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe",
    "handle": "johndoe"
  }'
```

---

### Login

Authenticate and receive tokens.

**Endpoint**: `POST /api/auth/login`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response** (200):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

**cURL Example**:
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

---

### Get Current User

Get authenticated user information.

**Endpoint**: `GET /api/auth/me`  
**Auth Required**: Yes

**Response** (200):
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "createdAt": "2024-01-10T12:00:00.000Z"
}
```

**cURL Example**:
```bash
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### Refresh Token

Get a new access token using refresh token.

**Endpoint**: `POST /api/auth/refresh`

**Request Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response** (200):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### Logout

Invalidate refresh token.

**Endpoint**: `POST /api/auth/logout`  
**Auth Required**: Yes (refresh token in Authorization header)

**Response** (200):
```json
{
  "message": "Logged out successfully"
}
```

---

## 👤 User Profiles

### Get User Profile

Get user profile by ID.

**Endpoint**: `GET /api/users/:userId`

**Response** (200):
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "profile": {
    "id": "uuid",
    "userId": "uuid",
    "name": "John Doe",
    "handle": "johndoe",
    "bio": "Software developer",
    "avatar": "/uploads/avatar.jpg",
    "banner": "/uploads/banner.jpg",
    "location": "San Francisco",
    "website": "https://example.com",
    "birthdate": "1990-01-01T00:00:00.000Z",
    "createdAt": "2024-01-10T12:00:00.000Z",
    "updatedAt": "2024-01-10T12:00:00.000Z"
  },
  "stats": {
    "followers": 150,
    "following": 200,
    "posts": 50
  },
  "createdAt": "2024-01-10T12:00:00.000Z"
}
```

**cURL Example**:
```bash
curl http://localhost:3001/api/users/USER_ID
```

---

### Update User Profile

Update authenticated user's profile.

**Endpoint**: `PUT /api/users/:userId`  
**Auth Required**: Yes (must be own profile)

**Request Body**:
```json
{
  "name": "John Updated",
  "bio": "New bio",
  "avatar": "/uploads/new-avatar.jpg",
  "banner": "/uploads/new-banner.jpg",
  "location": "New York",
  "website": "https://newsite.com",
  "birthdate": "1990-01-01"
}
```

**Response** (200):
```json
{
  "id": "uuid",
  "userId": "uuid",
  "name": "John Updated",
  "handle": "johndoe",
  "bio": "New bio",
  ...
}
```

**cURL Example**:
```bash
curl -X PUT http://localhost:3001/api/users/USER_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Updated",
    "bio": "New bio"
  }'
```

---

### Follow User

Follow another user.

**Endpoint**: `POST /api/users/:userId/follow`  
**Auth Required**: Yes

**Response** (201):
```json
{
  "id": "uuid",
  "followerId": "your-user-id",
  "followingId": "target-user-id",
  "createdAt": "2024-01-10T12:00:00.000Z"
}
```

**cURL Example**:
```bash
curl -X POST http://localhost:3001/api/users/USER_ID/follow \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### Unfollow User

Unfollow a user.

**Endpoint**: `DELETE /api/users/:userId/follow`  
**Auth Required**: Yes

**Response** (200):
```json
{
  "message": "Unfollowed successfully"
}
```

---

### Get Followers

Get list of user's followers.

**Endpoint**: `GET /api/users/:userId/followers?limit=20&cursor=CURSOR_ID`

**Query Parameters**:
- `limit` (optional): Number of results (default: 20)
- `cursor` (optional): Pagination cursor

**Response** (200):
```json
{
  "followers": [
    {
      "id": "uuid",
      "email": "follower@example.com",
      "profile": {
        "name": "Follower Name",
        "handle": "followerhandle",
        ...
      },
      "followedAt": "2024-01-10T12:00:00.000Z"
    }
  ],
  "nextCursor": "uuid-or-null"
}
```

---

### Get Following

Get list of users that a user follows.

**Endpoint**: `GET /api/users/:userId/following?limit=20&cursor=CURSOR_ID`

**Query Parameters**:
- `limit` (optional): Number of results (default: 20)
- `cursor` (optional): Pagination cursor

**Response**: Same structure as followers

---

## 📝 Posts

### Create Post

Create a new post (tweet).

**Endpoint**: `POST /api/posts`  
**Auth Required**: Yes

**Request Body**:
```json
{
  "content": "Hello World! This is my first tweet.",
  "mediaUrls": ["/uploads/image1.jpg", "/uploads/image2.jpg"],
  "replyToId": "uuid-of-post-to-reply-to"
}
```

**Validation**:
- `content`: 1-280 characters (required)
- `mediaUrls`: Array of strings (optional)
- `replyToId`: UUID string (optional)

**Response** (201):
```json
{
  "id": "uuid",
  "userId": "uuid",
  "content": "Hello World! This is my first tweet.",
  "mediaUrls": ["/uploads/image1.jpg", "/uploads/image2.jpg"],
  "replyToId": null,
  "createdAt": "2024-01-10T12:00:00.000Z",
  "updatedAt": "2024-01-10T12:00:00.000Z",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "profile": {
      "name": "John Doe",
      "handle": "johndoe",
      ...
    }
  }
}
```

**cURL Example**:
```bash
curl -X POST http://localhost:3001/api/posts \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Hello World! This is my first tweet."
  }'
```

---

### Get Posts

Get list of posts with pagination.

**Endpoint**: `GET /api/posts?limit=20&cursor=CURSOR_ID&userId=USER_ID`

**Query Parameters**:
- `limit` (optional): Number of results (default: 20)
- `cursor` (optional): Pagination cursor
- `userId` (optional): Filter by user ID

**Response** (200):
```json
{
  "posts": [
    {
      "id": "uuid",
      "userId": "uuid",
      "content": "Post content",
      "mediaUrls": [],
      "replyToId": null,
      "createdAt": "2024-01-10T12:00:00.000Z",
      "updatedAt": "2024-01-10T12:00:00.000Z",
      "user": {
        "id": "uuid",
        "email": "user@example.com",
        "profile": { ... }
      },
      "stats": {
        "likes": 10,
        "retweets": 5,
        "replies": 3
      }
    }
  ],
  "nextCursor": "uuid-or-null"
}
```

**cURL Example**:
```bash
# Get all posts
curl http://localhost:3001/api/posts?limit=20

# Get posts by specific user
curl http://localhost:3001/api/posts?userId=USER_ID
```

---

### Get Single Post

Get a specific post by ID.

**Endpoint**: `GET /api/posts/:postId`

**Response** (200):
```json
{
  "id": "uuid",
  "userId": "uuid",
  "content": "Post content",
  "mediaUrls": [],
  "replyToId": null,
  "createdAt": "2024-01-10T12:00:00.000Z",
  "updatedAt": "2024-01-10T12:00:00.000Z",
  "user": { ... },
  "stats": {
    "likes": 10,
    "retweets": 5,
    "replies": 3
  }
}
```

---

### Delete Post

Delete a post (must be owner).

**Endpoint**: `DELETE /api/posts/:postId`  
**Auth Required**: Yes (must be post owner)

**Response** (200):
```json
{
  "message": "Post deleted successfully"
}
```

**cURL Example**:
```bash
curl -X DELETE http://localhost:3001/api/posts/POST_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### Like Post

Like a post.

**Endpoint**: `POST /api/posts/:postId/like`  
**Auth Required**: Yes

**Response** (201):
```json
{
  "id": "uuid",
  "postId": "uuid",
  "userId": "uuid",
  "createdAt": "2024-01-10T12:00:00.000Z"
}
```

**cURL Example**:
```bash
curl -X POST http://localhost:3001/api/posts/POST_ID/like \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### Unlike Post

Remove like from a post.

**Endpoint**: `DELETE /api/posts/:postId/like`  
**Auth Required**: Yes

**Response** (200):
```json
{
  "message": "Unliked successfully"
}
```

---

### Retweet Post

Retweet a post.

**Endpoint**: `POST /api/posts/:postId/retweet`  
**Auth Required**: Yes

**Response** (201):
```json
{
  "id": "uuid",
  "postId": "uuid",
  "userId": "uuid",
  "createdAt": "2024-01-10T12:00:00.000Z"
}
```

---

### Unretweet Post

Remove retweet.

**Endpoint**: `DELETE /api/posts/:postId/retweet`  
**Auth Required**: Yes

**Response** (200):
```json
{
  "message": "Unretweeted successfully"
}
```

---

### Get Post Replies

Get all replies to a post.

**Endpoint**: `GET /api/posts/:postId/replies?limit=20&cursor=CURSOR_ID`

**Query Parameters**:
- `limit` (optional): Number of results (default: 20)
- `cursor` (optional): Pagination cursor

**Response** (200):
```json
{
  "replies": [
    {
      "id": "uuid",
      "userId": "uuid",
      "content": "Reply content",
      "replyToId": "parent-post-id",
      "user": { ... },
      "stats": { ... }
    }
  ],
  "nextCursor": "uuid-or-null"
}
```

---

## 📰 Timeline

### Get Home Timeline

Get personalized feed (posts from followed users).

**Endpoint**: `GET /api/timeline/home?limit=20&cursor=CURSOR_ID`  
**Auth Required**: Yes

**Query Parameters**:
- `limit` (optional): Number of results (default: 20)
- `cursor` (optional): Pagination cursor

**Response** (200):
```json
{
  "posts": [
    {
      "id": "uuid",
      "userId": "uuid",
      "content": "Post content",
      "user": { ... },
      "stats": { ... }
    }
  ],
  "nextCursor": "uuid-or-null"
}
```

**cURL Example**:
```bash
curl http://localhost:3001/api/timeline/home?limit=20 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 🔔 Notifications

### Get Notifications

Get user notifications.

**Endpoint**: `GET /api/notifications?limit=20&cursor=CURSOR_ID`  
**Auth Required**: Yes

**Query Parameters**:
- `limit` (optional): Number of results (default: 20)
- `cursor` (optional): Pagination cursor

**Response** (200):
```json
{
  "notifications": [
    {
      "id": "uuid",
      "userId": "recipient-id",
      "type": "like",
      "actorId": "user-who-liked-id",
      "postId": "post-id",
      "read": false,
      "createdAt": "2024-01-10T12:00:00.000Z",
      "actor": {
        "id": "uuid",
        "email": "actor@example.com",
        "profile": {
          "name": "Actor Name",
          "handle": "actorhandle",
          ...
        }
      },
      "post": {
        "id": "uuid",
        "content": "Post content",
        ...
      }
    }
  ],
  "nextCursor": "uuid-or-null"
}
```

**Notification Types**:
- `like` - Someone liked your post
- `retweet` - Someone retweeted your post
- `follow` - Someone followed you
- `reply` - Someone replied to your post
- `mention` - Someone mentioned you (not implemented yet)

**cURL Example**:
```bash
curl http://localhost:3001/api/notifications \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### Mark Notification as Read

Mark a notification as read.

**Endpoint**: `PUT /api/notifications/:notificationId/read`  
**Auth Required**: Yes (must be notification owner)

**Response** (200):
```json
{
  "id": "uuid",
  "userId": "uuid",
  "type": "like",
  "actorId": "uuid",
  "postId": "uuid",
  "read": true,
  "createdAt": "2024-01-10T12:00:00.000Z"
}
```

**cURL Example**:
```bash
curl -X PUT http://localhost:3001/api/notifications/NOTIFICATION_ID/read \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 📷 Media

### Upload Media

Upload image or video file.

**Endpoint**: `POST /api/media/upload`  
**Auth Required**: Yes  
**Content-Type**: `multipart/form-data`

**Request Body**:
- `file`: File upload (image/jpeg, image/png, image/gif, image/webp, video/mp4)

**Response** (201):
```json
{
  "id": "uuid",
  "userId": "uuid",
  "filename": "uuid.jpg",
  "mimetype": "image/jpeg",
  "size": 123456,
  "url": "/uploads/uuid.jpg",
  "createdAt": "2024-01-10T12:00:00.000Z"
}
```

**cURL Example**:
```bash
curl -X POST http://localhost:3001/api/media/upload \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "file=@/path/to/image.jpg"
```

**Usage Flow**:
1. Upload media file → Get media URL
2. Use media URL in post creation (`mediaUrls` field)

---

## 🔍 Search

### Search Posts

Search posts by content.

**Endpoint**: `GET /api/search/posts?q=QUERY&limit=20`

**Query Parameters**:
- `q` (required): Search query
- `limit` (optional): Number of results (default: 20)

**Response** (200):
```json
{
  "posts": [
    {
      "id": "uuid",
      "userId": "uuid",
      "content": "Post containing search query",
      "user": { ... },
      "stats": { ... }
    }
  ]
}
```

**cURL Example**:
```bash
curl "http://localhost:3001/api/search/posts?q=hello&limit=20"
```

---

### Search Users

Search users by name or handle.

**Endpoint**: `GET /api/search/users?q=QUERY&limit=20`

**Query Parameters**:
- `q` (required): Search query
- `limit` (optional): Number of results (default: 20)

**Response** (200):
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "profile": {
        "name": "John Doe",
        "handle": "johndoe",
        ...
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

**cURL Example**:
```bash
curl "http://localhost:3001/api/search/users?q=john&limit=20"
```

---

## 🗄️ Database Schema

### User
```prisma
model User {
  id            String   @id @default(uuid())
  email         String   @unique
  passwordHash  String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  refreshTokens RefreshToken[]
  profile       Profile?
  posts         Post[]
  likes         Like[]
  retweets      Retweet[]
  followers     Follow[]     @relation("UserFollowers")
  following     Follow[]     @relation("UserFollowing")
  notifications Notification[] @relation("NotificationRecipient")
}
```

### Profile
```prisma
model Profile {
  id          String   @id @default(uuid())
  userId      String   @unique
  name        String
  handle      String   @unique
  bio         String?
  avatar      String?
  banner      String?
  location    String?
  website     String?
  birthdate   DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  user User @relation(fields: [userId], references: [id])
}
```

### Post
```prisma
model Post {
  id          String   @id @default(uuid())
  userId      String
  content     String
  mediaUrls   String?  // JSON array
  replyToId   String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  user        User     @relation(fields: [userId], references: [id])
  replyTo     Post?    @relation("PostReplies", fields: [replyToId], references: [id])
  replies     Post[]   @relation("PostReplies")
  likes       Like[]
  retweets    Retweet[]
}
```

### Like
```prisma
model Like {
  id        String   @id @default(uuid())
  postId    String
  userId    String
  createdAt DateTime @default(now())
  
  @@unique([postId, userId])
}
```

### Retweet
```prisma
model Retweet {
  id        String   @id @default(uuid())
  postId    String
  userId    String
  createdAt DateTime @default(now())
  
  @@unique([postId, userId])
}
```

### Follow
```prisma
model Follow {
  id          String   @id @default(uuid())
  followerId  String
  followingId String
  createdAt   DateTime @default(now())
  
  @@unique([followerId, followingId])
}
```

### Notification
```prisma
model Notification {
  id        String   @id @default(uuid())
  userId    String
  type      String   // 'like', 'retweet', 'follow', 'reply'
  actorId   String
  postId    String?
  read      Boolean  @default(false)
  createdAt DateTime @default(now())
}
```

### Media
```prisma
model Media {
  id        String   @id @default(uuid())
  userId    String
  filename  String
  mimetype  String
  size      Int
  url       String
  createdAt DateTime @default(now())
}
```

---

## ⚠️ Error Handling

### Standard Error Response

All errors follow this format:

```json
{
  "error": "Error message description"
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

### Validation Errors

Validation errors include details:

```json
{
  "error": "Validation error",
  "details": [
    {
      "code": "too_small",
      "minimum": 8,
      "type": "string",
      "path": ["password"],
      "message": "String must contain at least 8 character(s)"
    }
  ]
}
```

---

## 🔑 Authentication Flow

### Registration & Login Flow

```
1. User registers → POST /api/auth/register
   ↓
2. Receive accessToken + refreshToken
   ↓
3. Store tokens securely (localStorage/cookies)
   ↓
4. Use accessToken in Authorization header for API calls
   ↓
5. When accessToken expires → POST /api/auth/refresh
   ↓
6. Receive new accessToken
   ↓
7. Continue using new accessToken
```

### Token Expiry

- **Access Token**: 15 minutes (default)
- **Refresh Token**: 7 days (default)

### Using Tokens

Include access token in Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🚀 Getting Started

### 1. Install Dependencies

```bash
cd /Users/ashish/Aspire/X/X-Backend/auth-service-js
npm install
```

### 2. Setup Environment Variables

Create `.env` file:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-super-secret-jwt-key-change-in-production-min-32-characters"
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"
```

### 3. Run Database Migration

```bash
npx prisma migrate dev
npx prisma generate
```

### 4. Start Development Server

```bash
npm run dev
```

Server runs on `http://localhost:3001`

---

## 📊 API Summary

| Category | Endpoint | Method | Auth | Description |
|----------|----------|--------|------|-------------|
| **Auth** | `/api/auth/register` | POST | No | Register new user |
| | `/api/auth/login` | POST | No | Login user |
| | `/api/auth/me` | GET | Yes | Get current user |
| | `/api/auth/refresh` | POST | No | Refresh access token |
| | `/api/auth/logout` | POST | Yes | Logout user |
| **Users** | `/api/users/:userId` | GET | No | Get user profile |
| | `/api/users/:userId` | PUT | Yes | Update profile |
| | `/api/users/:userId/follow` | POST | Yes | Follow user |
| | `/api/users/:userId/follow` | DELETE | Yes | Unfollow user |
| | `/api/users/:userId/followers` | GET | No | Get followers |
| | `/api/users/:userId/following` | GET | No | Get following |
| **Posts** | `/api/posts` | POST | Yes | Create post |
| | `/api/posts` | GET | No | Get posts |
| | `/api/posts/:postId` | GET | No | Get single post |
| | `/api/posts/:postId` | DELETE | Yes | Delete post |
| | `/api/posts/:postId/like` | POST | Yes | Like post |
| | `/api/posts/:postId/like` | DELETE | Yes | Unlike post |
| | `/api/posts/:postId/retweet` | POST | Yes | Retweet post |
| | `/api/posts/:postId/retweet` | DELETE | Yes | Unretweet post |
| | `/api/posts/:postId/replies` | GET | No | Get post replies |
| **Timeline** | `/api/timeline/home` | GET | Yes | Get home timeline |
| **Notifications** | `/api/notifications` | GET | Yes | Get notifications |
| | `/api/notifications/:id/read` | PUT | Yes | Mark as read |
| **Media** | `/api/media/upload` | POST | Yes | Upload media |
| **Search** | `/api/search/posts` | GET | No | Search posts |
| | `/api/search/users` | GET | No | Search users |

---

## 🎯 Next Steps

### Optional Enhancements

1. **Password Reset**: Add forgot password / reset password endpoints
2. **Email Verification**: Add email verification flow
3. **User Timeline**: Add `/api/timeline/user/:userId` endpoint
4. **Mentions Timeline**: Add `/api/timeline/mentions` endpoint
5. **Trending Topics**: Add `/api/search/trending` endpoint
6. **Notification Preferences**: Add user notification settings
7. **Rate Limiting**: Implement rate limiting for API endpoints
8. **Caching**: Add Redis caching for timeline and trending
9. **WebSockets**: Add real-time notifications
10. **Production Database**: Migrate from SQLite to PostgreSQL

---

## 📝 Notes

- All timestamps are in ISO 8601 format
- Pagination uses cursor-based pagination for better performance
- Media files are stored in `/public/uploads` directory
- SQLite is used for development; use PostgreSQL for production
- All endpoints support CORS for frontend integration
- JWT tokens are signed with HS256 algorithm

---

**Version**: 1.0.0  
**Last Updated**: January 10, 2026  
**Author**: X-Clone Backend Team
