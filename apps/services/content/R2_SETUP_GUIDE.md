# Cloudflare R2 Setup Guide

## Prerequisites
- Cloudflare account
- Access to Cloudflare Dashboard
- Werfie application codebase

## Step 1: Create R2 Bucket

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **R2 Object Storage** in the sidebar
3. Click **Create bucket**
4. Enter bucket name: `werfie-media`
5. Select region: **Automatic** (Cloudflare handles this)
6. Click **Create bucket**

## Step 2: Generate API Credentials

1. In R2 dashboard, click **Manage R2 API Tokens**
2. Click **Create API Token**
3. Configure token:
   - **Token name**: `werfie-media-upload`
   - **Permissions**: Object Read & Write
   - **Bucket scope**: Select `werfie-media` only
   - **TTL**: Never expire (or set custom expiry)
4. Click **Create API Token**
5. **IMPORTANT**: Copy and save:
   - Access Key ID
   - Secret Access Key
   - Account ID

> [!WARNING]
> Save these credentials immediately! The Secret Access Key will only be shown once.

## Step 3: Configure Public Access

### Option A: Public Bucket (Recommended for Development)

1. Go to your bucket settings
2. Enable **Public Access**
3. Note the public URL format: `https://<account-id>.r2.cloudflarestorage.com/werfie-media`

### Option B: Custom Domain (Recommended for Production)

1. In bucket settings, click **Connect Domain**
2. Enter your custom domain (e.g., `media.werfie.ai`)
3. Follow DNS configuration instructions
4. Wait for DNS propagation
5. Public URL: `https://media.werfie.ai`

## Step 4: Update Environment Variables

1. Navigate to `apps/services/content/`
2. Copy `.env.r2.example` to `.env` (or add to existing `.env`)
3. Update with your R2 credentials:

```env
# Cloudflare R2 Configuration
USE_R2_STORAGE=true
R2_ENDPOINT=https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your_access_key_id
R2_SECRET_ACCESS_KEY=your_secret_access_key
R2_BUCKET_NAME=omretesting
R2_FOLDER=werfrie
R2_PUBLIC_URL=https://pub-xxxx.r2.dev
```

Flow: **Sharp** (images) / **FFmpeg** (video, audio) compress first, then upload to R2 at `werfrie/images/`, `werfrie/videos/`, etc.

## Step 5: Test R2 Connection

Run the test script to verify R2 configuration:

```bash
cd apps/services/content
node scripts/test-r2-connection.js
```

Expected output:
```
✅ R2 client initialized
✅ Test upload successful
✅ Test file accessible at: https://...
```

## Step 6: Restart Services

```bash
# Restart content-service
npx pm2 restart content-service

# Or if running manually:
cd apps/services/content
npm run dev
```

## Step 7: Test Upload

1. Open Werfie application
2. Create a new post with an image or video
3. Check server logs for R2 upload confirmation:
   ```
   [R2] Uploaded: images/abc-123.webp
   ```
4. Verify media displays in feed

## Troubleshooting

### Error: "R2 client not initialized"
- Check environment variables are set correctly
- Ensure `USE_R2_STORAGE=true`
- Restart the service

### Error: "Failed to upload to R2"
- Verify API credentials are correct
- Check bucket name matches
- Ensure API token has write permissions

### Error: "Access Denied"
- Verify API token scope includes the bucket
- Check public access is enabled
- Verify CORS configuration if using custom domain

### Media not displaying
- Check browser console for CORS errors
- Verify R2_PUBLIC_URL is correct
- Test URL directly in browser

## Migration (Optional)

To migrate existing local media to R2:

```bash
cd apps/services/content

# Dry run (no changes)
DRY_RUN=true node scripts/migrate-to-r2.js

# Execute migration
node scripts/migrate-to-r2.js

# Execute migration and delete local files
DELETE_LOCAL=true node scripts/migrate-to-r2.js
```

## Security Best Practices

✅ **DO:**
- Use API tokens with minimal required permissions
- Scope tokens to specific buckets only
- Enable public read, disable public write
- Use HTTPS for all media URLs
- Rotate API tokens periodically

❌ **DON'T:**
- Commit credentials to version control
- Use admin-level API tokens
- Enable public write access
- Share API tokens across environments

## Cost Monitoring

Monitor R2 usage in Cloudflare Dashboard:
- Storage: GB/month
- Class A operations (writes)
- Class B operations (reads)

**No egress fees!** This is R2's main advantage over S3.

## Next Steps

1. ✅ Complete R2 setup
2. ✅ Test uploads
3. 🔄 Migrate existing media (optional)
4. 🚀 Deploy to production
