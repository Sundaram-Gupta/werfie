# X-Clone API - Sharing Package

**Version**: 1.0.0  
**Last Updated**: 2026-01-16

---

## 📦 What's Included

This package contains everything needed to integrate with the X-Clone API:

### **Documentation**
- ✅ `API_INTEGRATION_GUIDE.md` - Complete integration guide
- ✅ `AUTHENTICATION_GUIDE.md` - JWT authentication details
- ✅ `DEPLOYMENT_GUIDE.md` - Production deployment instructions
- ✅ `openapi.yaml` - OpenAPI 3.0 specification

### **Tools & Collections**
- ✅ `POSTMAN_COLLECTION.json` - Importable Postman collection
- ✅ `.env.example` - Environment variables template
- ✅ `automated_bearer_test.sh` - Automated testing script

### **Interactive Documentation**
- ✅ Swagger UI at `http://your-domain.com/docs`
- ✅ OpenAPI spec at `http://your-domain.com/openapi.yaml`

---

## 🚀 Quick Start for External Systems

### **1. Review Documentation**
Start with `API_INTEGRATION_GUIDE.md` for a complete overview

### **2. Import Postman Collection**
```bash
# Open Postman
# File → Import → Choose POSTMAN_COLLECTION.json
# Set baseUrl variable to your API endpoint
```

### **3. Test Authentication**
```bash
# Using the provided test script
./automated_bearer_test.sh
```

### **4. Integrate into Your System**
Choose your language and follow the examples in `API_INTEGRATION_GUIDE.md`:
- JavaScript/Node.js
- Python
- cURL

---

## 🔑 Authentication Summary

**Method**: JWT Bearer Tokens  
**Header Format**: `Authorization: Bearer {accessToken}`

```bash
# 1. Login
curl -X POST "http://your-domain.com/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# 2. Use the returned accessToken in subsequent requests
curl -X GET "http://your-domain.com/api/auth/me" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

See `AUTHENTICATION_GUIDE.md` for complete details.

---

## 📋 Available Endpoints

### **Core Features**
- **Authentication**: Register, Login, Token Refresh
- **Users**: Profile management, Updates
- **Posts**: Create, Read, Update, Delete
- **Interactions**: Like, Retweet, Reply
- **Timeline**: Home feed, Following feed

### **Full Endpoint List**
See `openapi.yaml` or visit the Swagger UI for complete API documentation.

---

## 🌐 API Base URLs

### **Development**
```
http://localhost:3001/api
```

### **Production**
```
https://api.your-domain.com/api
```

**Update the `baseUrl` in**:
- Postman collection variables
- Your application's environment config
- `.env` file

---

## 📚 Documentation Links

| Resource | Location |
|----------|----------|
| **Integration Guide** | `API_INTEGRATION_GUIDE.md` |
| **Authentication** | `AUTHENTICATION_GUIDE.md` |
| **Deployment** | `DEPLOYMENT_GUIDE.md` |
| **OpenAPI Spec** | `openapi.yaml` |
| **Swagger UI** | `http://your-domain.com/docs` |
| **Postman Collection** | `POSTMAN_COLLECTION.json` |

---

## 💻 Code Examples

### **JavaScript**
```javascript
const axios = require('axios');

const API_BASE = 'http://your-domain.com/api';

async function login(email, password) {
  const response = await axios.post(`${API_BASE}/auth/login`, {
    email, password
  });
  return response.data.accessToken;
}

async function createPost(token, content) {
  const response = await axios.post(`${API_BASE}/posts`, 
    { content },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
}
```

### **Python**
```python
import requests

API_BASE = 'http://your-domain.com/api'

def login(email, password):
    response = requests.post(f'{API_BASE}/auth/login', json={
        'email': email, 'password': password
    })
    return response.json()['accessToken']

def create_post(token, content):
    response = requests.post(f'{API_BASE}/posts',
        json={'content': content},
        headers={'Authorization': f'Bearer {token}'}
    )
    return response.json()
```

More examples in `API_INTEGRATION_GUIDE.md`

---

## 🔒 Security Considerations

### **For API Consumers**
1. ✅ Always use HTTPS in production
2. ✅ Store tokens securely (not in localStorage)
3. ✅ Implement token refresh logic
4. ✅ Handle 401 errors gracefully
5. ✅ Never commit credentials to version control

### **For API Providers**
1. ✅ Enable CORS only for trusted domains
2. ✅ Implement rate limiting
3. ✅ Use strong JWT secrets
4. ✅ Enable SSL/TLS
5. ✅ Monitor API usage

See `DEPLOYMENT_GUIDE.md` for production security setup.

---

## 📊 Testing

### **Automated Testing**
```bash
# Run the included test script
chmod +x automated_bearer_test.sh
./automated_bearer_test.sh
```

**Tests**:
- ✅ Authentication flow
- ✅ User profile operations
- ✅ Post CRUD operations
- ✅ Interactions (like, retweet)
- ✅ Authorization enforcement

### **Manual Testing**
1. Import Postman collection
2. Run "Login" request
3. Token auto-saves to collection variables
4. Test other endpoints

### **Interactive Testing**
Visit Swagger UI at `http://your-domain.com/docs`

---

## 🚀 Deployment

### **Quick Deploy**
```bash
# 1. Configure environment
cp .env.example .env
nano .env

# 2. Start services
docker-compose up -d

# 3. Verify
curl http://localhost:3001/api/health
```

### **Production Deploy**
See `DEPLOYMENT_GUIDE.md` for:
- SSL/TLS setup
- Security hardening
- Monitoring
- CI/CD pipeline
- Scaling strategies

---

## 📈 Rate Limits

| Tier | Requests/Hour |
|------|---------------|
| Free | 1,000 |
| Pro | 10,000 |
| Enterprise | Unlimited |

Rate limit headers included in responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1768545904
```

---

## 🐛 Troubleshooting

### **Common Issues**

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Check token format: `Bearer {token}` |
| CORS Error | Verify domain is whitelisted |
| 429 Too Many Requests | Implement rate limiting/backoff |
| Connection Refused | Check API base URL |

### **Getting Help**
1. Check Swagger UI for endpoint details
2. Review `API_INTEGRATION_GUIDE.md`
3. Test with Postman collection
4. Contact API administrator

---

## 📝 Checklist for Integration

- [ ] Read `API_INTEGRATION_GUIDE.md`
- [ ] Import Postman collection
- [ ] Test authentication flow
- [ ] Configure environment variables
- [ ] Implement token refresh logic
- [ ] Add error handling
- [ ] Test all required endpoints
- [ ] Implement rate limiting
- [ ] Set up monitoring
- [ ] Deploy to production

---

## 📞 Support & Contact

- **Documentation**: All guides included in this package
- **API Status**: Check `/health` endpoint
- **Issues**: Contact your API administrator

---

## 📄 License & Terms

Contact your API provider for:
- Terms of service
- Usage limits
- SLA agreements
- Support options

---

**Ready to integrate? Start with `API_INTEGRATION_GUIDE.md`! 🚀**
