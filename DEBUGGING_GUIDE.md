# Debugging Guide: Viewing Posts and Images

## Quick Commands to Check Your Posts

### 1. View All Posts in Database
```bash
# Get total number of posts
curl -s http://localhost:3001/api/posts/ \
  -H "Authorization: Bearer YOUR_TOKEN" | jq '.posts | length'

# View all posts with details
curl -s http://localhost:3001/api/posts/ \
  -H "Authorization: Bearer YOUR_TOKEN" | jq '.posts[] | {id, content, mediaUrls, createdAt}'

# View just the latest 5 posts
curl -s http://localhost:3001/api/posts/ \
  -H "Authorization: Bearer YOUR_TOKEN" | jq '.posts[0:5] | .[] | {content, mediaUrls}'
```

### 2. Check Uploaded Images
```bash
# List all uploaded files
docker exec xclone-content-service ls -lah uploads/

# Count total uploads
docker exec xclone-content-service ls uploads/ | wc -l

# View most recent uploads
docker exec xclone-content-service ls -lt uploads/ | head -10
```

### 3. Test Image Access
```bash
# Test if an image is accessible
curl -I http://localhost:3001/api/media/uploads/FILENAME.jpg

# Download an image to verify
curl http://localhost:3001/api/media/uploads/FILENAME.jpg --output test-image.jpg
```

### 4. View Service Logs
```bash
# Content service logs (posts, uploads)
docker logs xclone-content-service --tail 50

# Gateway logs (routing)
docker logs xclone-gateway --tail 30

# Follow logs in real-time
docker logs -f xclone-content-service
```

---

## Getting Your Current Token

To use the API commands above, you need your authentication token:

### Method 1: From Browser Console
1. Open browser DevTools (F12)
2. Go to Application/Storage → Local Storage → http://localhost:5173
3. Look for `token` or `accessToken`
4. Copy the value

### Method 2: Login via curl
```bash
# Login and extract token
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"YOUR_EMAIL","password":"YOUR_PASSWORD"}' | jq -r '.accessToken')

echo "Your token: $TOKEN"

# Now use it
curl -s http://localhost:3001/api/posts/ \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

---

## Common Issues & Solutions

### Issue: Posts Not Showing in UI

**Check 1: Are posts in database?**
```bash
curl -s http://localhost:3001/api/posts/ \
  -H "Authorization: Bearer $TOKEN" | jq '.posts | length'
```
If this returns a number > 0, posts exist.

**Check 2: Is your token valid?**
```bash
curl -s http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```
If you get `401` or `403`, your token expired. Log out and log back in.

**Check 3: Check browser console**
- Open DevTools (F12) → Console tab
- Look for red error messages
- Common errors:
  - `403 Forbidden` = Expired token
  - `Network Error` = Services not running
  - `CORS Error` = Gateway configuration issue

### Issue: Images Not Displaying

**Check 1: Is image uploaded?**
```bash
docker exec xclone-content-service ls uploads/
```

**Check 2: Is image accessible?**
```bash
# Replace FILENAME with actual filename
curl -I http://localhost:3001/api/media/uploads/FILENAME.jpg
```
Should return `HTTP/1.1 200 OK`

**Check 3: Inspect image URL in post**
```bash
curl -s http://localhost:3001/api/posts/ \
  -H "Authorization: Bearer $TOKEN" | jq '.posts[] | select(.mediaUrls != null) | {content, mediaUrls}'
```

**Check 4: Browser Network tab**
- Open DevTools → Network tab
- Filter by "Img"
- Look for failed image requests (red)
- Click on failed request to see error details

---

## Complete Debugging Workflow

### Step 1: Verify Services Running
```bash
docker ps | grep xclone
```
All services should show "Up" status.

### Step 2: Get Fresh Token
```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"YOUR_EMAIL","password":"YOUR_PASSWORD"}'
```

### Step 3: Test Post Creation
```bash
TOKEN="your_token_here"

# Create a text post
curl -X POST http://localhost:3001/api/posts/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"Test post from curl"}'
```

### Step 4: Upload an Image
```bash
# Upload
UPLOAD_RESPONSE=$(curl -X POST http://localhost:3001/api/media/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/image.jpg")

echo $UPLOAD_RESPONSE | jq '.'

# Extract URL
IMAGE_URL=$(echo $UPLOAD_RESPONSE | jq -r '.url')
echo "Image URL: $IMAGE_URL"
```

### Step 5: Create Post with Image
```bash
curl -X POST http://localhost:3001/api/posts/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"content\":\"Post with image\",\"mediaUrls\":[\"$IMAGE_URL\"]}"
```

### Step 6: Verify Post Exists
```bash
curl -s http://localhost:3001/api/posts/ \
  -H "Authorization: Bearer $TOKEN" | jq '.posts[0]'
```

---

## Database Direct Access (Advanced)

If you need to check the database directly:

```bash
# Connect to PostgreSQL
docker exec -it xclone-postgres psql -U xclone -d xclone_db

# Inside psql:
# View all posts
SELECT id, "userId", content, "mediaUrls", "createdAt" FROM "Post" ORDER BY "createdAt" DESC LIMIT 10;

# Count posts
SELECT COUNT(*) FROM "Post";

# View posts with media
SELECT id, content, "mediaUrls" FROM "Post" WHERE "mediaUrls" IS NOT NULL;

# Exit
\q
```

---

## Quick Health Check Script

Save this as `check_posts.sh`:

```bash
#!/bin/bash

echo "=== X-Clone Posts Health Check ==="
echo ""

# Check services
echo "1. Services Status:"
docker ps --format "table {{.Names}}\t{{.Status}}" | grep xclone

# Check uploads
echo -e "\n2. Uploaded Files:"
docker exec xclone-content-service ls -lh uploads/ | tail -5

# Login and get token
echo -e "\n3. Getting fresh token..."
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"YOUR_EMAIL","password":"YOUR_PASSWORD"}' | jq -r '.accessToken')

if [ "$TOKEN" != "null" ]; then
    echo "✓ Token obtained"
    
    # Get posts
    echo -e "\n4. Posts in Database:"
    POST_COUNT=$(curl -s http://localhost:3001/api/posts/ \
      -H "Authorization: Bearer $TOKEN" | jq '.posts | length')
    echo "Total posts: $POST_COUNT"
    
    # Show latest post
    echo -e "\n5. Latest Post:"
    curl -s http://localhost:3001/api/posts/ \
      -H "Authorization: Bearer $TOKEN" | jq '.posts[0] | {content, mediaUrls, createdAt}'
else
    echo "✗ Failed to get token - check credentials"
fi
```

Make it executable: `chmod +x check_posts.sh`

---

## Browser DevTools Tips

### Console Tab
- Shows JavaScript errors
- Shows API request/response logs
- Type `localStorage` to see stored data

### Network Tab
- Filter by "XHR" to see API calls
- Filter by "Img" to see image requests
- Click on request → Preview to see response data
- Red = failed request

### Application Tab
- Local Storage: See stored tokens
- Session Storage: See session data
- Clear storage if needed

---

## Need More Help?

Run these commands and share the output:

```bash
# System status
docker ps
docker logs xclone-content-service --tail 20
docker logs xclone-gateway --tail 20

# Post data
curl -s http://localhost:3001/api/posts/ \
  -H "Authorization: Bearer $TOKEN" | jq '.posts[0:3]'
```
