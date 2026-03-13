# How to Upload Videos in Werfie

## Quick Start

1. **Open the Compose Modal**
   - Click on "What's happening?" or the compose button
   - The modal will open

2. **Select Video File**
   - Click the **Image button** (📷 icon) at the bottom of the compose modal
   - In the file picker, select one or more video files:
     - **Supported formats**: MP4, MOV, WebM
     - **Max file size**: 100MB per file
     - **Max files**: Up to 4 videos per post

3. **Preview Your Video**
   - The video will appear in a preview grid
   - You can play the video to verify it's correct
   - Click the **X button** on any preview to remove it

4. **Add Optional Text**
   - Type any text content (optional - you can post videos without text)
   - Max 280 characters

5. **Post**
   - Click the blue **"Post"** button
   - Wait for processing (videos may take a few seconds)
   - Your post will appear in the feed with the processed video

## What Happens During Processing

When you upload a video, the backend automatically:
- ✅ Transcodes to MP4 format (H.264 + AAC)
- ✅ Caps resolution at 720p height (maintains aspect ratio)
- ✅ Optimizes for web streaming (faststart)
- ✅ Generates a thumbnail at the 2-second mark
- ✅ Stores in `/uploads/videos/` and `/uploads/thumbnails/`

## Video Playback in Feed

- Videos display with native HTML5 player controls
- Thumbnail shows before playback
- Click play to watch
- Responsive sizing (500px max for single video, 250px for multiple)

## Troubleshooting

### Video won't upload
- Check file size (must be < 100MB)
- Verify format (MP4, MOV, or WebM only)
- Ensure FFmpeg is installed on the server

### Video not displaying
- Check browser console for errors
- Verify the video processed successfully in `/uploads/videos/`
- Check PM2 logs: `npx pm2 logs content-service`

### Processing takes too long
- Large videos may take 10-30 seconds to process
- Consider reducing video size before upload
- Future: Background processing will be added

## Current Limitations

1. **Synchronous Processing**: Videos process during upload, causing delays for large files
2. **No Progress Indicator**: You'll see a loading state but no percentage
3. **Local Storage**: Videos stored in `/uploads` directory (not cloud storage)
4. **FFmpeg Required**: Server must have FFmpeg installed and in PATH

## Example Usage

```
1. Click compose modal
2. Click image button
3. Select "my-video.mp4" (50MB, 1080p)
4. See video preview
5. Type "Check out this cool video!"
6. Click Post
7. Wait ~10 seconds for processing
8. Video appears in feed at 720p with thumbnail
```

## Technical Details

**Accepted MIME Types:**
- `video/mp4`
- `video/quicktime` (MOV)
- `video/webm`

**Output Format:**
- Codec: H.264 (video) + AAC (audio)
- Container: MP4
- Max Resolution: 720p height
- Optimization: Faststart enabled

**File Locations:**
- Original: `/temp/` (deleted after processing)
- Processed: `/uploads/videos/`
- Thumbnail: `/uploads/thumbnails/`
