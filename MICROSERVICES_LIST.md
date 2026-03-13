# X-Clone Microservices - Complete List

## Running Services

| # | Service Name | Technology | Port | Container | Status | Endpoints |
|---|--------------|------------|------|-----------|--------|-----------|
| 1 | **API Gateway** | Nginx | 3001 | `xclone-gateway` | ✅ Running | Routes all `/api/*` requests |
| 2 | **Auth Service** | Next.js | 3001 (internal) | `xclone-backend` | ✅ Running | 3 endpoints |
| 3 | **User Service** | Express.js + Prisma | 3002 | `xclone-user-service` | ✅ Running | 9 endpoints |
| 4 | **Content Service** | Express.js + Prisma | 3003 | `xclone-content-service` | ✅ Running | 18 endpoints |
| 5 | **Database** | PostgreSQL 15 | 5432 | `xclone-postgres` | ✅ Running | Shared database |
| 6 | **Frontend** | React + Vite | 5173 | `xclone-client` | ✅ Running | User interface |

---

## 1. API Gateway (Nginx)

**Container**: `xclone-gateway`  
**Port**: 3001 (external) → 80 (internal)  
**Technology**: Nginx reverse proxy

### Responsibilities
- Route requests to appropriate microservices
- Handle CORS headers
- Load balancing (future)
- SSL termination (production)

### Routing Rules
```nginx
/api/auth/*       → auth-service:3001
/api/users/*      → user-service:3002
/api/posts/*      → content-service:3003
/api/timeline/*   → content-service:3003
/api/media/*      → content-service:3003
/api/notifications/* → content-service:3003
```

---

## 2. Auth Service

**Container**: `xclone-backend`  
**Port**: 3001 (internal only)  
**Technology**: Next.js + Prisma + JWT  
**Database**: PostgreSQL (shared)

### Endpoints (3 total)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | ❌ |
| POST | `/api/auth/login` | User login | ❌ |
| GET | `/api/auth/me` | Get current user | ✅ |

### Features
- User registration with email/password
- JWT token generation (access + refresh)
- Token validation
- Password hashing (bcrypt)
- Session management

---

## 3. User Service ⭐ **NEWLY UPDATED**

**Container**: `xclone-user-service`  
**Port**: 3002  
**Technology**: Express.js + Prisma  
**Database**: PostgreSQL (shared)

### Endpoints (9 total) - **4 NEW!**

| Method | Endpoint | Description | Auth Required | Status |
|--------|----------|-------------|---------------|--------|
| GET | `/api/users/:id` | Get user profile | ❌ | ✅ Existing |
| PUT | `/api/users/:id` | Update profile | ✅ | ✅ Existing |
| GET | `/api/users/?ids=...` | Bulk get users | ❌ | ✅ Existing |
| POST | `/api/users/:id/follow` | Follow user | ✅ | ✅ Existing |
| GET | `/api/users/profile` | Get own profile | ✅ | ✅ Existing |
| **DELETE** | **`/api/users/:id/follow`** | **Unfollow user** | ✅ | 🆕 **NEW** |
| **GET** | **`/api/users/:id/followers`** | **Get followers list** | ❌ | 🆕 **NEW** |
| **GET** | **`/api/users/:id/following`** | **Get following list** | ❌ | 🆕 **NEW** |
| **GET** | **`/api/users/search?q=...`** | **Search users** | ❌ | 🆕 **NEW** |

### Features
- User profile management
- Follow/unfollow functionality
- Followers & following lists with pagination
- User search by name or handle
- Profile statistics (posts, followers, following)

---

## 4. Content Service ⭐ **NEWLY UPDATED**

**Container**: `xclone-content-service`  
**Port**: 3003  
**Technology**: Express.js + Prisma + Multer  
**Database**: PostgreSQL (shared)

### Endpoints (18 total) - **7 NEW!**

#### Posts (8 endpoints)
| Method | Endpoint | Description | Auth Required | Status |
|--------|----------|-------------|---------------|--------|
| POST | `/api/posts/` | Create post | ✅ | ✅ Existing |
| GET | `/api/posts/` | Get all posts | ✅ | ✅ Existing |
| GET | `/api/posts/:id` | Get single post | ❌ | ✅ Existing |
| GET | `/api/posts/:id/replies` | Get replies | ❌ | ✅ Existing |
| **DELETE** | **`/api/posts/:id`** | **Delete post** | ✅ | 🆕 **NEW** |

#### Interactions (4 endpoints)
| Method | Endpoint | Description | Auth Required | Status |
|--------|----------|-------------|---------------|--------|
| POST | `/api/posts/:id/like` | Like post | ✅ | ✅ Existing |
| DELETE | `/api/posts/:id/like` | Unlike post | ✅ | ✅ Existing |
| POST | `/api/posts/:id/retweet` | Retweet post | ✅ | ✅ Existing |
| DELETE | `/api/posts/:id/retweet` | Unretweet post | ✅ | ✅ Existing |

#### Bookmarks (3 endpoints) 🆕 **ALL NEW**
| Method | Endpoint | Description | Auth Required | Status |
|--------|----------|-------------|---------------|--------|
| **POST** | **`/api/posts/:id/bookmark`** | **Bookmark post** | ✅ | 🆕 **NEW** |
| **DELETE** | **`/api/posts/:id/bookmark`** | **Remove bookmark** | ✅ | 🆕 **NEW** |
| **GET** | **`/api/posts/bookmarks`** | **Get bookmarks** | ✅ | 🆕 **NEW** |

#### Media (2 endpoints)
| Method | Endpoint | Description | Auth Required | Status |
|--------|----------|-------------|---------------|--------|
| POST | `/api/media/upload` | Upload image | ✅ | ✅ Existing |
| GET | `/api/media/uploads/:filename` | Get image | ❌ | ✅ Existing |

#### Timeline (1 endpoint)
| Method | Endpoint | Description | Auth Required | Status |
|--------|----------|-------------|---------------|--------|
| GET | `/api/timeline/home` | Get home timeline | ✅ | ✅ Existing |

#### Notifications (3 endpoints) 🆕 **ALL NEW**
| Method | Endpoint | Description | Auth Required | Status |
|--------|----------|-------------|---------------|--------|
| **GET** | **`/api/notifications`** | **Get notifications** | ✅ | 🆕 **NEW** |
| **PUT** | **`/api/notifications/:id/read`** | **Mark as read** | ✅ | 🆕 **NEW** |
| **PUT** | **`/api/notifications/read-all`** | **Mark all as read** | ✅ | 🆕 **NEW** |

### Features
- Post creation with media support
- Like/unlike, retweet/unretweet
- Bookmark management
- Post deletion (owner only)
- Reply threads
- Timeline generation
- Notification system
- Media upload (images up to 5MB)

---

## 5. Database (PostgreSQL)

**Container**: `xclone-postgres`  
**Port**: 5432  
**Technology**: PostgreSQL 15 Alpine  
**Database Name**: `xclone_db`

### Database Models ⭐ **UPDATED**

| Model | Purpose | New/Updated |
|-------|---------|-------------|
| User | User accounts | ✅ Updated (bookmarks relation) |
| Profile | User profiles | ✅ Existing |
| RefreshToken | JWT refresh tokens | ✅ Existing |
| Post | Posts/tweets | ✅ Updated (bookmarks relation) |
| Like | Post likes | ✅ Existing |
| Retweet | Post retweets | ✅ Existing |
| **Bookmark** | **Post bookmarks** | 🆕 **NEW** |
| Notification | User notifications | ✅ Existing |
| Follow | Follow relationships | ✅ Updated (timestamps) |

### Connection String
```
postgresql://xclone:xclone_dev_password@postgres:5432/xclone_db
```

---

## 6. Frontend (Client)

**Container**: `xclone-client`  
**Port**: 5173  
**Technology**: React + Vite + Tailwind CSS + shadcn/ui

### Features
- User authentication (login/register)
- Post creation with image upload
- Like/retweet functionality (integrated with backend)
- Profile management
- Feed display
- Responsive design
- Dark mode support

---

## Service Communication

```
┌─────────────┐
│   Client    │ (Port 5173)
│  (Browser)  │
└──────┬──────┘
       │
       ↓ HTTP
┌─────────────────────────────────────────────┐
│         API Gateway (Nginx)                 │
│              Port 3001                      │
└──────┬──────────────┬──────────────┬────────┘
       │              │              │
       ↓              ↓              ↓
┌──────────┐   ┌──────────┐   ┌──────────┐
│   Auth   │   │   User   │   │ Content  │
│ Service  │   │ Service  │   │ Service  │
│ Port 3001│   │ Port 3002│   │ Port 3003│
└────┬─────┘   └────┬─────┘   └────┬─────┘
     │              │              │
     └──────────────┴──────────────┘
                    │
                    ↓
            ┌───────────────┐
            │   PostgreSQL  │
            │   Port 5432   │
            └───────────────┘
```

---

## Quick Commands

### View All Services
```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

### Check Service Logs
```bash
docker logs xclone-gateway
docker logs xclone-backend
docker logs xclone-user-service
docker logs xclone-content-service
docker logs xclone-postgres
```

### Restart a Service
```bash
docker restart xclone-user-service
docker restart xclone-content-service
```

### Stop All Services
```bash
docker-compose down
```

### Start All Services
```bash
docker-compose up -d
```

---

## Summary

### Total Endpoints: **30**
- Auth Service: **3** endpoints
- User Service: **9** endpoints (4 new)
- Content Service: **18** endpoints (7 new)

### Recent Updates (Today)
- ✅ Added Bookmark model to database
- ✅ Added Follow timestamps
- ✅ Implemented 4 User Service endpoints
- ✅ Implemented 7 Content Service endpoints
- ✅ Integrated like/retweet with frontend
- ✅ All services running and tested

### Architecture Pattern
**Microservices** with API Gateway pattern, shared PostgreSQL database, and React frontend.
