#!/bin/bash

# X-Clone API Test Script
# This script tests all major API endpoints

set -e  # Exit on error

BASE_URL="http://localhost:3001/api"
TEST_EMAIL="apitest_$(date +%s)@example.com"
TEST_PASSWORD="test12345"  # Must be at least 8 characters

echo "╔════════════════════════════════════════╗"
echo "║   X-Clone API Integration Test         ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Register a new user
echo -e "${BLUE}[1/10] Registering User...${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\",
    \"name\": \"API Test User\",
    \"handle\": \"apitest_$(date +%s)\"
  }")

if echo "$REGISTER_RESPONSE" | jq -e '.accessToken' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ User registered successfully${NC}"
    TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.accessToken')
    USER_ID=$(echo $REGISTER_RESPONSE | jq -r '.user.id')
    echo "  User ID: $USER_ID"
else
    echo -e "${RED}✗ Registration failed${NC}"
    echo "$REGISTER_RESPONSE" | jq '.'
    exit 1
fi

# 2. Login with the same user
echo -e "\n${BLUE}[2/10] Testing Login...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\"
  }")

if echo "$LOGIN_RESPONSE" | jq -e '.accessToken' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Login successful${NC}"
else
    echo -e "${RED}✗ Login failed${NC}"
    echo "$LOGIN_RESPONSE" | jq '.'
    exit 1
fi

# 3. Get current user
echo -e "\n${BLUE}[3/10] Getting Current User...${NC}"
ME_RESPONSE=$(curl -s -X GET "$BASE_URL/auth/me" \
  -H "Authorization: Bearer $TOKEN")

if echo "$ME_RESPONSE" | jq -e '.id' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Current user retrieved${NC}"
    echo "  Name: $(echo $ME_RESPONSE | jq -r '.profile.name // .name')"
else
    echo -e "${RED}✗ Failed to get current user${NC}"
    echo "$ME_RESPONSE" | jq '.'
    exit 1
fi

# 4. Update profile
echo -e "\n${BLUE}[4/10] Updating Profile...${NC}"
PROFILE_RESPONSE=$(curl -s -X PUT "$BASE_URL/users/$USER_ID/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "API Test User Updated",
    "bio": "Testing the X-Clone API 🚀",
    "location": "API Land",
    "website": "example.com"
  }')

if echo "$PROFILE_RESPONSE" | jq -e '.name' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Profile updated${NC}"
    echo "  New name: $(echo $PROFILE_RESPONSE | jq -r '.name')"
    echo "  Bio: $(echo $PROFILE_RESPONSE | jq -r '.bio')"
else
    echo -e "${RED}✗ Profile update failed${NC}"
    echo "$PROFILE_RESPONSE" | jq '.'
    exit 1
fi

# 5. Get user profile
echo -e "\n${BLUE}[5/10] Getting User Profile...${NC}"
USER_RESPONSE=$(curl -s -X GET "$BASE_URL/users/$USER_ID/" \
  -H "Authorization: Bearer $TOKEN")

if echo "$USER_RESPONSE" | jq -e '.id' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ User profile retrieved${NC}"
else
    echo -e "${RED}✗ Failed to get user profile${NC}"
    echo "$USER_RESPONSE" | jq '.'
    exit 1
fi

# 6. Create a post
echo -e "\n${BLUE}[6/10] Creating Post...${NC}"
POST_RESPONSE=$(curl -s -X POST "$BASE_URL/posts/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Hello from the API test script! 🚀 #testing"
  }')

if echo "$POST_RESPONSE" | jq -e '.id' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Post created${NC}"
    POST_ID=$(echo $POST_RESPONSE | jq -r '.id')
    echo "  Post ID: $POST_ID"
    echo "  Content: $(echo $POST_RESPONSE | jq -r '.content')"
else
    echo -e "${RED}✗ Post creation failed${NC}"
    echo "$POST_RESPONSE" | jq '.'
    exit 1
fi

# 7. Get all posts
echo -e "\n${BLUE}[7/10] Getting All Posts...${NC}"
POSTS_RESPONSE=$(curl -s -X GET "$BASE_URL/posts/" \
  -H "Authorization: Bearer $TOKEN")

if echo "$POSTS_RESPONSE" | jq -e '.posts' > /dev/null 2>&1; then
    POST_COUNT=$(echo $POSTS_RESPONSE | jq '.posts | length')
    echo -e "${GREEN}✓ Posts retrieved${NC}"
    echo "  Total posts: $POST_COUNT"
else
    echo -e "${RED}✗ Failed to get posts${NC}"
    echo "$POSTS_RESPONSE" | jq '.'
    exit 1
fi

# 8. Like the post
echo -e "\n${BLUE}[8/10] Liking Post...${NC}"
LIKE_RESPONSE=$(curl -s -X POST "$BASE_URL/posts/$POST_ID/like" \
  -H "Authorization: Bearer $TOKEN")

if echo "$LIKE_RESPONSE" | jq -e '.id' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Post liked${NC}"
else
    echo -e "${RED}✗ Like failed${NC}"
    echo "$LIKE_RESPONSE" | jq '.'
    exit 1
fi

# 9. Retweet the post
echo -e "\n${BLUE}[9/10] Retweeting Post...${NC}"
RETWEET_RESPONSE=$(curl -s -X POST "$BASE_URL/posts/$POST_ID/retweet" \
  -H "Authorization: Bearer $TOKEN")

if echo "$RETWEET_RESPONSE" | jq -e '.id' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Post retweeted${NC}"
else
    echo -e "${RED}✗ Retweet failed${NC}"
    echo "$RETWEET_RESPONSE" | jq '.'
    exit 1
fi

# 10. Get timeline
echo -e "\n${BLUE}[10/10] Getting Timeline...${NC}"
TIMELINE_RESPONSE=$(curl -s -X GET "$BASE_URL/timeline/home" \
  -H "Authorization: Bearer $TOKEN")

if echo "$TIMELINE_RESPONSE" | jq -e '.[0].id' > /dev/null 2>&1; then
    TIMELINE_COUNT=$(echo $TIMELINE_RESPONSE | jq '. | length')
    echo -e "${GREEN}✓ Timeline retrieved${NC}"
    echo "  Timeline posts: $TIMELINE_COUNT"
else
    echo -e "${RED}✗ Failed to get timeline${NC}"
    echo "$TIMELINE_RESPONSE" | jq '.'
    exit 1
fi

# Summary
echo ""
echo "╔════════════════════════════════════════╗"
echo "║   ${GREEN}All Tests Passed! ✓${NC}                 ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo "Test User Details:"
echo "  Email: $TEST_EMAIL"
echo "  User ID: $USER_ID"
echo "  Token: ${TOKEN:0:20}..."
echo ""
echo "Created Resources:"
echo "  Posts: 1"
echo "  Likes: 1"
echo "  Retweets: 1"
echo ""
