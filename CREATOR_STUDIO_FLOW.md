# Creator Studio - End-to-End Flow

This document describes the Creator Studio flow implemented in Werfie, aligned with X (Twitter) platform behavior.

---

## 1. Creator Opens Creator Studio

**Flow:** User logs in → clicks Creator Studio (More menu) → Dashboard loads.

**Internal:**
- Frontend: `GET /api/creator-studio/stats` (analytics service)
- Backend: Verifies Bearer token, returns stats (followers, views, engagement, earnings)
- Dashboard shows metrics + links to Analytics, Media Studio, Scheduled Posts, Audience Insights

**Pages:** `/creator-studio`, `/analytics`, `/media/library`, `/scheduled-posts`, `/audience-insights`

---

## 2. Create Post / Upload Media

**Flow:** User writes text, adds media (image/video), optional location/tags/poll/schedule.

**Backend:**
- `POST /api/media/upload` – standalone upload (Sharp/FFmpeg, R2 or local)
- `POST /api/posts` – create post (FormData with content, media files, optional `scheduledAt`)

**Media processing:**
- Sharp → image resize + WebP
- FFmpeg → video compression + thumbnail
- Storage: R2 (if configured) or local `/uploads`

---

## 3. Media Processing Pipeline

```
Upload → Validation → Compression/Resize → Thumbnail (video) → Storage
```

- **Validation:** File type, size (100MB max)
- **Compression:** Sharp (images), FFmpeg (video/audio)
- **Storage:** R2 or local `uploads/` dir

---

## 4. Post Scheduling

**Flow:** User selects date/time → API saves post with `scheduledAt`.

**Backend:** `POST /api/posts` with `scheduledAt` (ISO string).

**Scheduler:** `scheduledPostPublisher.js` runs every 15s:
1. Finds posts where `scheduledAt <= now`
2. Sets `scheduledAt = null`
3. Emits Kafka `POST_CREATED`
4. Broadcasts WebSocket `feed-update`

---

## 5. Post Queue & Publishing

**Implementation:** Polling (no external message queue for MVP). The content service polls the DB every 15s and publishes due posts. Can be extended to Kafka/Redis for higher scale.

---

## 6. Timeline Distribution

**Flow:** After publish:
- Post appears in home timeline (`GET /api/posts/timeline/home`)
- Kafka event triggers timeline service (if enabled)
- WebSocket `feed-update` triggers client refresh

---

## 7. Media Library

**Flow:** Media Studio shows media from user’s posts.

**API:** `GET /api/media/library` – returns `PostMedia` for current user’s posts.

**Upload:** `POST /api/media/upload` – processes file and returns URL. Use when creating a post.

---

## 8. Analytics & Insights

**API:** `GET /api/creator-studio/stats` – aggregates real data from content & user services:
- **Total Posts** – from `GET /api/posts/count` (content service)
- **Followers** – from `GET /api/users/:id/followers-count` (user service)
- Views, engagement, earnings – mock for MVP

**Future:** Event logging → stream processing → analytics DB.

---

## API Endpoints Summary

| Endpoint | Purpose |
|----------|---------|
| `GET /api/creator-studio/stats` | Creator dashboard metrics (aggregates post count, followers) |
| `GET /api/posts/count` | Post count for current user (internal) |
| `GET /api/users/:id/followers-count` | Follower count for user |
| `GET /api/media/library` | User's media from posts |
| `POST /api/media/upload` | Upload & process media |
| `GET /api/posts/scheduled` | List scheduled posts |
| `POST /api/posts` | Create post (immediate or scheduled) |
| `GET /api/posts/timeline/home` | Home feed |

---

## Services

- **Gateway (3001):** Routes, auth, proxies
- **Content (3003):** Posts, media, scheduled publisher
- **Analytics (3009):** Creator stats
- **Client (5173):** Creator Studio UI
