#!/bin/bash
# Werfie API Test - Uses curl (Linux/Mac/Git Bash)
# Run: chmod +x test_apis_curl.sh && ./test_apis_curl.sh

BASE="http://localhost:3001"
PASSED=0
FAILED=0

echo ""
echo "=== Werfie API Test (curl) ==="
echo ""

# 1. Login
echo "1. Login..."
LOGIN_RESP=$(curl -s -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"apitest@example.com","password":"password123"}')
TOKEN=$(echo "$LOGIN_RESP" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
if [ -z "$TOKEN" ]; then
  TOKEN=$(echo "$LOGIN_RESP" | jq -r '.data.accessToken // .accessToken // empty' 2>/dev/null)
fi
if [ -n "$TOKEN" ]; then
  echo "  [PASS] Got token"
else
  echo "  [FAIL] Could not get token. Register: curl -X POST $BASE/api/auth/register -H 'Content-Type: application/json' -d '{\"email\":\"apitest@example.com\",\"password\":\"password123\",\"name\":\"API Test\",\"handle\":\"apitest\"}'"
fi

# 2. Test function
test_api() {
  local name=$1 method=$2 url=$3 body=$4
  local code
  if [ "$method" = "GET" ]; then
    if [ -n "$TOKEN" ] && [[ "$url" != *"/api/health"* ]] && [[ "$url" != *"/api/users/search"* ]] && [[ "$url" != *"/api/users/suggestions"* ]]; then
      code=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$url" -H "Authorization: Bearer $TOKEN")
    else
      code=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$url")
    fi
  else
    code=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$url" -H "Content-Type: application/json" ${body:+-d "$body"})
  fi
  if [ "$code" -ge 200 ] && [ "$code" -lt 300 ]; then
    ((PASSED++))
    echo "  [PASS] $method $url -> $code"
  else
    ((FAILED++))
    echo "  [FAIL] $method $url -> $code"
  fi
}

echo ""
echo "2. Auth..."
test_api "Health" "GET" "$BASE/api/health"
test_api "Login" "POST" "$BASE/api/auth/login" '{"email":"apitest@example.com","password":"password123"}'

echo ""
echo "3. Users..."
test_api "Search" "GET" "$BASE/api/users/search?q=user&limit=5"
test_api "Suggestions" "GET" "$BASE/api/users/suggestions?limit=5"

echo ""
echo "4. Content..."
test_api "Explore" "GET" "$BASE/api/explore?limit=5"
test_api "Communities" "GET" "$BASE/api/communities"
test_api "Trends" "GET" "$BASE/api/trends?limit=5"
test_api "Leaders" "GET" "$BASE/api/leaders"
test_api "Announcements" "GET" "$BASE/api/announcements/feed"

echo ""
echo "5. Health checks..."
test_api "User service" "GET" "http://localhost:3002/health"
test_api "Content service" "GET" "http://localhost:3003/health"

echo ""
echo "=== Summary ==="
echo "Passed: $PASSED | Failed: $FAILED | Total: $((PASSED+FAILED))"
