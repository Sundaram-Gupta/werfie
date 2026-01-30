# Werfie Application Documentation

## Overview
Werfie is a microservices-based social media application designed for real-time communication, content sharing, and community building. This documentation outlines the key features, functionality, and accessible API endpoints for user-facing services.

---

## 🔐 Authentication Service
**Base URL:** `/api/auth`
Responsible for user registration, login, and session management using JWT (JSON Web Tokens).

### Endpoints
- **Register New User**
  - `POST /register`
  - **Body:** `{ email, password, name, handle }`
- **Login**
  - `POST /login`
  - **Body:** `{ email, password }`
- **Get Current User**
  - `GET /me`
  - **Headers:** `Authorization: Bearer <token>`
- **Logout**
  - `POST /logout`
- **Change Password**
  - `POST /change-password`
  - **Body:** `{ currentPassword, newPassword }`

---

## 👤 User Service
**Base URL:** `/api/users`
**Port:** 3002
Handles user profiles, social connections (followers/following), and business accounts.

### Endpoints
- **Get User Profile**
  - `GET /:id`
- **Follow User**
  - `POST /:id/follow`
  - **Headers:** `Authorization: Bearer <token>`
- **Unfollow User**
  - `DELETE /:id/follow`
  - **Headers:** `Authorization: Bearer <token>`
- **Get Followers**
  - `GET /:id/followers`
- **Get Following**
  - `GET /:id/following`
- **Get User Suggestions (Who to Follow)**
  - `GET /suggestions`
- **Search Users**
  - `GET /search?q=<query>`
- **Business Profile Management**
  - `POST /business` (Create/Update Business Profile)
  - `GET /business/stats`

---

## 📝 Content Service
**Base URL:** `/api`
**Port:** 3003
The core service for managing posts, media, interactions, timeline, and specialized features.

### Posts & Timeline
- **Create Post**
  - `POST /posts`
  - **Body:** `{ content, mediaUrls, replyToId? }`
- **Get Home Timeline**
  - `GET /timeline/home`
- **Get Single Post**
  - `GET /posts/:id`
- **Delete Post**
  - `DELETE /posts/:id`
- **Search Posts**
  - `GET /search/posts?q=<query>`

### Interactions
- **Like Post**
  - `POST /posts/:id/like`
- **Unlike Post**
  - `DELETE /posts/:id/like`
- **Repost (Retweet)**
  - `POST /posts/:id/retweet`
- **Undo Repost**
  - `DELETE /posts/:id/retweet`
- **Get Replies**
  - `GET /posts/:id/replies`

### 🎙️ Audio Spaces
**Base URL:** `/api/spaces`
- **List All Spaces**
  - `GET /`
- **Create Space**
  - `POST /`
  - **Body:** `{ title, topics[], status, scheduledAt }`

### 📋 Lists
**Base URL:** `/api/lists`
- **Get Lists**
  - `GET /`
- **Create List**
  - `POST /`

### 📢 Ads
**Base URL:** `/api/ads`
- **Get Ad Campaigns**
  - `GET /`
- **Create Campaign**
  - `POST /`

---

## 🔔 Notification Service
**Base URL:** `/api/notifications`
**Port:** 3005
Manages real-time notifications for user interactions.

### Endpoints
- **Get Notifications**
  - `GET /`
  - **Query Params:** `limit`, `offset`, `filter` (mentions, verified)
- **Mark As Read**
  - `PUT /:id/read`
- **Mark All As Read**
  - `PUT /read-all`

---

## 💬 Messaging Service
**Base URL:** `/api/messages`
**Port:** 3007
Handles direct messages and conversations.

### Endpoints
- **Get Conversations**
  - `GET /conversations`
- **Get Messages**
  - `GET /conversations/:id/messages`
- **Send Message**
  - `POST /send`
  - **Body:** `{ recipientId, content }`

---

## 📈 Analytics Service
**Base URL:** `/api`
**Port:** 3009
Provides data and insights for content creators.

### Endpoints
- **Get Creator Stats**
  - `GET /creator-studio/stats`
  - Returns: Followers growth, View counts, Engagement rates.

---

## 📂 Media Service
**Base URL:** `/api/media`
**Port:** 3008
Handles file uploads for posts and profiles.

### Endpoints
- **Upload File**
  - `POST /upload`
  - **Body:** `FormData` with file
