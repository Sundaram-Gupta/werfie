# Werfie API Test Report
Generated: 2026-03-12T04:50:47.837Z

## Summary
| Metric | Count |
|--------|-------|
| **Total** | 46 |
| **Passed** | 46 |
| **Failed** | 0 |
| **Success Rate** | 100.0% |

## Errored APIs
_No errors._

## All Results
| Name | Method | URL | Status | Result |
|------|--------|-----|--------|--------|
| Auth /me | GET | /api/auth/me | 200 | ✅ |
| Auth /health | GET | /api/health | 200 | ✅ |
| Auth /trends | GET | /api/trends?limit=5 | 200 | ✅ |
| Users profile | GET | /api/users/profile | 200 | ✅ |
| Users get | GET | /api/users/eea716db-bca5-4531-b035-8e7b6185ddd1 | 200 | ✅ |
| Users search | GET | /api/users/search?q=user&limit=5 | 200 | ✅ |
| Users suggestions | GET | /api/users/suggestions?limit=5 | 200 | ✅ |
| Posts feed | GET | /api/posts?limit=5 | 200 | ✅ |
| Posts timeline home | GET | /api/posts/timeline/home?limit=5 | 200 | ✅ |
| Posts following | GET | /api/posts/following?limit=5 | 200 | ✅ |
| Posts bookmarks | GET | /api/posts/bookmarks | 200 | ✅ |
| Posts search | GET | /api/posts/search?q=test&limit=5 | 200 | ✅ |
| Explore | GET | /api/explore?limit=5 | 200 | ✅ |
| Communities | GET | /api/communities | 200 | ✅ |
| Notifications | GET | /api/notifications?limit=5 | 200 | ✅ |
| Spaces list | GET | /api/spaces | 200 | ✅ |
| Lists pinned | GET | /api/lists/pinned | 200 | ✅ |
| Lists discover | GET | /api/lists/discover | 200 | ✅ |
| Ads account | GET | /api/ads/account | 200 | ✅ |
| Ads campaigns | GET | /api/ads/campaigns | 200 | ✅ |
| Business | GET | /api/business | 200 | ✅ |
| Institutional | GET | /api/institutional | 200 | ✅ |
| Leaders list | GET | /api/leaders | 200 | ✅ |
| Announcements feed | GET | /api/announcements/feed | 200 | ✅ |
| Messaging conversations | GET | /api/messages/conversations?limit=5 | 200 | ✅ |
| Messaging health | GET | /api/messages/health | 200 | ✅ |
| Monetization profile | GET | /api/monetization/profile | 200 | ✅ |
| Monetization stats | GET | /api/monetization/stats | 200 | ✅ |
| Moderation report | POST | /api/moderation/report | 200 | ✅ |
| Settings | GET | /api/settings | 200 | ✅ |
| Settings health | GET | /api/settings/health | 200 | ✅ |
| Search posts | GET | /api/search/posts?q=test | 200 | ✅ |
| Search health | GET | /api/search/health | 200 | ✅ |
| Feed world-leaders | GET | /api/feed/world-leaders | 200 | ✅ |
| Enterprise metrics | GET | /api/enterprise/metrics/overview | 200 | ✅ |
| Enterprise signals | GET | /api/enterprise/signals | 200 | ✅ |
| Admin health | GET | /api/admin/health | 200 | ✅ |
| Admin login | POST | /api/admin/login | 200 | ✅ |
| Admin dashboard stats | GET | /api/admin/dashboard/stats | 200 | ✅ |
| Admin users | GET | /api/admin/users | 200 | ✅ |
| Admin reports | GET | /api/admin/reports | 200 | ✅ |
| Admin docs | GET | /api/docs | 200 | ✅ |
| User service health | GET | http://localhost:3002/health | 200 | ✅ |
| Content service health | GET | http://localhost:3003/health | 200 | ✅ |
| Moderation health | GET | /api/moderation/health | 200 | ✅ |
| Monetization health | GET | /api/monetization/health | 200 | ✅ |
