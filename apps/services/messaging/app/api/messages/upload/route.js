import { getUserFromRequest, withAuth } from '../../../../lib/auth';
import { processImage, processVideo, processAudio } from '../../../../lib/media-processor';
import { uploadToR2 } from '../../../../lib/r2';
import { apiSuccess, apiError } from '../../../../lib/api-response';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';

export const POST = withAuth(async (req) => {
    // 1. Setup Request Context
    let cleanupTasks = []; // Array of cleanup functions to run at the end

    try {
        console.log("📝 [Upload] Request received");

        const user = await getUserFromRequest(req);
        if (!user.userId) {
            console.error("❌ [Upload] Unauthorized: No userId found");
            return apiError('Unauthorized', 401);
        }
        console.log(`👤 [Upload] User: ${user.userId}`);

        // 2. Parse Form Data
        let formData;
        try {
            formData = await req.formData();
        } catch (e) {
            console.error("❌ [Upload] Failed to parse FormData:", e);
            return apiError('Invalid form data', 400);
        }

        const file = formData.get('file');

        if (!file) {
            console.error("❌ [Upload] No file provided in 'file' field");
            return apiError('No file uploaded', 400);
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const type = file.type;
        const size = file.size; // in bytes

        console.log(`📂 [Upload] File parsed. Type: ${type}, Size: ${size} bytes`);

        // 3. Validation
        if (type.startsWith('image/') && size > 5 * 1024 * 1024) throw new Error('Image too large (max 5MB)');
        if (type.startsWith('video/') && size > 100 * 1024 * 1024) throw new Error('Video too large (max 100MB)');
        if (type.startsWith('audio/') && size > 20 * 1024 * 1024) throw new Error('Audio too large (max 20MB)');

        let mediaData = {};

        // 4. Processing & Upload
        try {
            if (type.startsWith('image/')) {
                console.log("🖼️ [Upload] Processing Image...");

                // Process Image
                const result = await processImage(buffer);
                if (result.cleanup) cleanupTasks.push(result.cleanup);
                console.log(`✅ [Upload] Image processed: ${result.path}`);

                // Validate File Existence
                if (!fs.existsSync(result.path)) {
                    throw new Error(`Processed image file not found at ${result.path}`);
                }

                // Upload to R2
                console.log("🚀 [Upload] Uploading to R2 (Image)...");
                const content = fs.readFileSync(result.path);
                const url = await uploadToR2(content, result.mimeType, 'chat/images');
                console.log(`✅ [Upload] R2 Upload Success: ${url}`);

                mediaData = {
                    url,
                    mimeType: result.mimeType,
                    size: content.length
                };

            } else if (type.startsWith('video/')) {
                console.log("🎥 [Upload] Processing Video...");
                const tempPath = path.join(os.tmpdir(), `${uuidv4()}_input.mp4`);
                fs.writeFileSync(tempPath, buffer);
                cleanupTasks.push(() => { try { if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath); } catch (e) { } });

                // Process Video
                const result = await processVideo(tempPath);
                if (result.cleanup) cleanupTasks.push(result.cleanup);
                console.log(`✅ [Upload] Video processed. Video: ${result.video.path}, Thumb: ${result.thumbnail.path}`);

                // Upload Video
                console.log("🚀 [Upload] Uploading to R2 (Video)...");
                if (!fs.existsSync(result.video.path)) throw new Error('Processed video file not found');
                const videoContent = fs.readFileSync(result.video.path);
                const videoUrl = await uploadToR2(videoContent, result.video.mimeType, 'chat/videos');

                // Upload Thumbnail
                console.log("🚀 [Upload] Uploading to R2 (Thumbnail)...");
                if (!fs.existsSync(result.thumbnail.path)) throw new Error('Processed thumbnail file not found');
                const thumbContent = fs.readFileSync(result.thumbnail.path);
                const thumbUrl = await uploadToR2(thumbContent, result.thumbnail.mimeType, 'chat/thumbnails');

                mediaData = {
                    url: videoUrl,
                    thumbnailUrl: thumbUrl,
                    duration: result.duration,
                    mimeType: result.video.mimeType,
                    size: videoContent.length
                };
            } else if (type.startsWith('audio/')) {
                console.log("🎵 [Upload] Processing Audio...");
                const tempPath = path.join(os.tmpdir(), `${uuidv4()}_input.audio`);
                fs.writeFileSync(tempPath, buffer);
                cleanupTasks.push(() => { try { if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath); } catch (e) { } });

                // Process Audio
                const result = await processAudio(tempPath);
                if (result.cleanup) cleanupTasks.push(result.cleanup);
                console.log(`✅ [Upload] Audio processed: ${result.path}`);

                // Upload to R2
                console.log("🚀 [Upload] Uploading to R2 (Audio)...");
                if (!fs.existsSync(result.path)) throw new Error('Processed audio file not found');
                const content = fs.readFileSync(result.path);
                const url = await uploadToR2(content, result.mimeType, 'chat/audios');

                mediaData = {
                    url,
                    duration: result.duration,
                    mimeType: result.mimeType,
                    size: content.length
                };
            } else {
                console.error(`❌ [Upload] Unsupported file type: ${type}`);
                return apiError('Unsupported file type', 400);
            }
        } catch (procError) {
            console.error("❌ [Upload] Processing/Upload Failed:", procError);
            // Ensure stack trace is visible in logs
            console.error(procError.stack);
            return apiError(`Processing error: ${procError.message}`, 500);
        }

        return apiSuccess({
            url: mediaData.url,
            thumbnailUrl: mediaData.thumbnailUrl,
            duration: mediaData.duration,
            size: mediaData.size,
            mimeType: mediaData.mimeType
        }, 'Media uploaded successfully');

    } catch (error) {
        console.error('❌ [Upload] Critical Error:', error);
        return apiError(error.message || 'Upload failed', 500);
    } finally {
        // 5. Cleanup Always Runs
        console.log(`🧹 [Upload] Cleaning up ${cleanupTasks.length} temp files/tasks...`);
        for (const cleanup of cleanupTasks) {
            try {
                cleanup();
            } catch (e) {
                console.warn("⚠️ [Upload] Cleanup task failed:", e.message);
            }
        }
    }
});
