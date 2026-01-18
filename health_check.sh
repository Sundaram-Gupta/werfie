#!/bin/bash

echo "🏥 Starting Comprehensive Health Check..."
echo "========================================"

check_service() {
    NAME=$1
    URL=$2
    # Accept 200, 401 (Auth), 404 (Next.js Default Page), 405 (Method Not Allowed)
    EXPECTED_CODES=("200" "401" "404" "405")
    
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -L "$URL")
    
    # Check if HTTP_CODE is in EXPECTED_CODES array
    MATCH=0
    for code in "${EXPECTED_CODES[@]}"; do
        if [[ "$HTTP_CODE" == "$code" ]]; then
            MATCH=1
            break
        fi
    done

    if [[ "$MATCH" == "1" ]]; then
        echo "✅ $NAME: UP (Status: $HTTP_CODE)"
    else
        echo "❌ $NAME: DOWN (Status: $HTTP_CODE)"
    fi
}

# 1. Gateway
check_service "Gateway" "http://localhost:3001/"

# 2. Auth Service
check_service "Auth Service" "http://localhost:3001/api/auth/login"

# 3. User Service
check_service "User Service" "http://localhost:3001/api/users/profile"

# 4. Content Service
check_service "Content Service" "http://localhost:3001/api/posts/"

# 5. Timeline Service
check_service "Timeline Service" "http://localhost:3001/api/timeline/home"

# 6. Notification Service
check_service "Notification Service" "http://localhost:3001/api/notifications/health"

# 7. Search Service
check_service "Search Service" "http://localhost:3001/api/search/health"

# 8. Messaging Service
check_service "Messaging Service" "http://localhost:3001/api/messages/health"

# 9. Media Service
check_service "Media Service" "http://localhost:3001/api/media/health"

# 10. Analytics Service
check_service "Analytics Service" "http://localhost:3001/api/analytics/health"

# 11. Moderation Service
check_service "Moderation Service" "http://localhost:3001/api/moderation/health"

# 12. Settings Service
check_service "Settings Service" "http://localhost:3001/api/settings/health"

echo "========================================"
echo "Report Complete."
