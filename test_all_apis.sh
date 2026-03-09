#!/bin/bash
# Werfie API - Full Endpoint Test Script (curl)
# Run: bash test_all_apis.sh
# Requires: Project running (npm run pm2:dev)

BASE_URL="http://localhost:3001"
MSG_URL="http://localhost:3019"
ADMIN_URL="http://localhost:3012"
EMAIL="user1@xclone.com"
PASS="password123"

PASSED=0
FAILED=0
TOKEN=""

test_curl() {
    local name="$1"
    local method="$2"
    local url="$3"
    local auth="${4:-1}"
    local body="${5:-}"
    local extra="${6:-}"
    
    local cmd="curl -s -o /dev/null -w '%{http_code}' -X $method"
    [ "$auth" = "1" ] && [ -n "$TOKEN" ] && cmd="$cmd -H 'Authorization: Bearer $TOKEN'"
    cmd="$cmd -H 'Content-Type: application/json'"
    [ -n "$body" ] && [ "$method" != "GET" ] && cmd="$cmd -d '$body'"
    [ -n "$extra" ] && cmd="$cmd $extra"
    cmd="$cmd '$url'"
    
    local code
    code=$(eval "$cmd" 2>/dev/null || echo "000")
    
    if [ "$code" -ge 200 ] 2>/dev/null && [ "$code" -lt 400 ]; then
        ((PASSED++))
        echo "  [PASS] $method $url ($code)"
    elif [ "$code" = "401" ] || [ "$code" = "403" ]; then
        ((FAILED++))
        echo "  [AUTH] $method $url ($code)"
    else
        ((FAILED++))
        echo "  [FAIL] $method $url ($code)"
    fi
}

echo ""
echo "=== Werfie API Test Suite (curl) ==="
echo "Base: $BASE_URL"
echo ""

# Login
echo "--- Login ---"
RESP=$(curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}")
TOKEN=$(echo "$RESP" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
USER_ID=$(echo "$RESP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "  [FAIL] Login failed. Ensure project is running and DB has $EMAIL / $PASS"
    exit 1
fi
echo "  [OK] Logged in, token obtained"
echo ""

# Auth
echo "--- Auth ---"
test_curl "Auth Me" GET "$BASE_URL/api/auth/me"

# Users
echo ""
echo "--- Users ---"
test_curl "Profile" GET "$BASE_URL/api/users/profile"
test_curl "Search" GET "$BASE_URL/api/users/search?q=user&limit=5"
test_curl "Suggestions" GET "$BASE_URL/api/users/suggestions?limit=5"
[ -n "$USER_ID" ] && test_curl "Get User" GET "$BASE_URL/api/users/$USER_ID"

# Posts
echo ""
echo "--- Posts ---"
test_curl "Get Posts" GET "$BASE_URL/api/posts?limit=5"
test_curl "Timeline Home" GET "$BASE_URL/api/posts/timeline/home?limit=5"
test_curl "Following" GET "$BASE_URL/api/posts/following?limit=5"
test_curl "Bookmarks" GET "$BASE_URL/api/posts/bookmarks"
test_curl "Create Post" POST "$BASE_URL/api/posts" 1 '{"content":"Test from curl script"}'

# Explore
echo ""
echo "--- Explore ---"
test_curl "Trends" GET "$BASE_URL/api/trends?limit=10"
test_curl "Explore" GET "$BASE_URL/api/explore?limit=10"
test_curl "Communities" GET "$BASE_URL/api/communities"

# Notifications
echo ""
echo "--- Notifications ---"
test_curl "Notifications" GET "$BASE_URL/api/notifications?limit=10"
test_curl "Read All" PUT "$BASE_URL/api/notifications/read-all"

# Spaces, Lists
echo ""
echo "--- Spaces & Lists ---"
test_curl "Spaces" GET "$BASE_URL/api/spaces"
test_curl "Lists Pinned" GET "$BASE_URL/api/lists/pinned"
test_curl "Lists Discover" GET "$BASE_URL/api/lists/discover"
test_curl "Lists Yours" GET "$BASE_URL/api/lists/yours"

# Ads, Business
echo ""
echo "--- Ads & Business ---"
test_curl "Ads Account" GET "$BASE_URL/api/ads/account"
test_curl "Campaigns" GET "$BASE_URL/api/ads/campaigns"
test_curl "Business" GET "$BASE_URL/api/business"
test_curl "Business Stats" GET "$BASE_URL/api/business/stats"

# Institutional, Leaders
echo ""
echo "--- Institutional & Leaders ---"
test_curl "Institutional" GET "$BASE_URL/api/institutional"
test_curl "Leaders" GET "$BASE_URL/api/leaders"

# Announcements, Soapbox, Debate
echo ""
echo "--- Content Modules ---"
test_curl "Announcements Feed" GET "$BASE_URL/api/announcements/feed"
test_curl "Soapbox List" GET "$BASE_URL/api/soapbox/list"
test_curl "Debate List" GET "$BASE_URL/api/debate/list"

# Messaging
echo ""
echo "--- Messaging ---"
test_curl "Conversations" GET "$BASE_URL/api/messages/conversations?limit=5"
test_curl "Messaging Direct" GET "$MSG_URL/api/messages/conversations?limit=5"

# Monetization, Moderation, Settings
echo ""
echo "--- Monetization & Settings ---"
test_curl "Monetization Profile" GET "$BASE_URL/api/monetization/profile"
test_curl "Monetization Stats" GET "$BASE_URL/api/monetization/stats"
test_curl "Moderation Report" POST "$BASE_URL/api/moderation/report" 1 '{"contentType":"post","contentId":"test","reason":"test"}'
test_curl "Settings" GET "$BASE_URL/api/settings"

# Search, Feed
echo ""
echo "--- Search & Feed ---"
test_curl "Search Posts" GET "$BASE_URL/api/search/posts?q=test"
test_curl "Posts Search" GET "$BASE_URL/api/posts/search?q=test&limit=5"
test_curl "World Leaders Feed" GET "$BASE_URL/api/feed/world-leaders"

# Admin (no auth)
echo ""
echo "--- Admin (no auth) ---"
test_curl "Admin Health" GET "$ADMIN_URL/api/admin/health" 0
test_curl "Admin Docs" GET "$ADMIN_URL/api/docs" 0

# Health
echo ""
echo "--- Health ---"
test_curl "User Service" GET "http://localhost:3002/health" 0
test_curl "Content Service" GET "http://localhost:3003/health" 0
test_curl "Messaging Health" GET "$MSG_URL/health" 0

# Summary
echo ""
echo "=== Summary ==="
echo "  Passed: $PASSED"
echo "  Failed: $FAILED"
echo "  Total:  $((PASSED + FAILED))"
echo ""
echo "See SWAGGER_ENDPOINTS.md for full cURL reference."
echo ""
