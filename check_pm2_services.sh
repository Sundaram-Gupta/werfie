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


echo "Checking Auth Service (3012) (http://localhost:3012/api/health)..."
status_code=$(curl --write-out %{http_code} --silent --output /dev/null http://localhost:3012/api/health)
if [[ "$status_code" -eq 200 ]] ; then
    echo "✅ Auth Service (3012) is UP (200)"
else
    echo "❌ Auth Service (3012) is DOWN or reachable but returned $status_code"
    curl -I http://localhost:3012/api/health
    curl http://localhost:3012/api/health
fi
echo "----------------------------------------"

# User Service (Express)
check_url "http://localhost:3002/health" "User Service (3002)"

# Content Service (Express)
check_url "http://localhost:3003/health" "Content Service (3003)"

# Timeline Service (Next.js)
check_url "http://localhost:3004/api/timeline/health" "Timeline Service (3004)"
check_url "http://localhost:3004/health" "Timeline Service (3004 /health)"

# Notification Service (Next.js)
check_url "http://localhost:3005/api/notifications/health" "Notification Service (3005)"
check_url "http://localhost:3005/health" "Notification Service (3005 /health)"

# Search Service (Next.js)
check_url "http://localhost:3006/api/search/health" "Search Service (3006)"
check_url "http://localhost:3006/health" "Search Service (3006 /health)"

# Messaging Service (Next.js)
check_url "http://localhost:3007/api/messages/health" "Messaging Service (3007)"
check_url "http://localhost:3007/health" "Messaging Service (3007 /health)"

# Media Service (Express)
check_url "http://localhost:3008/health" "Media Service (3008)"

# Analytics Service (Next.js)
check_url "http://localhost:3009/api/analytics/health" "Analytics Service (3009)"
check_url "http://localhost:3009/health" "Analytics Service (3009 /health)"

# Moderation Service (Next.js)
check_url "http://localhost:3010/api/moderation/health" "Moderation Service (3010)"
check_url "http://localhost:3010/health" "Moderation Service (3010 /health)"

# Settings Service (Next.js)
check_url "http://localhost:3011/api/settings/health" "Settings Service (3011)"
check_url "http://localhost:3011/health" "Settings Service (3011 /health)"
