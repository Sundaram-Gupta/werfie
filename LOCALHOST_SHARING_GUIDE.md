# X-Clone API - Localhost Sharing Guide

**For Local Development & Testing**  
**Base URL**: `http://localhost:3001/api`

---

## 🚀 Quick Start (Localhost)

### **1. Share These URLs**
```
API Base:     http://localhost:3001/api
Swagger UI:   http://localhost:3001/docs
OpenAPI Spec: http://localhost:3001/openapi.yaml
Frontend:     http://localhost:5173
```

### **2. Test Credentials**
```
Email:    user1@xclone.com
Password: password123
```

### **3. Quick Test**
```bash
# Login and get token
curl -X POST "http://localhost:3001/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"user1@xclone.com","password":"password123"}'

# Use the accessToken from response
curl -X GET "http://localhost:3001/api/auth/me" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 📦 What to Share with Other Developers

### **Option 1: Share Documentation Only**

Send these files:
- `API_INTEGRATION_GUIDE.md`
- `AUTHENTICATION_GUIDE.md`
- `POSTMAN_COLLECTION.json`
- `openapi.yaml`

**Instructions for them**:
```
1. Import POSTMAN_COLLECTION.json into Postman
2. Update baseUrl variable to: http://localhost:3001/api
3. Run "Login" request with test credentials
4. Start testing other endpoints
```

### **Option 2: Share via Network (Same WiFi)**

**Find your PC’s IP** (the machine running the dev server):
```bash
# Windows (PowerShell or CMD)
ipconfig

# Look for "IPv4 Address" under your active adapter (e.g. Wi-Fi or Ethernet).
# Example: 192.168.1.103

# On Mac
ipconfig getifaddr en0
# Example: 192.168.1.100
```

**Important:** Use the **dev machine’s** IP, not the other device’s. On the other device (phone, another laptop), open:
- **Frontend (app):** `http://YOUR_PC_IP:5173` (e.g. http://192.168.1.103:5173)
- **API / Swagger:** `http://YOUR_PC_IP:3001/api` and `http://YOUR_PC_IP:3001/api-docs`

**If it doesn’t load from another device:**

1. **Windows Firewall** – Allow inbound connections to the dev server:
   - Run PowerShell **as Administrator**, then:
   ```powershell
   New-NetFirewallRule -DisplayName "Vite Dev 5173" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow
   New-NetFirewallRule -DisplayName "Gateway 3001" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow
   ```
   - Or: Windows Security → Firewall → Advanced → Inbound Rules → New Rule → Port → TCP 5173 and 3001 → Allow.

2. **Same network** – Other device must be on the same Wi‑Fi/LAN as the PC.

3. **Correct IP** – On the PC run `ipconfig` and use the IPv4 address shown there in the browser on the other device.

**Share this URL** (replace with your PC’s IP):
```
http://YOUR_PC_IP:3001/api
```

**Update CORS** (if needed):
```bash
# In apps/gateway/nginx.conf
# Change:
add_header 'Access-Control-Allow-Origin' '*' always;

# Or specify IP:
add_header 'Access-Control-Allow-Origin' 'http://192.168.1.*' always;
```

### **Option 3: Use ngrok (Internet Access)**

**Install ngrok**:
```bash
brew install ngrok
```

**Expose localhost**:
```bash
ngrok http 3001
```

**Share the ngrok URL**:
```
https://abc123.ngrok.io/api
```

---

## 📋 Localhost Package Contents

### **Essential Files**
```
x-clone-api-localhost/
├── API_INTEGRATION_GUIDE.md      # How to use the API
├── AUTHENTICATION_GUIDE.md       # JWT authentication
├── POSTMAN_COLLECTION.json       # Import into Postman
├── openapi.yaml                  # API specification
└── LOCALHOST_SETUP.md            # This file
```

### **Optional Files**
```
├── automated_bearer_test.sh      # Automated testing
├── .env.example                  # Configuration reference
└── test_credentials.txt          # Test user accounts
```

---

## 🔧 Localhost Configuration

### **Postman Setup**
```
1. Import POSTMAN_COLLECTION.json
2. Edit Collection → Variables
3. Set baseUrl = http://localhost:3001/api
4. Save
```

### **Code Examples (Localhost)**

**JavaScript**:
```javascript
const API_BASE = 'http://localhost:3001/api';

async function login() {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'user1@xclone.com',
      password: 'password123'
    })
  });
  const data = await response.json();
  return data.accessToken;
}
```

**Python**:
```python
import requests

API_BASE = 'http://localhost:3001/api'

def login():
    response = requests.post(f'{API_BASE}/auth/login', json={
        'email': 'user1@xclone.com',
        'password': 'password123'
    })
    return response.json()['accessToken']
```

**cURL**:
```bash
TOKEN=$(curl -s -X POST "http://localhost:3001/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"user1@xclone.com","password":"password123"}' \
  | jq -r '.accessToken')

curl -X GET "http://localhost:3001/api/auth/me" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 👥 Test User Accounts

All test users have password: `password123`

```
user1@xclone.com  - @user1
user2@xclone.com  - @user2
user3@xclone.com  - @user3
...
user50@xclone.com - @user50
```

See `userpassword.md` for complete list.

---

## 🧪 Testing

### **Quick Test Script**
```bash
# Run automated tests
./automated_bearer_test.sh
```

### **Swagger UI**
```
Open: http://localhost:3001/docs
1. Click "Authorize" button
2. Login to get token
3. Paste token (with "Bearer " prefix)
4. Test endpoints interactively
```

---

## 📤 How to Share (Localhost)

### **Method 1: Documentation Package**
```bash
# Create a ZIP file
cd /Users/ashish/Aspire/X
zip -r api-docs-localhost.zip \
  API_INTEGRATION_GUIDE.md \
  AUTHENTICATION_GUIDE.md \
  POSTMAN_COLLECTION.json \
  openapi.yaml \
  LOCALHOST_SETUP.md \
  userpassword.md

# Share via email, Slack, etc.
```

### **Method 2: Shared Folder**
```bash
# Copy files to shared location
cp API_*.md POSTMAN_COLLECTION.json openapi.yaml ~/Shared/api-docs/
```

### **Method 3: Git Repository**
```bash
# Create docs repo
mkdir x-clone-api-docs
cd x-clone-api-docs
cp /Users/ashish/Aspire/X/API_*.md .
cp /Users/ashish/Aspire/X/POSTMAN_COLLECTION.json .
cp /Users/ashish/Aspire/X/openapi.yaml .
git init && git add . && git commit -m "API docs"
```

---

## ⚠️ Localhost Limitations

**What works**:
- ✅ Same computer access
- ✅ Same network access (with local IP)
- ✅ Internet access (with ngrok)

**What doesn't work**:
- ❌ Direct internet access without tunnel
- ❌ HTTPS (unless using ngrok)
- ❌ Production-level security

**For production**: See `DEPLOYMENT_GUIDE.md`

---

## 🔒 Localhost Security

**Since it's localhost**:
- No SSL/TLS required
- CORS set to `*` (allow all)
- Rate limiting optional
- Test credentials are fine

**If sharing on network**:
- Consider basic auth
- Use strong test passwords
- Don't expose sensitive data

---

## ✅ Localhost Sharing Checklist

- [ ] Services running (`docker-compose ps`)
- [ ] Swagger UI accessible (http://localhost:3001/docs)
- [ ] Test credentials working
- [ ] Postman collection tested
- [ ] Documentation files ready
- [ ] Package created (ZIP or folder)
- [ ] Shared with team (email/Slack/Git)

---

## 📞 Quick Reference

| What | URL/Command |
|------|-------------|
| **API Base** | http://localhost:3001/api |
| **Swagger UI** | http://localhost:3001/docs |
| **Test Login** | user1@xclone.com / password123 |
| **Check Status** | `docker-compose ps` |
| **View Logs** | `docker-compose logs -f` |
| **Run Tests** | `./automated_bearer_test.sh` |

---

**Ready to share! Just send the documentation files and URLs to your team! 🚀**
