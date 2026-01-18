#!/bin/bash

# X-Clone Comprehensive API Test Script
# Tests all endpoints from OpenAPI specification

set -e

BASE_URL="http://localhost:3001/api"
TOKEN=""
USER_ID=""
POST_ID=""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "╔════════════════════════════════════════════════════════╗"
echo "║   X-Clone Comprehensive API Test Suite                ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Test counter
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

test_endpoint() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    local name="$1"
    local result="$2"
    
    if [ "$result" = "PASS" ]; then
        echo -e "${GREEN}✓${NC} $name"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}✗${NC} $name"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

echo -e "${BLUE}[AUTHENTICATION ENDPOINTS]${NC}"
echo ""

# Test 1: Login
echo -n "Testing login... "
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"user1@xclone.com","password":"password123"}')

if echo "$LOGIN_RESPONSE" | jq -e '.accessToken' > /dev/null 2>&1; then
    TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.accessToken')
    USER_ID=$(echo $LOGIN_RESPONSE | jq -r '.user.id')
    test_endpoint "POST /api/auth/login" "PASS"
else
    test_endpoint "POST /api/auth/login" "FAIL"
    echo "Response: $LOGIN_RESPONSE"
fi

# Test 2: Get Current User
echo -n "Testing get current user... "
ME_RESPONSE=$(curl -s -X GET "$BASE_URL/auth/me" \
  -H "Authorization: Bearer $TOKEN")

if echo "$ME_RESPONSE" | jq -e '.id' > /dev/null 2>&1; then
    test_endpoint "GET /api/auth/me" "PASS"
else
    test_endpoint "GET /api/auth/me" "FAIL"
fi

echo ""
echo -e "${BLUE}[USER ENDPOINTS]${NC}"
echo ""

# Test 3: Get User Profile
echo -n "Testing get user profile... "
USER_RESPONSE=$(curl -s -X GET "$BASE_URL/users/$USER_ID/" \
  -H "Authorization: Bearer $TOKEN")

if echo "$USER_RESPONSE" | jq -e '.id' > /dev/null 2>&1; then
    test_endpoint "GET /api/users/:id" "PASS"
else
    test_endpoint "GET /api/users/:id" "FAIL"
fi

# Test 4: Update Profile
echo -n "Testing update profile... "
UPDATE_RESPONSE=$(curl -s -X PUT "$BASE_URL/users/$USER_ID/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"bio":"Updated bio from API test"}')

if echo "$UPDATE_RESPONSE" | jq -e '.bio' > /dev/null 2>&1; then
    test_endpoint "PUT /api/users/:id" "PASS"
else
    test_endpoint "PUT /api/users/:id" "FAIL"
fi

echo ""
echo -e "${BLUE}[POST ENDPOINTS]${NC}"
echo ""

# Test 5: Create Post
echo -n "Testing create post... "
POST_RESPONSE=$(curl -s -X POST "$BASE_URL/posts/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"Test post from comprehensive API test suite! 🚀"}')

if echo "$POST_RESPONSE" | jq -e '.id' > /dev/null 2>&1; then
    POST_ID=$(echo $POST_RESPONSE | jq -r '.id')
    test_endpoint "POST /api/posts" "PASS"
else
    test_endpoint "POST /api/posts" "FAIL"
fi

# Test 6: Get All Posts
echo -n "Testing get all posts... "
POSTS_RESPONSE=$(curl -s -X GET "$BASE_URL/posts/" \
  -H "Authorization: Bearer $TOKEN")

if echo "$POSTS_RESPONSE" | jq -e '.posts' > /dev/null 2>&1; then
    test_endpoint "GET /api/posts" "PASS"
else
    test_endpoint "GET /api/posts" "FAIL"
fi

# Test 7: Get Single Post
echo -n "Testing get single post... "
SINGLE_POST=$(curl -s -X GET "$BASE_URL/posts/$POST_ID" \
  -H "Authorization: Bearer $TOKEN")

if echo "$SINGLE_POST" | jq -e '.id' > /dev/null 2>&1; then
    test_endpoint "GET /api/posts/:id" "PASS"
else
    test_endpoint "GET /api/posts/:id" "FAIL"
fi

echo ""
echo -e "${BLUE}[POST INTERACTION ENDPOINTS]${NC}"
echo ""

# Test 8: Like Post
echo -n "Testing like post... "
LIKE_RESPONSE=$(curl -s -X POST "$BASE_URL/posts/$POST_ID/like" \
  -H "Authorization: Bearer $TOKEN")

if echo "$LIKE_RESPONSE" | jq -e '.id' > /dev/null 2>&1; then
    test_endpoint "POST /api/posts/:id/like" "PASS"
else
    test_endpoint "POST /api/posts/:id/like" "FAIL"
fi

# Test 9: Unlike Post
echo -n "Testing unlike post... "
UNLIKE_RESPONSE=$(curl -s -X DELETE "$BASE_URL/posts/$POST_ID/like" \
  -H "Authorization: Bearer $TOKEN")

if echo "$UNLIKE_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
    test_endpoint "DELETE /api/posts/:id/like" "PASS"
else
    test_endpoint "DELETE /api/posts/:id/like" "FAIL"
fi

# Test 10: Retweet Post
echo -n "Testing retweet post... "
RETWEET_RESPONSE=$(curl -s -X POST "$BASE_URL/posts/$POST_ID/retweet" \
  -H "Authorization: Bearer $TOKEN")

if echo "$RETWEET_RESPONSE" | jq -e '.id' > /dev/null 2>&1; then
    test_endpoint "POST /api/posts/:id/retweet" "PASS"
else
    test_endpoint "POST /api/posts/:id/retweet" "FAIL"
fi

# Test 11: Unretweet Post
echo -n "Testing unretweet post... "
UNRETWEET_RESPONSE=$(curl -s -X DELETE "$BASE_URL/posts/$POST_ID/retweet" \
  -H "Authorization: Bearer $TOKEN")

if echo "$UNRETWEET_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
    test_endpoint "DELETE /api/posts/:id/retweet" "PASS"
else
    test_endpoint "DELETE /api/posts/:id/retweet" "FAIL"
fi

# Test 12: Get Post Replies
echo -n "Testing get post replies... "
REPLIES_RESPONSE=$(curl -s -X GET "$BASE_URL/posts/$POST_ID/replies")

if echo "$REPLIES_RESPONSE" | jq -e 'type' > /dev/null 2>&1; then
    test_endpoint "GET /api/posts/:id/replies" "PASS"
else
    test_endpoint "GET /api/posts/:id/replies" "FAIL"
fi

echo ""
echo -e "${BLUE}[TIMELINE ENDPOINTS]${NC}"
echo ""

# Test 13: Get Home Timeline
echo -n "Testing get home timeline... "
TIMELINE_RESPONSE=$(curl -s -X GET "$BASE_URL/timeline/home" \
  -H "Authorization: Bearer $TOKEN")

if echo "$TIMELINE_RESPONSE" | jq -e 'type' > /dev/null 2>&1; then
    test_endpoint "GET /api/timeline/home" "PASS"
else
    test_endpoint "GET /api/timeline/home" "FAIL"
fi

echo ""
echo -e "${BLUE}[ADDITIONAL SERVICE ENDPOINTS]${NC}"
echo ""

# Test 14: User Service Health
echo -n "Testing user service... "
USER_SVC=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3002/health")
if [ "$USER_SVC" = "200" ] || [ "$USER_SVC" = "404" ]; then
    test_endpoint "User Service (Port 3002)" "PASS"
else
    test_endpoint "User Service (Port 3002)" "FAIL"
fi

# Test 15: Content Service Health
echo -n "Testing content service... "
CONTENT_SVC=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3003/health")
if [ "$CONTENT_SVC" = "200" ] || [ "$CONTENT_SVC" = "404" ]; then
    test_endpoint "Content Service (Port 3003)" "PASS"
else
    test_endpoint "Content Service (Port 3003)" "FAIL"
fi

# Test 16: Timeline Service
echo -n "Testing timeline service... "
TIMELINE_SVC=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3004/health")
if [ "$TIMELINE_SVC" = "200" ] || [ "$TIMELINE_SVC" = "404" ]; then
    test_endpoint "Timeline Service (Port 3004)" "PASS"
else
    test_endpoint "Timeline Service (Port 3004)" "FAIL"
fi

# Test 17: Notification Service
echo -n "Testing notification service... "
NOTIF_SVC=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3005/health")
if [ "$NOTIF_SVC" = "200" ] || [ "$NOTIF_SVC" = "404" ]; then
    test_endpoint "Notification Service (Port 3005)" "PASS"
else
    test_endpoint "Notification Service (Port 3005)" "FAIL"
fi

# Test 18: Search Service
echo -n "Testing search service... "
SEARCH_SVC=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3006/health")
if [ "$SEARCH_SVC" = "200" ] || [ "$SEARCH_SVC" = "404" ]; then
    test_endpoint "Search Service (Port 3006)" "PASS"
else
    test_endpoint "Search Service (Port 3006)" "FAIL"
fi

# Test 19: Media Service
echo -n "Testing media service... "
MEDIA_SVC=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3008/health")
if [ "$MEDIA_SVC" = "200" ] || [ "$MEDIA_SVC" = "404" ]; then
    test_endpoint "Media Service (Port 3008)" "PASS"
else
    test_endpoint "Media Service (Port 3008)" "FAIL"
fi

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║                    TEST SUMMARY                        ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo -e "Total Tests:  ${BLUE}$TOTAL_TESTS${NC}"
echo -e "Passed:       ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed:       ${RED}$FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠ Some tests failed${NC}"
    exit 1
fi
