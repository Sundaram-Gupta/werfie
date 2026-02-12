# Werfie API Catalog

This document lists all available API endpoints for the Werfie platform, divided into the **Admin Application** and the **Client Application**.

## 1. Admin Application APIs
These APIs are powered by the **Admin Backend** (Next.js App Router).

**Base URL**: `/api/admin`

### **Dashboard**
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/dashboard/stats` | Fetches key dashboard statistics (Users, Posts, Reports, etc.). |
| `GET` | `/dashboard/recent-activity` | Fetches a log of recent system activities. |
| `GET` | `/dashboard/getting-started-status` | Checks the status of initial system setup steps. |

### **User Management**
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/users` | Lists all users with pagination and filtering. |
| `GET` | `/users/[id]` | Get detailed profile and metadata for a specific user. |
| `PATCH` | `/users/[id]/status` | Update a user's status (e.g., Active, Suspended). |
| `PATCH` | `/users/[id]/role` | Update a user's role (e.g., User, Admin, Moderator). |

### **Configuration & System**
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/config/api-keys` | List all registered API keys. |
| `POST` | `/config/api-keys` | Generate a new API key. |
| `GET` | `/config/push` | Get current push notification configuration. |
| `PUT` | `/config/push` | Update push notification provider settings. |
| `GET` | `/config/push/templates` | List push notification message templates. |
| `GET` | `/health` | System health check and uptime status. |

### **Content & Moderation**
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/reports` | List all content reports/flags. |
| `GET` | `/reports/[id]` | Get details of a specific moderation report. |
| `GET` | `/posts` | List posts for administrative review or moderation. |

### **Communications**
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/notifications/broadcast` | Send a system-wide broadcast notification to users. |

### **Authentication**
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/login` | Admin login endpoint (Returns JWT). |

---

## 2. Client Application APIs
These APIs are accessed via the **API Gateway (NGINX)** which routes requests to the appropriate microservice.

**Base URL**: `/api`

### **User Service**
**Base Path**: `/api/users`

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/profile` | Get the currently authenticated user's profile. |
| `GET` | `/[id]` | Get the public profile of a specific user. |
| `PUT` | `/[id]` | Update the authenticated user's profile. |
| `GET` | `/[id]/followers` | Get a list of followers for a user. |
| `GET` | `/[id]/following` | Get a list of users a specific user is following. |
| `POST` | `/[id]/follow` | Follow a user. |
| `DELETE` | `/[id]/follow` | Unfollow a user. |
| `GET` | `/search?q={query}` | Search for users by name or handle. |
| `GET` | `/suggestions` | Get "Who to follow" user suggestions. |
| `GET` | `/?ids={id,id}` | Bulk fetch user details by IDs. |

### **Content Service (Posts & Timeline)**
**Base Path**: `/api/posts` (and others as noted)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **Posts** | | |
| `POST` | `/posts` | Create a new post. |
| `GET` | `/posts` | Get all posts (supports feed filtering). |
| `GET` | `/posts/[id]` | Get a single post by ID. |
| `DELETE` | `/posts/[id]` | Delete a post. |
| **Interactions** | | |
| `POST` | `/posts/[id]/like` | Like a post. |
| `DELETE` | `/posts/[id]/like` | Unlike a post. |
| `POST` | `/posts/[id]/retweet` | Retweet a post. |
| `DELETE` | `/posts/[id]/retweet` | Remove a retweet. |
| `POST` | `/posts/[id]/bookmark` | Bookmark a post. |
| `DELETE` | `/posts/[id]/bookmark` | Remove a bookmark. |
| `GET` | `/posts/[id]/replies` | Get a list of replies to a post. |
| **Media** | | |
| `POST` | `/media/upload` | Upload media files (Returns URL). |
| **Timeline** | | |
| `GET` | `/timeline/home` | Get the home timeline for the authenticated user. |

### **Discovery & Trends**
**Base Path**: `/api` (Various)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/trends` | Get current trending topics. |
| `GET` | `/explore` | Get explore feed items (For You, etc.). |
| `GET` | `/communities` | List active communities/groups. |
| `GET` | `/search` | Global search service (posts & content). |

### **Notifications**
**Base Path**: `/api/notifications`

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Fetch a list of user notifications. |
| `PUT` | `/[id]/read` | Mark a specific notification as read. |
| `PUT` | `/read-all` | Mark all notifications as read. |

### **Ads Management**
**Base Path**: `/api/ads`

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | List all ad campaigns for the user. |
| `POST` | `/` | Create a new ad campaign. |
| `GET` | `/performance` | Get ad performance statistics. |

### **Spaces (Audio/Live)**
**Base Path**: `/api/spaces`

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | List active or scheduled spaces. |
| `POST` | `/` | Create/Schedule a new space. |

### **Messaging**
**Base Path**: `/api/messages`

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/conversations` | Get user conversations (Messaging Service). |
