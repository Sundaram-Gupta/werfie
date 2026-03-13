# Werfie API - Swagger Endpoint List & cURL Reference

Base URLs:
- **Client Gateway**: `http://localhost:3001`
- **Messaging**: `http://localhost:3019`
- **Admin**: `http://localhost:3012`

Replace `$TOKEN` with `accessToken` from `/api/auth/login` response. Replace `{id}` with actual IDs.

**Get token:**
```bash
# Login and extract accessToken (PowerShell)
$r = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method POST -Body '{"email":"user1@xclone.com","password":"password123"}' -ContentType "application/json"
$TOKEN = $r.accessToken

# Or with curl + jq
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d '{"email":"user1@xclone.com","password":"password123"}' | jq -r '.accessToken')
```

---

## Auth (no token)
```bash
# Login - save token from response
curl -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d '{"email":"user1@xclone.com","password":"password123"}'

# Register
curl -X POST http://localhost:3001/api/auth/register -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"pass123","name":"Test","handle":"testuser"}'
```

## Auth (with token)
```bash
# Get me
curl -X GET http://localhost:3001/api/auth/me -H "Authorization: Bearer $TOKEN"

# Logout
curl -X POST http://localhost:3001/api/auth/logout -H "Authorization: Bearer $TOKEN"

# Refresh
curl -X POST http://localhost:3001/api/auth/refresh -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"refreshToken":"$REFRESH_TOKEN"}'

# Change password
curl -X POST http://localhost:3001/api/auth/change-password -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"currentPassword":"old","newPassword":"new"}'
```

---

## Users
```bash
curl -X GET http://localhost:3001/api/users/profile -H "Authorization: Bearer $TOKEN"
curl -X GET "http://localhost:3001/api/users/{id}" -H "Authorization: Bearer $TOKEN"
curl -X PUT "http://localhost:3001/api/users/{id}" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"name":"New Name","bio":"Bio"}'
curl -X POST "http://localhost:3001/api/users/{id}/follow" -H "Authorization: Bearer $TOKEN"
curl -X DELETE "http://localhost:3001/api/users/{id}/follow" -H "Authorization: Bearer $TOKEN"
curl -X GET "http://localhost:3001/api/users/{id}/followers?limit=20&offset=0"
curl -X GET "http://localhost:3001/api/users/{id}/following?limit=20&offset=0"
curl -X GET "http://localhost:3001/api/users/search?q=user&limit=20"
curl -X GET "http://localhost:3001/api/users/suggestions?limit=20" -H "Authorization: Bearer $TOKEN"
```

---

## Posts
```bash
curl -X GET "http://localhost:3001/api/posts?limit=20&offset=0" -H "Authorization: Bearer $TOKEN"
curl -X POST http://localhost:3001/api/posts -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"content":"Hello world"}'
curl -X GET "http://localhost:3001/api/posts/{id}" -H "Authorization: Bearer $TOKEN"
curl -X DELETE "http://localhost:3001/api/posts/{id}" -H "Authorization: Bearer $TOKEN"
curl -X POST "http://localhost:3001/api/posts/{id}/like" -H "Authorization: Bearer $TOKEN"
curl -X DELETE "http://localhost:3001/api/posts/{id}/like" -H "Authorization: Bearer $TOKEN"
curl -X POST "http://localhost:3001/api/posts/{id}/retweet" -H "Authorization: Bearer $TOKEN"
curl -X DELETE "http://localhost:3001/api/posts/{id}/retweet" -H "Authorization: Bearer $TOKEN"
curl -X GET "http://localhost:3001/api/posts/{id}/replies?limit=20&offset=0"
curl -X POST "http://localhost:3001/api/posts/{id}/replies" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"content":"Reply text"}'
curl -X POST "http://localhost:3001/api/posts/{id}/bookmark" -H "Authorization: Bearer $TOKEN"
curl -X DELETE "http://localhost:3001/api/posts/{id}/bookmark" -H "Authorization: Bearer $TOKEN"
curl -X GET "http://localhost:3001/api/posts/following?limit=20&offset=0" -H "Authorization: Bearer $TOKEN"
curl -X GET "http://localhost:3001/api/posts/timeline/home?limit=20&cursor=" -H "Authorization: Bearer $TOKEN"
curl -X GET "http://localhost:3001/api/posts/search?q=test&limit=20&offset=0"
curl -X GET http://localhost:3001/api/posts/bookmarks -H "Authorization: Bearer $TOKEN"
```

---

## Timeline & Explore
```bash
curl -X GET "http://localhost:3001/api/timeline/home?limit=20&cursor=" -H "Authorization: Bearer $TOKEN"
curl -X GET "http://localhost:3001/api/trends?limit=20"
curl -X GET "http://localhost:3001/api/explore?category=&limit=20"
curl -X GET http://localhost:3001/api/communities
```

---

## Notifications
```bash
curl -X GET "http://localhost:3001/api/notifications?limit=20&offset=0" -H "Authorization: Bearer $TOKEN"
curl -X PUT "http://localhost:3001/api/notifications/{id}/read" -H "Authorization: Bearer $TOKEN"
curl -X PUT http://localhost:3001/api/notifications/read-all -H "Authorization: Bearer $TOKEN"
```

---

## Spaces
```bash
curl -X GET http://localhost:3001/api/spaces
curl -X POST http://localhost:3001/api/spaces -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"title":"My Space"}'
curl -X POST "http://localhost:3001/api/spaces/{id}/start" -H "Authorization: Bearer $TOKEN"
curl -X POST "http://localhost:3001/api/spaces/{id}/end" -H "Authorization: Bearer $TOKEN"
```

---

## Lists
```bash
curl -X GET http://localhost:3001/api/lists/pinned -H "Authorization: Bearer $TOKEN"
curl -X GET http://localhost:3001/api/lists/discover -H "Authorization: Bearer $TOKEN"
curl -X GET http://localhost:3001/api/lists/yours -H "Authorization: Bearer $TOKEN"
curl -X POST http://localhost:3001/api/lists -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"name":"List1","description":"","isPrivate":false}'
curl -X POST "http://localhost:3001/api/lists/{id}/members" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"userId":"{userId}"}'
curl -X DELETE "http://localhost:3001/api/lists/{id}/members/{userId}" -H "Authorization: Bearer $TOKEN"
curl -X GET "http://localhost:3001/api/lists/membership/{userId}" -H "Authorization: Bearer $TOKEN"
```

---

## Ads
```bash
curl -X GET http://localhost:3001/api/ads/account -H "Authorization: Bearer $TOKEN"
curl -X PUT http://localhost:3001/api/ads/account/billing -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{}'
curl -X GET http://localhost:3001/api/ads/campaigns -H "Authorization: Bearer $TOKEN"
curl -X POST http://localhost:3001/api/ads/campaigns -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"name":"Campaign1","budget":100}'
curl -X POST http://localhost:3001/api/ads/ads -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"campaignId":"x","creativeId":"y"}'
curl -X GET http://localhost:3001/api/ads/creatives -H "Authorization: Bearer $TOKEN"
curl -X GET http://localhost:3001/api/ads/performance -H "Authorization: Bearer $TOKEN"
```

---

## Business
```bash
curl -X GET http://localhost:3001/api/business -H "Authorization: Bearer $TOKEN"
curl -X POST http://localhost:3001/api/business -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"name":"Biz","category":"Tech"}'
curl -X GET http://localhost:3001/api/business/stats -H "Authorization: Bearer $TOKEN"
curl -X POST http://localhost:3001/api/business/boost -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"postId":"{id}"}'
curl -X GET http://localhost:3001/api/business/team -H "Authorization: Bearer $TOKEN"
curl -X POST http://localhost:3001/api/business/team -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"memberId":"{id}","role":"admin"}'
curl -X PATCH "http://localhost:3001/api/business/team/{memberId}" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"role":"editor"}'
curl -X DELETE "http://localhost:3001/api/business/team/{memberId}" -H "Authorization: Bearer $TOKEN"
curl -X POST http://localhost:3001/api/business/verify-domain -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"domain":"example.com"}'
```

---

## Institutional
```bash
curl -X GET http://localhost:3001/api/institutional -H "Authorization: Bearer $TOKEN"
curl -X POST http://localhost:3001/api/institutional -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"name":"Inst","type":"GOV"}'
curl -X POST http://localhost:3001/api/institutional/verify-domain -H "Authorization: Bearer $TOKEN"
curl -X PATCH "http://localhost:3001/api/institutional/admin/review/{id}" -H "Authorization: Bearer $TOKEN"
```

---

## World Leaders
```bash
curl -X GET http://localhost:3001/api/leaders
curl -X POST http://localhost:3001/api/leaders/create -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"name":"Leader","country":"US","role":"President"}'
curl -X GET "http://localhost:3001/api/leaders/{id}"
curl -X PUT "http://localhost:3001/api/leaders/update/{id}" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{}'
curl -X DELETE "http://localhost:3001/api/leaders/{id}" -H "Authorization: Bearer $TOKEN"
```

---

## Announcements
```bash
curl -X POST http://localhost:3001/api/announcements/create -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"leaderId":"{id}","content":"Announcement"}'
curl -X PUT "http://localhost:3001/api/announcements/update/{id}" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{}'
curl -X GET http://localhost:3001/api/announcements/feed
curl -X GET "http://localhost:3001/api/announcements/{id}"
curl -X POST http://localhost:3001/api/announcements/generate-summary -H "Authorization: Bearer $TOKEN"
```

---

## Comments
```bash
curl -X POST http://localhost:3001/api/comments/create -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"announcementId":"{id}","content":"Comment"}'
curl -X GET "http://localhost:3001/api/comments/{announcementId}"
curl -X POST http://localhost:3001/api/comments/report -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"commentId":"{id}","reason":"spam"}'
curl -X GET "http://localhost:3001/api/comments/moderation/queue?status=pending" -H "Authorization: Bearer $TOKEN"
curl -X POST "http://localhost:3001/api/comments/moderation/approve/{queueId}" -H "Authorization: Bearer $TOKEN"
curl -X POST "http://localhost:3001/api/comments/moderation/reject/{queueId}" -H "Authorization: Bearer $TOKEN"
curl -X POST "http://localhost:3001/api/comments/moderation/fact-flag/{commentId}" -H "Authorization: Bearer $TOKEN"
```

---

## Crisis
```bash
curl -X POST http://localhost:3001/api/crisis/create -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{}'
curl -X PUT "http://localhost:3001/api/crisis/update/{id}" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{}'
curl -X GET http://localhost:3001/api/crisis/list
curl -X GET "http://localhost:3001/api/crisis/{id}"
curl -X DELETE "http://localhost:3001/api/crisis/{id}" -H "Authorization: Bearer $TOKEN"
```

---

## Soapbox
```bash
curl -X GET http://localhost:3001/api/soapbox/list
curl -X GET "http://localhost:3001/api/soapbox/{id}"
curl -X POST http://localhost:3001/api/soapbox/create -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{}'
curl -X POST "http://localhost:3001/api/soapbox/{id}/start" -H "Authorization: Bearer $TOKEN"
curl -X POST "http://localhost:3001/api/soapbox/{id}/end" -H "Authorization: Bearer $TOKEN"
curl -X POST "http://localhost:3001/api/soapbox/{id}/statement" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{}'
curl -X POST "http://localhost:3001/api/soapbox/{id}/rebuttal" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{}'
curl -X GET "http://localhost:3001/api/soapbox/{id}/transcript"
```

---

## Debate
```bash
curl -X POST http://localhost:3001/api/debate/create -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{}'
curl -X GET http://localhost:3001/api/debate/list
curl -X GET "http://localhost:3001/api/debate/{id}"
curl -X PUT "http://localhost:3001/api/debate/update/{id}" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{}'
curl -X POST "http://localhost:3001/api/debate/{id}/start-round" -H "Authorization: Bearer $TOKEN"
curl -X POST "http://localhost:3001/api/debate/round/{id}/end" -H "Authorization: Bearer $TOKEN"
curl -X GET "http://localhost:3001/api/debate/{id}/rounds"
curl -X POST "http://localhost:3001/api/debate/round/{id}/argument" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{}'
curl -X POST "http://localhost:3001/api/debate/{id}/vote" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{}'
curl -X GET "http://localhost:3001/api/debate/{id}/results"
curl -X POST http://localhost:3001/api/debate/fact-check -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{}'
```

---

## Messaging (Gateway or direct)
```bash
curl -X GET "http://localhost:3001/api/messages/conversations?limit=20&offset=0" -H "Authorization: Bearer $TOKEN"
curl -X POST http://localhost:3001/api/messages/conversations -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"recipientId":"{id}"}'
curl -X GET "http://localhost:3001/api/messages/conversations/{id}" -H "Authorization: Bearer $TOKEN"
curl -X GET "http://localhost:3001/api/messages/conversations/{id}/messages?limit=50" -H "Authorization: Bearer $TOKEN"
curl -X POST http://localhost:3001/api/messages/send -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"recipientId":"{id}","content":"Hello"}'
```

---

## Monetization
```bash
curl -X GET http://localhost:3001/api/monetization/profile -H "Authorization: Bearer $TOKEN"
curl -X POST http://localhost:3001/api/monetization/apply -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{}'
curl -X POST http://localhost:3001/api/monetization/tiers -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{}'
curl -X GET http://localhost:3001/api/monetization/stats -H "Authorization: Bearer $TOKEN"
curl -X POST http://localhost:3001/api/monetization/subscribe -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"creatorId":"{id}","tierId":"{id}"}'
curl -X GET "http://localhost:3001/api/monetization/transactions?limit=20&offset=0" -H "Authorization: Bearer $TOKEN"
curl -X PUT http://localhost:3001/api/monetization/payout-method -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{}'
```

---

## Moderation
```bash
curl -X POST http://localhost:3001/api/moderation/report -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"contentType":"post","contentId":"{id}","reason":"spam"}'
```

---

## Settings
```bash
curl -X GET http://localhost:3001/api/settings -H "Authorization: Bearer $TOKEN"
curl -X PUT http://localhost:3001/api/settings -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{}'
```

---

## Search
```bash
curl -X GET "http://localhost:3001/api/search/posts?q=test"
curl -X GET "http://localhost:3001/api/users/search?q=user"
```

---

## Media
```bash
curl -X POST http://localhost:3001/api/media/upload -H "Authorization: Bearer $TOKEN" -F "file=@/path/to/image.jpg"
```

---

## Feed
```bash
curl -X GET http://localhost:3001/api/feed/world-leaders
curl -X GET "http://localhost:3001/api/feed/leaders/{id}/posts"
```

---

## Enterprise
```bash
curl -X GET http://localhost:3001/api/enterprise/metrics/overview -H "Authorization: Bearer $TOKEN"
curl -X GET http://localhost:3001/api/enterprise/signals -H "Authorization: Bearer $TOKEN"
curl -X POST http://localhost:3001/api/enterprise/alerts/create -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{}'
curl -X GET http://localhost:3001/api/enterprise/alerts/list -H "Authorization: Bearer $TOKEN"
curl -X GET http://localhost:3001/api/enterprise/export/csv -H "Authorization: Bearer $TOKEN"
curl -X GET http://localhost:3001/api/enterprise/export/json -H "Authorization: Bearer $TOKEN"
```

---

## Admin API (port 3012)
```bash
# Login (no auth)
curl -X POST http://localhost:3012/api/admin/login -H "Content-Type: application/json" -d '{"email":"admin@example.com","password":"admin"}'

curl -X GET http://localhost:3012/api/admin/health
curl -X GET http://localhost:3012/api/admin/dashboard/stats -H "Authorization: Bearer $ADMIN_TOKEN"
curl -X GET http://localhost:3012/api/admin/dashboard/recent-activity -H "Authorization: Bearer $ADMIN_TOKEN"
curl -X GET http://localhost:3012/api/admin/dashboard/getting-started-status -H "Authorization: Bearer $ADMIN_TOKEN"
curl -X GET http://localhost:3012/api/admin/users -H "Authorization: Bearer $ADMIN_TOKEN"
curl -X GET "http://localhost:3012/api/admin/users/{id}" -H "Authorization: Bearer $ADMIN_TOKEN"
curl -X PUT "http://localhost:3012/api/admin/users/{id}" -H "Content-Type: application/json" -H "Authorization: Bearer $ADMIN_TOKEN" -d '{}'
curl -X PATCH "http://localhost:3012/api/admin/users/{id}/status" -H "Authorization: Bearer $ADMIN_TOKEN"
curl -X PATCH "http://localhost:3012/api/admin/users/{id}/role" -H "Authorization: Bearer $ADMIN_TOKEN"
curl -X PATCH "http://localhost:3012/api/admin/users/{id}/verification" -H "Authorization: Bearer $ADMIN_TOKEN"
curl -X GET http://localhost:3012/api/admin/posts -H "Authorization: Bearer $ADMIN_TOKEN"
curl -X GET http://localhost:3012/api/admin/reports -H "Authorization: Bearer $ADMIN_TOKEN"
curl -X GET "http://localhost:3012/api/admin/reports/{id}" -H "Authorization: Bearer $ADMIN_TOKEN"
curl -X PATCH "http://localhost:3012/api/admin/reports/{id}" -H "Authorization: Bearer $ADMIN_TOKEN"
curl -X GET http://localhost:3012/api/admin/institutional -H "Authorization: Bearer $ADMIN_TOKEN"
curl -X GET "http://localhost:3012/api/admin/institutional/{id}" -H "Authorization: Bearer $ADMIN_TOKEN"
curl -X PATCH "http://localhost:3012/api/admin/institutional/{id}" -H "Authorization: Bearer $ADMIN_TOKEN"
curl -X GET http://localhost:3012/api/admin/business -H "Authorization: Bearer $ADMIN_TOKEN"
curl -X GET http://localhost:3012/api/admin/ads -H "Authorization: Bearer $ADMIN_TOKEN"
curl -X GET http://localhost:3012/api/admin/monetization -H "Authorization: Bearer $ADMIN_TOKEN"
curl -X POST http://localhost:3012/api/admin/notifications/broadcast -H "Content-Type: application/json" -H "Authorization: Bearer $ADMIN_TOKEN" -d '{}'
curl -X GET http://localhost:3012/api/admin/config/api-keys -H "Authorization: Bearer $ADMIN_TOKEN"
curl -X POST http://localhost:3012/api/admin/config/api-keys -H "Authorization: Bearer $ADMIN_TOKEN"
curl -X DELETE "http://localhost:3012/api/admin/config/api-keys/{id}" -H "Authorization: Bearer $ADMIN_TOKEN"
curl -X GET http://localhost:3012/api/admin/config/push -H "Authorization: Bearer $ADMIN_TOKEN"
curl -X PUT http://localhost:3012/api/admin/config/push -H "Authorization: Bearer $ADMIN_TOKEN"
curl -X GET http://localhost:3012/api/admin/config/push/templates -H "Authorization: Bearer $ADMIN_TOKEN"
curl -X POST http://localhost:3012/api/admin/config/push/templates -H "Authorization: Bearer $ADMIN_TOKEN"
curl -X GET http://localhost:3012/api/docs
```
