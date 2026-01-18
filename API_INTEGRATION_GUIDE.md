# X-Clone API Integration Guide

**Version**: 1.0.0  
**Base URL**: `http://your-domain.com/api`  
**Documentation**: `http://your-domain.com/docs`

---

## 🚀 Quick Start

### 1. **Get API Access**
Contact your administrator to get:
- API base URL
- Test credentials (or create an account)

### 2. **Authenticate**
```bash
curl -X POST "http://your-domain.com/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}'
```

**Response**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiJ9...",
  "user": {...}
}
```

### 3. **Make Your First API Call**
```bash
curl -X GET "http://your-domain.com/api/auth/me" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 📚 Available Resources

### **Interactive Documentation**
- **Swagger UI**: `http://your-domain.com/docs`
- **OpenAPI Spec**: `http://your-domain.com/openapi.yaml`

### **Code Examples**
- See `API_EXAMPLES.md` for JavaScript, Python, and cURL examples
- Import `POSTMAN_COLLECTION.json` into Postman

### **Authentication**
- See `AUTHENTICATION_GUIDE.md` for detailed auth flow

---

## 🔑 Authentication Flow

### **Step 1: Register (Optional)**
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe",
  "handle": "johndoe"
}
```

### **Step 2: Login**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

### **Step 3: Use Access Token**
Include the token in all authenticated requests:
```http
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### **Step 4: Refresh Token (Optional)**
Access tokens expire after 15 minutes. Use refresh token to get a new one:
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "YOUR_REFRESH_TOKEN"
}
```

---

## 📋 Core Endpoints

### **Authentication**
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/register` | POST | None | Register new user |
| `/api/auth/login` | POST | None | Login user |
| `/api/auth/me` | GET | Bearer | Get current user |
| `/api/auth/refresh` | POST | None | Refresh access token |

### **Users**
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/users/:id` | GET | Bearer | Get user profile |
| `/api/users/:id` | PUT | Bearer | Update profile |

### **Posts**
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/posts` | POST | Bearer | Create post |
| `/api/posts` | GET | Bearer | Get all posts |
| `/api/posts/:id` | GET | None | Get single post |
| `/api/posts/:id` | DELETE | Bearer | Delete post |
| `/api/posts/:id/like` | POST | Bearer | Like post |
| `/api/posts/:id/like` | DELETE | Bearer | Unlike post |
| `/api/posts/:id/retweet` | POST | Bearer | Retweet post |
| `/api/posts/:id/retweet` | DELETE | Bearer | Unretweet post |

### **Timeline**
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/timeline/home` | GET | Bearer | Get home timeline |

---

## 💻 Integration Examples

### **JavaScript (Node.js)**
```javascript
const axios = require('axios');

const API_BASE = 'http://your-domain.com/api';
let accessToken = '';

// Login
async function login() {
  const response = await axios.post(`${API_BASE}/auth/login`, {
    email: 'user@example.com',
    password: 'password123'
  });
  accessToken = response.data.accessToken;
  return response.data;
}

// Get current user
async function getCurrentUser() {
  const response = await axios.get(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  return response.data;
}

// Create post
async function createPost(content) {
  const response = await axios.post(`${API_BASE}/posts`, 
    { content },
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  return response.data;
}
```

### **Python**
```python
import requests

API_BASE = 'http://your-domain.com/api'
access_token = ''

# Login
def login():
    global access_token
    response = requests.post(f'{API_BASE}/auth/login', json={
        'email': 'user@example.com',
        'password': 'password123'
    })
    data = response.json()
    access_token = data['accessToken']
    return data

# Get current user
def get_current_user():
    response = requests.get(f'{API_BASE}/auth/me', 
        headers={'Authorization': f'Bearer {access_token}'}
    )
    return response.json()

# Create post
def create_post(content):
    response = requests.post(f'{API_BASE}/posts',
        json={'content': content},
        headers={'Authorization': f'Bearer {access_token}'}
    )
    return response.json()
```

### **cURL**
```bash
# Login
TOKEN=$(curl -s -X POST "http://your-domain.com/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}' \
  | jq -r '.accessToken')

# Get current user
curl -X GET "http://your-domain.com/api/auth/me" \
  -H "Authorization: Bearer $TOKEN"

# Create post
curl -X POST "http://your-domain.com/api/posts" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"Hello from API!"}'
```

---

## ⚙️ Configuration

### **Environment Variables**
```bash
# API Configuration
API_BASE_URL=http://your-domain.com/api
API_TIMEOUT=30000

# Authentication
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
```

### **CORS Configuration**
If integrating from a web application, ensure your domain is whitelisted:
```
Allowed Origins: https://your-frontend-domain.com
```

---

## 🔒 Security Best Practices

1. **Never hardcode credentials** - Use environment variables
2. **Store tokens securely** - Use secure storage (keychain, encrypted storage)
3. **Use HTTPS in production** - Never send tokens over HTTP
4. **Implement token refresh** - Handle token expiration gracefully
5. **Validate responses** - Always check response status codes
6. **Handle errors** - Implement proper error handling

---

## 📊 Rate Limiting

| Tier | Requests/Hour | Burst |
|------|---------------|-------|
| Free | 1,000 | 100 |
| Pro | 10,000 | 500 |
| Enterprise | Unlimited | Custom |

**Rate Limit Headers**:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1768545904
```

---

## 🐛 Error Handling

### **Common Error Codes**
| Code | Meaning | Action |
|------|---------|--------|
| 400 | Bad Request | Check request format |
| 401 | Unauthorized | Refresh or re-authenticate |
| 403 | Forbidden | Check permissions |
| 404 | Not Found | Verify resource ID |
| 429 | Too Many Requests | Implement rate limiting |
| 500 | Server Error | Retry with backoff |

### **Error Response Format**
```json
{
  "error": "Invalid credentials",
  "code": "AUTH_FAILED",
  "details": []
}
```

---

## 🧪 Testing

### **Test Credentials**
```
Email: user1@xclone.com
Password: password123
```

### **Postman Collection**
Import `POSTMAN_COLLECTION.json` for ready-to-use API requests

### **Swagger UI**
Visit `http://your-domain.com/docs` to test endpoints interactively

---

## 📞 Support

- **Documentation**: http://your-domain.com/docs
- **OpenAPI Spec**: http://your-domain.com/openapi.yaml
- **Issues**: Contact your API administrator

---

## 📝 Changelog

### Version 1.0.0 (2026-01-16)
- Initial API release
- Authentication endpoints
- User management
- Post CRUD operations
- Timeline functionality
