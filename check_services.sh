#!/bin/bash

# Function to check a URL
check_url() {
    url=$1
    name=$2
    echo "Checking $name ($url)..."
    response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 2 "$url")
    if [ "$response" == "200" ]; then
        echo "✅ $name is UP (200)"
    else
        echo "❌ $name is DOWN or reachable but returned $response"
        # Try to get body if not 200, to see error
        curl -s --max-time 2 "$url" | head -c 100
        echo ""
    fi
    echo "----------------------------------------"
}

echo "=== CHECKING GATEWAY ROUTES (localhost:3001) ==="
check_url "http://localhost:3001/api/users/health" "Gateway -> User Service"
check_url "http://localhost:3001/api/posts/health" "Gateway -> Content Service"
check_url "http://localhost:3001/api/timeline/health" "Gateway -> Timeline Service"
check_url "http://localhost:3001/api/notifications/health" "Gateway -> Notification Service"
check_url "http://localhost:3001/api/search/health" "Gateway -> Search Service"
check_url "http://localhost:3001/api/messages/health" "Gateway -> Messaging Service"
check_url "http://localhost:3001/api/media/health" "Gateway -> Media Service"
check_url "http://localhost:3001/api/analytics/health" "Gateway -> Analytics Service"
check_url "http://localhost:3001/api/moderation/health" "Gateway -> Moderation Service"
check_url "http://localhost:3001/api/settings/health" "Gateway -> Settings Service"
check_url "http://localhost:3001/api/auth/health" "Gateway -> Auth Service"

echo ""
echo "=== CHECKING DIRECT SERVICE PORTS (localhost:PORT) ==="
# User Service (Express)
check_url "http://localhost:3002/health" "User Service (Direct: 3002)"

# Content Service (Express assumed)
check_url "http://localhost:3003/health" "Content Service (Direct: 3003)"

# Timeline Service (Next.js - likely /api/timeline/health)
check_url "http://localhost:3004/api/timeline/health" "Timeline Service (Direct: 3004 /api/timeline/health)"
check_url "http://localhost:3004/health" "Timeline Service (Direct: 3004 /health)"

# Notification Service (Next.js)
check_url "http://localhost:3005/api/notifications/health" "Notification Service (Direct: 3005 /api/notifications/health)"
check_url "http://localhost:3005/health" "Notification Service (Direct: 3005 /health)"

# Search Service (Next.js)
check_url "http://localhost:3006/api/search/health" "Search Service (Direct: 3006 /api/search/health)"
check_url "http://localhost:3006/health" "Search Service (Direct: 3006 /health)"

# Messaging Service (Next.js)
check_url "http://localhost:3007/api/messages/health" "Messaging Service (Direct: 3007 /api/messages/health)"
check_url "http://localhost:3007/health" "Messaging Service (Direct: 3007 /health)"

# Media Service (Express)
check_url "http://localhost:3008/health" "Media Service (Direct: 3008 /health)"
# OR if it mimics the nextjs path structure:
check_url "http://localhost:3008/api/media/health" "Media Service (Direct: 3008 /api/media/health)"

# Analytics Service (Next.js)
check_url "http://localhost:3009/api/analytics/health" "Analytics Service (Direct: 3009 /api/analytics/health)"
check_url "http://localhost:3009/health" "Analytics Service (Direct: 3009 /health)"

# Moderation Service (Next.js)
check_url "http://localhost:3010/api/moderation/health" "Moderation Service (Direct: 3010 /api/moderation/health)"
check_url "http://localhost:3010/health" "Moderation Service (Direct: 3010 /health)"

# Settings Service (Next.js)
check_url "http://localhost:3011/api/settings/health" "Settings Service (Direct: 3011 /api/settings/health)"
check_url "http://localhost:3011/health" "Settings Service (Direct: 3011 /health)"
