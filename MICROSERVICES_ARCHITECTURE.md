# X-Clone Microservices Architecture

## Overview

X-Clone uses a **microservices architecture** with the following components:

```
┌─────────────┐
│   Client    │ (React Frontend - Port 5173)
│  (Browser)  │
└──────┬──────┘
       │
       ↓
┌─────────────────────────────────────────────┐
│         API Gateway (Nginx)                 │
│              Port 3001                      │
│  Routes: /api/auth, /api/users, /api/posts │
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

## 1. Frontend (Client)

**Technology:** React + Vite + Tailwind CSS  
**Port:** 5173  
**Container:** `xclone-client`  
**Location:** `/Users/ashish/Aspire/X/apps/client`

### Responsibilities
- User interface and user experience
- State management (React Context)
- API communication via Axios
- Client-side routing (React Router)

### Key Features
- Post composer with emoji picker
- Image upload and preview
- Real-time feed updates
- Profile management
- Authentication UI

### Environment Variables
```bash
VITE_API_URL=http://localhost:3001/api
```

---

## 2. API Gateway (Nginx)

**Technology:** Nginx  
**Port:** 3001 (external), 80 (internal)  
**Container:** `xclone-gateway`  
**Location:** `/Users/ashish/Aspire/X/apps/gateway`

### Responsibilities
- **Reverse proxy** for all backend services
- **CORS handling** (centralized)
- **Request routing** based on URL paths
- **Load balancing** (future enhancement)
- **SSL termination** (production)

### Routing Configuration

| Route Pattern | Upstream Service | Purpose |
|--------------|------------------|---------|
| `/api/auth/*` | auth-service:3001 | Authentication |
| `/api/users/*` | user-service:3002 | User profiles |
| `/api/posts/*` | content-service:3003 | Posts CRUD |
| `/api/timeline/*` | content-service:3003 | Timeline feeds |
| `/api/media/*` | content-service:3003 | Media uploads |

### Configuration
```nginx
# File: apps/gateway/nginx.conf
client_max_body_size 10M;  # Allow larger file uploads

location ^~ /api/media/ {
    proxy_pass http://content_service/media/;
}
```

---

## 3. Auth Service

**Technology:** Next.js (JavaScript)  
**Port:** 3001 (internal)  
**Container:** `xclone-backend`  
**Location:** `/Users/ashish/Aspire/X/apps/backend/auth-service-js`

### Responsibilities
- User registration
- User login/logout
- JWT token generation
- Token validation
- Session management

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/refresh` | Refresh access token |

### Database Schema
```prisma
model User {
  id            String   @id @default(uuid())
  email         String   @unique
  password      String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

### JWT Configuration
- **Access Token:** 15 minutes expiry
- **Refresh Token:** 7 days expiry
- **Algorithm:** HS256
- **Secret:** `JWT_SECRET` environment variable

---

## 4. User Service

**Technology:** Express.js + Prisma  
**Port:** 3002  
**Container:** `xclone-user-service`  
**Location:** `/Users/ashish/Aspire/X/apps/services/user`

### Responsibilities
- User profile management
- Profile CRUD operations
- User statistics
- Follow/unfollow (future)
- User search (future)

### API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/users/:id` | Get user profile | ✅ |
| PUT | `/api/users/:id` | Update profile | ✅ |
| GET | `/api/users/?ids=...` | Bulk get users | ✅ |

### Database Schema
```prisma
model Profile {
  id        String   @id @default(uuid())
  userId    String   @unique
  name      String
  handle    String   @unique
  bio       String?
  avatar    String?
  banner    String?
  location  String?
  website   String?
  verified  Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Features
- Profile photo/banner upload
- Bio and location management
- User verification badges
- Profile statistics (posts, followers, following)

---

## 5. Content Service

**Technology:** Express.js + Prisma + Multer  
**Port:** 3003  
**Container:** `xclone-content-service`  
**Location:** `/Users/ashish/Aspire/X/apps/services/content`

### Responsibilities
- Post creation, retrieval, deletion
- Like/unlike posts
- Retweet/unretweet posts
- Media upload and storage
- Timeline generation
- Notifications

### API Endpoints

#### Posts
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/posts/` | Create post | ✅ |
| GET | `/api/posts/` | Get all posts | ✅ |
| GET | `/api/posts/:id` | Get single post | ❌ |
| DELETE | `/api/posts/:id` | Delete post | ✅ |
| GET | `/api/posts/:id/replies` | Get replies | ❌ |

#### Interactions
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/posts/:id/like` | Like post | ✅ |
| DELETE | `/api/posts/:id/like` | Unlike post | ✅ |
| POST | `/api/posts/:id/retweet` | Retweet post | ✅ |
| DELETE | `/api/posts/:id/retweet` | Unretweet post | ✅ |

#### Media
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/media/upload` | Upload image | ✅ |
| GET | `/api/media/uploads/:filename` | Get image | ❌ |

#### Timeline
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/timeline/home` | Get home timeline | ✅ |

### Database Schema
```prisma
model Post {
  id         String   @id @default(uuid())
  userId     String
  content    String
  mediaUrls  String?  // JSON array of URLs
  replyToId  String?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  
  likes      Like[]
  retweets   Retweet[]
  replies    Post[]   @relation("PostReplies")
}

model Like {
  id        String   @id @default(uuid())
  userId    String
  postId    String
  createdAt DateTime @default(now())
  
  @@unique([postId, userId])
}

model Retweet {
  id        String   @id @default(uuid())
  userId    String
  postId    String
  createdAt DateTime @default(now())
  
  @@unique([postId, userId])
}

model Notification {
  id        String   @id @default(uuid())
  userId    String
  type      String   // 'like', 'retweet', 'reply', 'follow'
  actorId   String
  postId    String?
  read      Boolean  @default(false)
  createdAt DateTime @default(now())
}
```

### Media Storage
- **Storage:** Local filesystem (`/uploads` directory)
- **Max Size:** 5MB per file
- **Formats:** JPEG, PNG, GIF
- **Serving:** Express static middleware
- **URL Pattern:** `/api/media/uploads/{timestamp}.{ext}`

---

## 6. Database (PostgreSQL)

**Technology:** PostgreSQL 15 Alpine  
**Port:** 5432  
**Container:** `xclone-postgres`  
**Database Name:** `xclone_db`

### Configuration
```yaml
POSTGRES_USER: xclone
POSTGRES_PASSWORD: xclone_dev_password
POSTGRES_DB: xclone_db
```

### Shared Across Services
All microservices connect to the same PostgreSQL instance with different schemas/tables:
- **Auth Service:** `User` table
- **User Service:** `Profile` table
- **Content Service:** `Post`, `Like`, `Retweet`, `Notification` tables

### Connection String
```
postgresql://xclone:xclone_dev_password@postgres:5432/xclone_db
```

---

## Service Communication

### Inter-Service Communication
Currently, services communicate through:
1. **Shared Database** - Primary data sharing mechanism
2. **Frontend Aggregation** - Client fetches from multiple services

### Future Enhancements
- **Service-to-Service HTTP** - Direct API calls between services
- **Message Queue** - RabbitMQ or Kafka for async events
- **Service Mesh** - Istio for advanced routing and observability

---

## Docker Compose Configuration

### Services Overview
```yaml
services:
  postgres:        # Database
  gateway:         # Nginx API Gateway
  backend:         # Auth Service (Next.js)
  user-service:    # User Service (Express)
  content-service: # Content Service (Express)
  client:          # Frontend (React) - Optional
```

### Network
All services run on the same Docker network: `xclone-network`

### Volumes
- `postgres_data:/var/lib/postgresql/data` - Database persistence
- `./apps/gateway/nginx.conf:/etc/nginx/nginx.conf` - Nginx config (via Dockerfile)

---

## Quick Reference

### Start All Services
```bash
docker-compose up -d
```

### View Running Services
```bash
docker ps
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
docker restart xclone-content-service
```

### Rebuild a Service
```bash
docker-compose up -d --build gateway
```

### Stop All Services
```bash
docker-compose down
```

### Stop and Remove Volumes
```bash
docker-compose down -v
```

---

## Service Health Checks

### Gateway
```bash
curl http://localhost:3001/health
# Response: "Gateway is healthy"
```

### Content Service
```bash
curl http://localhost:3001/api/posts/health
# Response: {"status":"healthy","service":"content-service"}
```

### Database
```bash
docker exec xclone-postgres pg_isready -U xclone
# Response: /var/run/postgresql:5432 - accepting connections
```

---

## Environment Variables

### Auth Service
```bash
DATABASE_URL=postgresql://xclone:xclone_dev_password@postgres:5432/xclone_db
JWT_SECRET=dev-secret
NODE_ENV=development
```

### User Service
```bash
DATABASE_URL=postgresql://xclone:xclone_dev_password@postgres:5432/xclone_db
JWT_SECRET=dev-secret
PORT=3002
```

### Content Service
```bash
DATABASE_URL=postgresql://xclone:xclone_dev_password@postgres:5432/xclone_db
JWT_SECRET=dev-secret
PORT=3003
```

### Client
```bash
VITE_API_URL=http://localhost:3001/api
```

---

## Security Considerations

### Current Implementation
- ✅ JWT-based authentication
- ✅ Password hashing (bcrypt)
- ✅ CORS configuration
- ✅ Environment variable secrets
- ✅ Input validation (Zod in auth service)

### Production Recommendations
- 🔒 Use HTTPS/SSL certificates
- 🔒 Implement rate limiting
- 🔒 Add API key authentication for service-to-service
- 🔒 Use secrets management (Vault, AWS Secrets Manager)
- 🔒 Implement request signing
- 🔒 Add DDoS protection
- 🔒 Enable database encryption at rest

---

## Monitoring & Observability

### Current Logging
- Console logs in each service
- Docker logs accessible via `docker logs`
- Nginx access logs

### Recommended Additions
- **Logging:** ELK Stack (Elasticsearch, Logstash, Kibana)
- **Metrics:** Prometheus + Grafana
- **Tracing:** Jaeger or Zipkin
- **APM:** New Relic or Datadog
- **Error Tracking:** Sentry

---

## Scaling Strategy

### Horizontal Scaling
Each service can be scaled independently:

```yaml
# docker-compose.yml
services:
  content-service:
    deploy:
      replicas: 3  # Run 3 instances
```

### Load Balancing
Nginx can distribute traffic across multiple instances:

```nginx
upstream content_service {
    server content-service-1:3003;
    server content-service-2:3003;
    server content-service-3:3003;
}
```

### Database Scaling
- **Read Replicas:** For read-heavy workloads
- **Connection Pooling:** PgBouncer
- **Sharding:** For massive scale

---

## Development Workflow

### 1. Make Code Changes
Edit files in `/apps/services/{service-name}/src/`

### 2. Rebuild Service
```bash
docker-compose up -d --build {service-name}
```

### 3. View Logs
```bash
docker logs -f xclone-{service-name}
```

### 4. Test Changes
```bash
# Use curl or the test script
./test_api.sh
```

### 5. Database Migrations
```bash
# Inside service directory
npx prisma migrate dev --name migration_name
npx prisma db push  # For quick schema sync
```

---

## Troubleshooting

### Service Won't Start
```bash
# Check logs
docker logs xclone-{service-name}

# Check if port is in use
lsof -i :3001

# Restart service
docker restart xclone-{service-name}
```

### Database Connection Issues
```bash
# Check if database is running
docker ps | grep postgres

# Test connection
docker exec xclone-postgres psql -U xclone -d xclone_db -c "SELECT 1"
```

### Gateway Routing Issues
```bash
# Test nginx config
docker exec xclone-gateway nginx -t

# View nginx logs
docker logs xclone-gateway --tail 50
```

---

## API Documentation

For complete API documentation with curl examples, see:
- [API_DOCUMENTATION.md](file:///Users/ashish/Aspire/X/API_DOCUMENTATION.md)
- [openapi.yaml](file:///Users/ashish/Aspire/X/openapi.yaml) - Import into Postman/Swagger UI

---

## Summary

| Service | Technology | Port | Container | Purpose |
|---------|-----------|------|-----------|---------|
| **Frontend** | React + Vite | 5173 | xclone-client | User interface |
| **Gateway** | Nginx | 3001 | xclone-gateway | API routing & CORS |
| **Auth** | Next.js | 3001 | xclone-backend | Authentication |
| **User** | Express | 3002 | xclone-user-service | User profiles |
| **Content** | Express | 3003 | xclone-content-service | Posts & media |
| **Database** | PostgreSQL | 5432 | xclone-postgres | Data storage |

**Total Services:** 6 (5 application + 1 database)  
**Architecture Pattern:** Microservices with API Gateway  
**Communication:** HTTP/REST + Shared Database  
**Deployment:** Docker Compose (Development)
