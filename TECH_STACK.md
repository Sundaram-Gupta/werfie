# X-Clone Technology Stack & Tools

Complete documentation of all technologies, frameworks, tools, and utilities used in the X-Clone project.

---

## 📱 Frontend Applications

### **Main Client (User-facing App)**
**Port**: 5173  
**Location**: `/apps/client`

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.2.0 | UI framework |
| **Vite** | 7.2.4 | Build tool & dev server |
| **Tailwind CSS** | 3.4.17 | Utility-first CSS framework |
| **React Router DOM** | 7.12.0 | Client-side routing |
| **Axios** | 1.13.2 | HTTP client |
| **Socket.IO Client** | 4.8.3 | Real-time WebSocket communication |
| **Lucide React** | 0.562.0 | Icon library |
| **Emoji Picker React** | 4.16.1 | Emoji selection component |

**Radix UI Components**:
- Avatar, Dialog, Dropdown Menu, Label, Separator, Slot, Switch, Tabs, Toast, Tooltip, Visually Hidden

**Utilities**:
- `clsx` - Conditional classNames
- `tailwind-merge` - Merge Tailwind classes
- `class-variance-authority` - Component variants

---

### **Admin Panel**
**Port**: 5175  
**Location**: `/apps/admin`

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.2.0 | UI framework |
| **Vite** | 7.2.4 | Build tool & dev server |
| **Tailwind CSS** | 4.1.18 | Styling |
| **Recharts** | 3.6.0 | Data visualization & charts |
| **React Router DOM** | 7.12.0 | Routing |
| **Axios** | 1.13.2 | HTTP client |

---

## 🔧 Backend Services (Microservices)

### **1. Auth Service**
**Port**: 3001 (internal), 3012 (PM2)  
**Location**: `/apps/backend/auth-service-js`

| Technology | Purpose |
|------------|---------|
| **Next.js** 16.1.1 | Framework |
| **Prisma** 5.22.0 | ORM |
| **bcrypt** 6.0.0 | Password hashing |
| **jose** 6.1.3 | JWT operations |
| **Zod** 4.3.5 | Schema validation |
| **Socket.IO** 4.8.3 | WebSocket server |
| **Swagger UI React** 5.31.0 | API documentation UI |
| **fluent-ffmpeg** 2.1.3 | Video processing |

---

### **2. User Service**
**Port**: 3002  
**Location**: `/apps/services/user`

| Technology | Purpose |
|------------|---------|
| **Express.js** | Web framework |
| **Prisma** | ORM |
| **JWT** | Authentication |

---

### **3. Content Service**
**Port**: 3003  
**Location**: `/apps/services/content`

| Technology | Purpose |
|------------|---------|
| **Express.js** | Web framework |
| **Prisma** | ORM |
| **Multer** | File upload handling |
| **JWT** | Authentication |

---

### **4. Timeline Service**
**Port**: 3004  
**Location**: `/apps/services/timeline`

| Technology | Purpose |
|------------|---------|
| **Next.js** | Framework |
| **Prisma** | ORM |
| **KafkaJS** 2.2.4 | Message queue client |
| **Redis** | Caching |

---

### **5. Notification Service**
**Port**: 3005  
**Location**: `/apps/services/notification`

| Technology | Purpose |
|------------|---------|
| **Express.js** | Web framework |
| **Prisma** | ORM |
| **WebSockets** | Real-time notifications |
| **KafkaJS** 2.2.4 | Event streaming |

---

### **6. Search Service**
**Port**: 3006  
**Location**: `/apps/services/search`

| Technology | Purpose |
|------------|---------|
| **Next.js** | Framework |
| **Elasticsearch** 8.11.0 | Search engine |
| **KafkaJS** 2.2.4 | Event streaming |

---

### **7. Messaging Service**
**Port**: 3007  
**Location**: `/apps/services/messaging`

| Technology | Purpose |
|------------|---------|
| **Express.js** | Web framework |
| **Prisma** | ORM |
| **WebSockets** | Real-time messaging |
| **KafkaJS** 2.2.4 | Event streaming |

---

### **8. Media Service**
**Port**: 3008  
**Location**: `/apps/services/media`

| Technology | Version | Purpose |
|------------|---------|---------|
| **Express.js** | 4.18.2 | Web framework |
| **Multer** | 1.4.5-lts.1 | File upload |
| **Sharp** | 0.33.1 | Image processing |
| **jsonwebtoken** | 9.0.2 | JWT auth |
| **KafkaJS** | 2.2.4 | Event streaming |
| **uuid** | 9.0.1 | Unique ID generation |
| **CORS** | 2.8.5 | Cross-origin requests |

---

### **9. Analytics Service**
**Port**: 3009  
**Location**: `/apps/services/analytics`

| Technology | Purpose |
|------------|---------|
| **Express.js** | Web framework |

---

### **10. Moderation Service**
**Port**: 3010  
**Location**: `/apps/services/moderation`

| Technology | Purpose |
|------------|---------|
| **Express.js** | Web framework |

---

### **11. Settings Service**
**Port**: 3011  
**Location**: `/apps/services/settings`

| Technology | Purpose |
|------------|---------|
| **Express.js** | Web framework |

---

## 🗄️ Databases

### **PostgreSQL**
**Version**: 15 Alpine  
**Port**: 5432  
**Container**: `xclone-postgres`

| Configuration | Value |
|---------------|-------|
| **Database Name** | xclone_db |
| **User** | xclone |
| **ORM** | Prisma |
| **Connection String** | `postgresql://xclone:xclone_dev_password@postgres:5432/xclone_db` |

**Tables**:
- User, RefreshToken, Profile
- Post, Like, Retweet, Bookmark
- Notification, Follow
- Trend, ExploreItem

---

### **Elasticsearch**
**Version**: 8.11.0  
**Ports**: 9200, 9300  
**Container**: `xclone-elasticsearch`

| Configuration | Value |
|---------------|-------|
| **Discovery Type** | single-node |
| **Security** | Disabled (dev) |
| **Java Heap** | 512MB |

---

### **Redis**
**Version**: 7 Alpine  
**Port**: 6379  
**Container**: `xclone-redis`

| Configuration | Value |
|---------------|-------|
| **Purpose** | Caching & rate limiting |
| **Persistence** | AOF enabled |
| **Password** | xclone_redis_password |

---

## 📡 Message Queue & Streaming

### **Apache Kafka**
**Version**: Confluent Platform 7.5.0  
**Ports**: 9092 (internal), 9093 (external)  
**Container**: `xclone-kafka`

| Configuration | Value |
|---------------|-------|
| **Broker ID** | 1 |
| **Replication Factor** | 1 |
| **Auto Create Topics** | Enabled |

---

### **Zookeeper**
**Version**: Confluent 7.5.0  
**Port**: 2181  
**Container**: `xclone-zookeeper`

---

### **Kafka UI**
**Port**: 8080  
**Container**: `xclone-kafka-ui`  
**Purpose**: Kafka monitoring dashboard

---

## 🌐 API Gateway & Routing

### **Nginx**
**Port**: 3001 (external), 80 (internal)  
**Container**: `xclone-gateway`

| Route | Upstream Service | Purpose |
|-------|------------------|---------|
| `/api/auth/*` | auth-service:3001 | Authentication |
| `/api/users/*` | user-service:3002 | User profiles |
| `/api/posts/*` | content-service:3003 | Posts CRUD |
| `/api/timeline/*` | content-service:3003 | Timeline feeds |
| `/api/media/*` | content-service:3003 | Media uploads |

**Features**:
- Reverse proxy
- CORS handling (centralized)
- Request routing
- Load balancing capability
- Max upload size: 10MB

---

## 🐳 DevOps & Infrastructure

### **Docker**
**Purpose**: Containerization  
**Compose Version**: 3.8

**Containers**:
- Frontend: client, admin
- Backend: 11 microservices
- Infrastructure: postgres, redis, elasticsearch, kafka, zookeeper, nginx

---

### **PM2** ⚠️
**Status**: Configured but not actively used  
**Config File**: `ecosystem.config.js`

**Configured Services**: 11 microservices with environment variables

**Alternative**: Currently using Docker Compose for orchestration

---

## 🧪 Testing & API Tools

### **curl** ✅
**Purpose**: API testing  
**Location**: `test_api.sh`

**Test Coverage**:
- User registration & login
- Profile management
- Post creation & interactions
- Timeline retrieval
- Like & retweet functionality

---

### **Swagger/OpenAPI** ✅
**Version**: OpenAPI 3.0.3  
**File**: `openapi.yaml`

**Documentation Includes**:
- Authentication endpoints
- User profile endpoints
- Post CRUD operations
- Media upload endpoints
- Timeline endpoints

**Swagger UI React**: Installed in Auth Service (not yet integrated)

---

### **Testing Scripts**

| Script | Purpose | Location |
|--------|---------|----------|
| `test_api.sh` | Full API integration test | Root |
| `check_services.sh` | Service health verification | Root |
| `check_pm2_services.sh` | PM2 service checker | Root |
| `health_check.sh` | Service health check | Root |

---

## 🛠️ Development Tools

### **Build Tools**

| Tool | Version | Purpose | Where Used |
|------|---------|---------|------------|
| **Vite** | 7.2.4 | Frontend build tool | Client, Admin |
| **Next.js** | 16.1.1 | React framework | Auth, Timeline, Search |
| **npm** | - | Package manager | All services |
| **npx** | - | Package runner | Build scripts |
| **nodemon** | 3.1.11 | Auto-restart dev server | Media Service |

---

### **Code Quality**

| Tool | Purpose | Where Used |
|------|---------|------------|
| **ESLint** | JavaScript linting | All JS/React projects |
| **eslint-plugin-react-hooks** | React hooks linting | Frontend |
| **eslint-plugin-react-refresh** | React refresh linting | Frontend |
| **TypeScript** | Type checking | Auth Service (devDep) |

---

### **CSS Processing**

| Tool | Purpose | Where Used |
|------|---------|------------|
| **Tailwind CSS** | Utility-first CSS | Client, Admin, Auth |
| **PostCSS** | CSS processing | Client, Admin |
| **Autoprefixer** | CSS vendor prefixing | Client |

---

## 🔐 Security & Authentication

| Tool | Purpose | Implementation |
|------|---------|----------------|
| **bcrypt** | Password hashing | Auth Service |
| **jose** | JWT operations | Auth Service |
| **jsonwebtoken** | JWT creation/verification | Media Service |
| **JWT** | Token-based auth | All services |

**Security Features**:
- ✅ JWT-based authentication
- ✅ Password hashing (bcrypt)
- ✅ CORS configuration
- ✅ Environment variable secrets
- ✅ Input validation (Zod)

---

## 📁 File Processing

| Tool | Version | Purpose | Where Used |
|------|---------|---------|------------|
| **Multer** | 1.4.5-lts.1 | File upload handling | Content, Media |
| **Sharp** | 0.33.1 | Image processing | Media Service |
| **fluent-ffmpeg** | 2.1.3 | Video processing | Auth Service |

**Media Configuration**:
- Max file size: 5MB
- Supported formats: JPEG, PNG, GIF
- Storage: Local filesystem (`/uploads`)

---

## 📊 Monitoring & Debugging

| Tool | Purpose | Access |
|------|---------|--------|
| **Kafka UI** | Kafka monitoring | http://localhost:8080 |
| **Docker logs** | Container log viewing | CLI |
| **Health checks** | Service health monitoring | Custom scripts |
| **Elasticsearch** | Search analytics | http://localhost:9200 |

---

## 🧰 CLI & Shell Tools

| Tool | Purpose | Usage |
|------|---------|-------|
| **bash** | Shell scripting | All `.sh` scripts |
| **curl** | HTTP requests | API testing |
| **jq** | JSON processing | Test scripts |
| **lsof** | List open files/ports | Debugging |
| **docker** | Container management | DevOps |
| **docker-compose** | Multi-container apps | Orchestration |
| **pg_isready** | PostgreSQL health check | Docker healthcheck |

---

## 📦 Package Management

| Tool | Purpose | Files |
|------|---------|-------|
| **npm** | Node package manager | All services |
| **package.json** | Dependency management | Every service |
| **package-lock.json** | Lock file | Version consistency |

---

## 🎯 Architecture Summary

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND LAYER                        │
│  React + Vite + Tailwind CSS + Socket.IO Client         │
│  Ports: 5173 (Client), 5175 (Admin)                     │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────┐
│                   API GATEWAY (Nginx)                    │
│                      Port: 3001                          │
└─────────────────────┬───────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        ↓             ↓             ↓
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Auth Service │ │ User Service │ │Content Service│
│  Next.js     │ │  Express.js  │ │  Express.js  │
│  Port: 3001  │ │  Port: 3002  │ │  Port: 3003  │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       │                │                │
       └────────────────┼────────────────┘
                        │
                        ↓
        ┌───────────────────────────────┐
        │  PostgreSQL + Prisma ORM      │
        │  Port: 5432                   │
        └───────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│              INFRASTRUCTURE SERVICES                     │
│  Kafka + Zookeeper + Redis + Elasticsearch              │
│  Ports: 9092, 2181, 6379, 9200                          │
└─────────────────────────────────────────────────────────┘
```

---

## 📈 Technology Statistics

**Total Services**: 17
- Frontend Apps: 2
- Backend Microservices: 11
- Infrastructure Services: 4

**Total Technologies**: 50+
- Frontend Libraries: 15+
- Backend Frameworks: 3
- Databases: 3
- Message Queue: 1
- Development Tools: 30+

**Ports in Use**: 15+
- 5173, 5175 (Frontend)
- 3001-3012 (Backend Services)
- 5432, 6379, 9200, 9092, 2181, 8080 (Infrastructure)

---

## 🚀 Quick Start Commands

### Start All Services (Docker)
```bash
docker-compose up -d
```

### Start All Services (PM2)
```bash
pm2 start ecosystem.config.js
```

### Run API Tests
```bash
./test_api.sh
```

### Check Service Health
```bash
./check_services.sh
```

### View Logs
```bash
docker logs -f xclone-<service-name>
```

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `TECH_STACK.md` | This file - Complete tech stack |
| `MICROSERVICES_ARCHITECTURE.md` | Architecture details |
| `API_DOCUMENTATION.md` | API endpoint documentation |
| `openapi.yaml` | OpenAPI specification |
| `INFRASTRUCTURE.md` | Infrastructure setup |
| `DEBUGGING_GUIDE.md` | Debugging tips |
| `SERVICE_HEALTH_REPORT.md` | Service health status |

---

**Last Updated**: 2026-01-15  
**Project**: X-Clone (Twitter Clone)  
**Architecture**: Microservices with API Gateway  
**Deployment**: Docker Compose (Development)
