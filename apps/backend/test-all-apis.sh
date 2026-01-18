#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3001"
PASSED=0
FAILED=0

# Function to print test results
print_result() {
    local test_name=$1
    local status=$2
    local response=$3
    
    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}✅ PASS${NC} - $test_name"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC} - $test_name"
        echo -e "${YELLOW}Response: $response${NC}"
        ((FAILED++))
    fi
}

# Function to test API endpoint
test_api() {
    local method=$1
    local endpoint=$2
    local data=$3
    local auth_token=$4
    local expected_status=$5
    
    if [ -n "$auth_token" ]; then
        if [ "$method" = "GET" ]; then
            response=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $auth_token" "$BASE_URL$endpoint")
        elif [ "$method" = "POST" ]; then
            response=$(curl -s -w "\n%{http_code}" -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $auth_token" -d "$data" "$BASE_URL$endpoint")
        elif [ "$method" = "PUT" ]; then
            response=$(curl -s -w "\n%{http_code}" -X PUT -H "Content-Type: application/json" -H "Authorization: Bearer $auth_token" -d "$data" "$BASE_URL$endpoint")
        elif [ "$method" = "DELETE" ]; then
            response=$(curl -s -w "\n%{http_code}" -X DELETE -H "Authorization: Bearer $auth_token" "$BASE_URL$endpoint")
        fi
    else
        if [ "$method" = "GET" ]; then
            response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
        elif [ "$method" = "POST" ]; then
            response=$(curl -s -w "\n%{http_code}" -X POST -H "Content-Type: application/json" -d "$data" "$BASE_URL$endpoint")
        fi
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    echo "$body"
}

echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     X-Clone API Comprehensive Test Suite      ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo ""

# Generate unique test user
TIMESTAMP=$(date +%s)
TEST_EMAIL="testuser${TIMESTAMP}@example.com"
TEST_HANDLE="testuser${TIMESTAMP}"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}1️⃣  AUTHENTICATION ENDPOINTS${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Test 1: Register
echo -e "\n${YELLOW}Testing: POST /api/auth/register${NC}"
REGISTER_RESPONSE=$(test_api "POST" "/api/auth/register" "{\"email\":\"$TEST_EMAIL\",\"password\":\"TestPass123\",\"name\":\"Test User\",\"handle\":\"$TEST_HANDLE\"}" "" "201")

if echo "$REGISTER_RESPONSE" | jq -e '.accessToken' > /dev/null 2>&1; then
    ACCESS_TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.accessToken')
    REFRESH_TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.refreshToken')
    USER_ID=$(echo "$REGISTER_RESPONSE" | jq -r '.user.id')
    print_result "Register New User" "PASS" "$REGISTER_RESPONSE"
else
    print_result "Register New User" "FAIL" "$REGISTER_RESPONSE"
    ACCESS_TOKEN=""
fi

# Test 2: Login
echo -e "\n${YELLOW}Testing: POST /api/auth/login${NC}"
LOGIN_RESPONSE=$(test_api "POST" "/api/auth/login" "{\"email\":\"$TEST_EMAIL\",\"password\":\"TestPass123\"}" "" "200")

if echo "$LOGIN_RESPONSE" | jq -e '.accessToken' > /dev/null 2>&1; then
    print_result "Login" "PASS" "$LOGIN_RESPONSE"
else
    print_result "Login" "FAIL" "$LOGIN_RESPONSE"
fi

# Test 3: Get Current User
echo -e "\n${YELLOW}Testing: GET /api/auth/me${NC}"
ME_RESPONSE=$(test_api "GET" "/api/auth/me" "" "$ACCESS_TOKEN" "200")

if echo "$ME_RESPONSE" | jq -e '.id' > /dev/null 2>&1; then
    print_result "Get Current User" "PASS" "$ME_RESPONSE"
else
    print_result "Get Current User" "FAIL" "$ME_RESPONSE"
fi

# Test 4: Refresh Token
echo -e "\n${YELLOW}Testing: POST /api/auth/refresh${NC}"
REFRESH_RESPONSE=$(test_api "POST" "/api/auth/refresh" "{\"refreshToken\":\"$REFRESH_TOKEN\"}" "" "200")

if echo "$REFRESH_RESPONSE" | jq -e '.accessToken' > /dev/null 2>&1; then
    print_result "Refresh Access Token" "PASS" "$REFRESH_RESPONSE"
else
    print_result "Refresh Access Token" "FAIL" "$REFRESH_RESPONSE"
fi

echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}2️⃣  USER PROFILE ENDPOINTS${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Test 5: Get User Profile
echo -e "\n${YELLOW}Testing: GET /api/users/:userId${NC}"
USER_PROFILE_RESPONSE=$(test_api "GET" "/api/users/$USER_ID" "" "" "200")

if echo "$USER_PROFILE_RESPONSE" | jq -e '.id' > /dev/null 2>&1; then
    print_result "Get User Profile" "PASS" "$USER_PROFILE_RESPONSE"
else
    print_result "Get User Profile" "FAIL" "$USER_PROFILE_RESPONSE"
fi

# Test 6: Update User Profile
echo -e "\n${YELLOW}Testing: PUT /api/users/:userId${NC}"
UPDATE_PROFILE_RESPONSE=$(test_api "PUT" "/api/users/$USER_ID" "{\"name\":\"Updated Name\",\"bio\":\"Test bio\",\"location\":\"Test City\"}" "$ACCESS_TOKEN" "200")

if echo "$UPDATE_PROFILE_RESPONSE" | jq -e '.id' > /dev/null 2>&1; then
    print_result "Update User Profile" "PASS" "$UPDATE_PROFILE_RESPONSE"
else
    print_result "Update User Profile" "FAIL" "$UPDATE_PROFILE_RESPONSE"
fi

# Create second user for follow tests
SECOND_EMAIL="testuser2${TIMESTAMP}@example.com"
SECOND_HANDLE="testuser2${TIMESTAMP}"
SECOND_USER_RESPONSE=$(test_api "POST" "/api/auth/register" "{\"email\":\"$SECOND_EMAIL\",\"password\":\"TestPass123\",\"name\":\"Test User 2\",\"handle\":\"$SECOND_HANDLE\"}" "" "201")
SECOND_USER_ID=$(echo "$SECOND_USER_RESPONSE" | jq -r '.user.id')

# Test 7: Follow User
echo -e "\n${YELLOW}Testing: POST /api/users/:userId/follow${NC}"
FOLLOW_RESPONSE=$(test_api "POST" "/api/users/$SECOND_USER_ID/follow" "" "$ACCESS_TOKEN" "201")

if echo "$FOLLOW_RESPONSE" | jq -e '.id' > /dev/null 2>&1; then
    print_result "Follow User" "PASS" "$FOLLOW_RESPONSE"
else
    print_result "Follow User" "FAIL" "$FOLLOW_RESPONSE"
fi

# Test 8: Get Followers
echo -e "\n${YELLOW}Testing: GET /api/users/:userId/followers${NC}"
FOLLOWERS_RESPONSE=$(test_api "GET" "/api/users/$SECOND_USER_ID/followers?limit=20" "" "" "200")

if echo "$FOLLOWERS_RESPONSE" | jq -e '.followers' > /dev/null 2>&1; then
    print_result "Get Followers" "PASS" "$FOLLOWERS_RESPONSE"
else
    print_result "Get Followers" "FAIL" "$FOLLOWERS_RESPONSE"
fi

# Test 9: Get Following
echo -e "\n${YELLOW}Testing: GET /api/users/:userId/following${NC}"
FOLLOWING_RESPONSE=$(test_api "GET" "/api/users/$USER_ID/following?limit=20" "" "" "200")

if echo "$FOLLOWING_RESPONSE" | jq -e '.following' > /dev/null 2>&1; then
    print_result "Get Following" "PASS" "$FOLLOWING_RESPONSE"
else
    print_result "Get Following" "FAIL" "$FOLLOWING_RESPONSE"
fi

# Test 10: Unfollow User
echo -e "\n${YELLOW}Testing: DELETE /api/users/:userId/follow${NC}"
UNFOLLOW_RESPONSE=$(test_api "DELETE" "/api/users/$SECOND_USER_ID/follow" "" "$ACCESS_TOKEN" "200")

if echo "$UNFOLLOW_RESPONSE" | jq -e '.message' > /dev/null 2>&1; then
    print_result "Unfollow User" "PASS" "$UNFOLLOW_RESPONSE"
else
    print_result "Unfollow User" "FAIL" "$UNFOLLOW_RESPONSE"
fi

echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}3️⃣  POST ENDPOINTS${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Test 11: Create Post
echo -e "\n${YELLOW}Testing: POST /api/posts${NC}"
CREATE_POST_RESPONSE=$(test_api "POST" "/api/posts" "{\"content\":\"Test post from API test suite 🚀\"}" "$ACCESS_TOKEN" "201")

if echo "$CREATE_POST_RESPONSE" | jq -e '.id' > /dev/null 2>&1; then
    POST_ID=$(echo "$CREATE_POST_RESPONSE" | jq -r '.id')
    print_result "Create Post" "PASS" "$CREATE_POST_RESPONSE"
else
    print_result "Create Post" "FAIL" "$CREATE_POST_RESPONSE"
    POST_ID=""
fi

# Test 12: Get Posts (List)
echo -e "\n${YELLOW}Testing: GET /api/posts${NC}"
GET_POSTS_RESPONSE=$(test_api "GET" "/api/posts?limit=20" "" "" "200")

if echo "$GET_POSTS_RESPONSE" | jq -e '.posts' > /dev/null 2>&1; then
    print_result "Get Posts List" "PASS" "$GET_POSTS_RESPONSE"
else
    print_result "Get Posts List" "FAIL" "$GET_POSTS_RESPONSE"
fi

# Test 13: Get Single Post
echo -e "\n${YELLOW}Testing: GET /api/posts/:postId${NC}"
GET_POST_RESPONSE=$(test_api "GET" "/api/posts/$POST_ID" "" "" "200")

if echo "$GET_POST_RESPONSE" | jq -e '.id' > /dev/null 2>&1; then
    print_result "Get Single Post" "PASS" "$GET_POST_RESPONSE"
else
    print_result "Get Single Post" "FAIL" "$GET_POST_RESPONSE"
fi

# Test 14: Like Post
echo -e "\n${YELLOW}Testing: POST /api/posts/:postId/like${NC}"
LIKE_POST_RESPONSE=$(test_api "POST" "/api/posts/$POST_ID/like" "" "$ACCESS_TOKEN" "201")

if echo "$LIKE_POST_RESPONSE" | jq -e '.id' > /dev/null 2>&1; then
    print_result "Like Post" "PASS" "$LIKE_POST_RESPONSE"
else
    print_result "Like Post" "FAIL" "$LIKE_POST_RESPONSE"
fi

# Test 15: Unlike Post
echo -e "\n${YELLOW}Testing: DELETE /api/posts/:postId/like${NC}"
UNLIKE_POST_RESPONSE=$(test_api "DELETE" "/api/posts/$POST_ID/like" "" "$ACCESS_TOKEN" "200")

if echo "$UNLIKE_POST_RESPONSE" | jq -e '.message' > /dev/null 2>&1; then
    print_result "Unlike Post" "PASS" "$UNLIKE_POST_RESPONSE"
else
    print_result "Unlike Post" "FAIL" "$UNLIKE_POST_RESPONSE"
fi

# Test 16: Retweet Post
echo -e "\n${YELLOW}Testing: POST /api/posts/:postId/retweet${NC}"
RETWEET_POST_RESPONSE=$(test_api "POST" "/api/posts/$POST_ID/retweet" "" "$ACCESS_TOKEN" "201")

if echo "$RETWEET_POST_RESPONSE" | jq -e '.id' > /dev/null 2>&1; then
    print_result "Retweet Post" "PASS" "$RETWEET_POST_RESPONSE"
else
    print_result "Retweet Post" "FAIL" "$RETWEET_POST_RESPONSE"
fi

# Test 17: Unretweet Post
echo -e "\n${YELLOW}Testing: DELETE /api/posts/:postId/retweet${NC}"
UNRETWEET_POST_RESPONSE=$(test_api "DELETE" "/api/posts/$POST_ID/retweet" "" "$ACCESS_TOKEN" "200")

if echo "$UNRETWEET_POST_RESPONSE" | jq -e '.message' > /dev/null 2>&1; then
    print_result "Unretweet Post" "PASS" "$UNRETWEET_POST_RESPONSE"
else
    print_result "Unretweet Post" "FAIL" "$UNRETWEET_POST_RESPONSE"
fi

# Test 18: Create Reply
echo -e "\n${YELLOW}Testing: POST /api/posts (Reply)${NC}"
CREATE_REPLY_RESPONSE=$(test_api "POST" "/api/posts" "{\"content\":\"This is a reply\",\"replyToId\":\"$POST_ID\"}" "$ACCESS_TOKEN" "201")

if echo "$CREATE_REPLY_RESPONSE" | jq -e '.id' > /dev/null 2>&1; then
    print_result "Create Reply" "PASS" "$CREATE_REPLY_RESPONSE"
else
    print_result "Create Reply" "FAIL" "$CREATE_REPLY_RESPONSE"
fi

# Test 19: Get Post Replies
echo -e "\n${YELLOW}Testing: GET /api/posts/:postId/replies${NC}"
GET_REPLIES_RESPONSE=$(test_api "GET" "/api/posts/$POST_ID/replies?limit=20" "" "" "200")

if echo "$GET_REPLIES_RESPONSE" | jq -e '.replies' > /dev/null 2>&1; then
    print_result "Get Post Replies" "PASS" "$GET_REPLIES_RESPONSE"
else
    print_result "Get Post Replies" "FAIL" "$GET_REPLIES_RESPONSE"
fi

echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}4️⃣  TIMELINE ENDPOINT${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Test 20: Get Home Timeline
echo -e "\n${YELLOW}Testing: GET /api/timeline/home${NC}"
TIMELINE_RESPONSE=$(test_api "GET" "/api/timeline/home?limit=20" "" "$ACCESS_TOKEN" "200")

if echo "$TIMELINE_RESPONSE" | jq -e '.posts' > /dev/null 2>&1; then
    print_result "Get Home Timeline" "PASS" "$TIMELINE_RESPONSE"
else
    print_result "Get Home Timeline" "FAIL" "$TIMELINE_RESPONSE"
fi

echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}5️⃣  NOTIFICATION ENDPOINTS${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Test 21: Get Notifications
echo -e "\n${YELLOW}Testing: GET /api/notifications${NC}"
NOTIFICATIONS_RESPONSE=$(test_api "GET" "/api/notifications?limit=20" "" "$ACCESS_TOKEN" "200")

if echo "$NOTIFICATIONS_RESPONSE" | jq -e '.notifications' > /dev/null 2>&1; then
    NOTIFICATION_ID=$(echo "$NOTIFICATIONS_RESPONSE" | jq -r '.notifications[0].id // empty')
    print_result "Get Notifications" "PASS" "$NOTIFICATIONS_RESPONSE"
else
    print_result "Get Notifications" "FAIL" "$NOTIFICATIONS_RESPONSE"
fi

# Test 22: Mark Notification as Read (if notification exists)
if [ -n "$NOTIFICATION_ID" ] && [ "$NOTIFICATION_ID" != "null" ]; then
    echo -e "\n${YELLOW}Testing: PUT /api/notifications/:notificationId/read${NC}"
    MARK_READ_RESPONSE=$(test_api "PUT" "/api/notifications/$NOTIFICATION_ID/read" "" "$ACCESS_TOKEN" "200")
    
    if echo "$MARK_READ_RESPONSE" | jq -e '.id' > /dev/null 2>&1; then
        print_result "Mark Notification as Read" "PASS" "$MARK_READ_RESPONSE"
    else
        print_result "Mark Notification as Read" "FAIL" "$MARK_READ_RESPONSE"
    fi
else
    echo -e "\n${YELLOW}Skipping: PUT /api/notifications/:notificationId/read (No notifications available)${NC}"
fi

echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}6️⃣  SEARCH ENDPOINTS${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Test 23: Search Posts
echo -e "\n${YELLOW}Testing: GET /api/search/posts${NC}"
SEARCH_POSTS_RESPONSE=$(test_api "GET" "/api/search/posts?q=test&limit=20" "" "" "200")

if echo "$SEARCH_POSTS_RESPONSE" | jq -e '.posts' > /dev/null 2>&1; then
    print_result "Search Posts" "PASS" "$SEARCH_POSTS_RESPONSE"
else
    print_result "Search Posts" "FAIL" "$SEARCH_POSTS_RESPONSE"
fi

# Test 24: Search Users
echo -e "\n${YELLOW}Testing: GET /api/search/users${NC}"
SEARCH_USERS_RESPONSE=$(test_api "GET" "/api/search/users?q=test&limit=20" "" "" "200")

if echo "$SEARCH_USERS_RESPONSE" | jq -e '.users' > /dev/null 2>&1; then
    print_result "Search Users" "PASS" "$SEARCH_USERS_RESPONSE"
else
    print_result "Search Users" "FAIL" "$SEARCH_USERS_RESPONSE"
fi

echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}7️⃣  CLEANUP - Delete Post${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Test 25: Delete Post
echo -e "\n${YELLOW}Testing: DELETE /api/posts/:postId${NC}"
DELETE_POST_RESPONSE=$(test_api "DELETE" "/api/posts/$POST_ID" "" "$ACCESS_TOKEN" "200")

if echo "$DELETE_POST_RESPONSE" | jq -e '.message' > /dev/null 2>&1; then
    print_result "Delete Post" "PASS" "$DELETE_POST_RESPONSE"
else
    print_result "Delete Post" "FAIL" "$DELETE_POST_RESPONSE"
fi

# Test 26: Logout
echo -e "\n${YELLOW}Testing: POST /api/auth/logout${NC}"
LOGOUT_RESPONSE=$(test_api "POST" "/api/auth/logout" "" "$REFRESH_TOKEN" "200")

if echo "$LOGOUT_RESPONSE" | jq -e '.message' > /dev/null 2>&1; then
    print_result "Logout" "PASS" "$LOGOUT_RESPONSE"
else
    print_result "Logout" "FAIL" "$LOGOUT_RESPONSE"
fi

# Summary
echo -e "\n${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              TEST SUMMARY                      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo -e "${GREEN}✅ Passed: $PASSED${NC}"
echo -e "${RED}❌ Failed: $FAILED${NC}"
TOTAL=$((PASSED + FAILED))
echo -e "${BLUE}📊 Total:  $TOTAL${NC}"

if [ $FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All tests passed! Your API is working perfectly!${NC}"
    exit 0
else
    echo -e "\n${RED}⚠️  Some tests failed. Please check the errors above.${NC}"
    exit 1
fi
