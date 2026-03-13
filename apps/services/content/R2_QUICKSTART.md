# Cloudflare R2 Quick Start (bucket: omretesting, folder: werfrie)

## Flow
1. **Images** → Sharp (resize 1080px, WebP 80%) → `werfrie/images/`
2. **Videos** → FFmpeg (720p, h264) → `werfrie/videos/`, thumbnails → `werfrie/thumbnails/`
3. **Audio** → FFmpeg (MP3) → `werfrie/audio/`
4. **Other files** → raw upload → `werfrie/files/`

## Setup
Add to `apps/services/content/.env` (create from `.env.r2.example`):

```env
USE_R2_STORAGE=true
R2_ENDPOINT=https://5e18d1540fcbabb54558d35f39133ab5.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=<your-access-key-id>
R2_SECRET_ACCESS_KEY=<your-secret-access-key>
R2_BUCKET_NAME=omretesting
R2_FOLDER=werfrie
R2_PUBLIC_URL=https://pub-2358eaa2410b49978f2040fef6f8f1af.r2.dev
```

⚠️ **Never commit `.env`** – add it to `.gitignore`.

## Test
```bash
cd apps/services/content
node scripts/test-r2-connection.js
```
