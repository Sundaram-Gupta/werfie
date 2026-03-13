# Werfie API - curl Test Commands

Base URL: `http://localhost:3001`

## 1. Get token (login)

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"apitest@example.com","password":"password123"}'
```

Save the `accessToken` from the response for protected endpoints.

## 2. Health (no auth)

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health
# Expected: 200
```

## 3. Protected endpoints (use token)

Replace `YOUR_TOKEN` with the accessToken from step 1:

```bash
# Current user
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/api/auth/me

# User profile
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/api/users/profile

# Posts timeline
curl -H "Authorization: Bearer YOUR_TOKEN" "http://localhost:3001/api/posts/timeline/home?limit=5"

# Suggestions (no auth)
curl "http://localhost:3001/api/users/suggestions?limit=5"

# Trends (no auth)
curl "http://localhost:3001/api/trends?limit=5"

# Leaders (no auth)
curl "http://localhost:3001/api/leaders"

# Health checks
curl -s -o /dev/null -w "%{http_code}" http://localhost:3002/health  # User service
curl -s -o /dev/null -w "%{http_code}" http://localhost:3003/health  # Content service
```

## 4. Run full test script

**PowerShell (Windows):**
```powershell
.\test_apis_curl.ps1
```

**Node.js (all platforms):**
```bash
node test_apis_report.js
```

**Bash (Linux/Mac/Git Bash):**
```bash
chmod +x test_apis_curl.sh && ./test_apis_curl.sh
```

## Test user

If `apitest@example.com` does not exist, register:

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"apitest@example.com","password":"password123","name":"API Test","handle":"apitest"}'
```
