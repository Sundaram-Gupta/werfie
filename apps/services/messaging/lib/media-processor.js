import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';

/**
 * Process Image: Resize, Compress (WebP), Remove Metadata
 * Returns: { path, filename, mimeType, cleanup }
 */
export async function processImage(fileBuffer) {
    const filename = `${uuidv4()}.webp`;
    const outputPath = path.join(os.tmpdir(), filename);

    try {
        await sharp(fileBuffer)
            .resize({ width: 1080, withoutEnlargement: true })
            .webp({ quality: 80 })
            .withMetadata(false) // Remove EXIF
            .toFile(outputPath);

        return {
            path: outputPath,
            filename,
            mimeType: 'image/webp',
            // Safe cleanup function
            cleanup: () => {
                try {
                    if (fs.existsSync(outputPath)) {
                        fs.unlinkSync(outputPath);
                    }
                } catch (e) {
                    console.error(`⚠️ [MediaProcessor] Failed to cleanup temp file ${outputPath}:`, e.message);
                }
            }
        };
    } catch (error) {
        // Ensure we don't leave a partial file if processing fails
        try {
            if (fs.existsSync(outputPath)) {
                fs.unlinkSync(outputPath);
            }
        } catch (cleanupErr) { }

        console.error("❌ [MediaProcessor] Image processing failed:", error);
        throw new Error(`Image processing failed: ${error.message}`);
    }
}

/**
 * Process Video: Transcode to MP4 (H.264/AAC), Generate Thumbnail
 */
export function processVideo(inputPath) {
    return new Promise((resolve, reject) => {
        const videoFilename = `${uuidv4()}.mp4`;
        const thumbnailFilename = `${uuidv4()}.jpg`;
        const outputVideoPath = path.join(os.tmpdir(), videoFilename);
        const outputThumbnailPath = path.join(os.tmpdir(), thumbnailFilename);

        let duration = 0;

        ffmpeg(inputPath)
            .outputOptions([
                '-c:v libx264',
                '-crf 23',
                '-preset fast',
                '-c:a aac',
                '-b:a 128k',
                '-movflags +faststart',
                '-vf scale=\'min(1280,iw):-2\'' // Max width 720p (approx)
            ])
            .on('end', () => {
                // Generate Thumbnail
                ffmpeg(outputVideoPath)
                    .screenshots({
                        count: 1,
                        folder: os.tmpdir(),
                        filename: thumbnailFilename,
                        timemarks: ['00:00:02.000'] // 2 seconds in
                    })
                    .on('end', () => {
                        resolve({
                            video: {
                                path: outputVideoPath,
                                filename: videoFilename,
                                mimeType: 'video/mp4',
                            },
                            thumbnail: {
                                path: outputThumbnailPath,
                                filename: thumbnailFilename,
                                mimeType: 'image/jpeg'
                            },
                            duration: Math.round(duration),
                            cleanup: () => {
                                try { if (fs.existsSync(outputVideoPath)) fs.unlinkSync(outputVideoPath); } catch (e) { }
                                try { if (fs.existsSync(outputThumbnailPath)) fs.unlinkSync(outputThumbnailPath); } catch (e) { }
                            }
                        });
                    });
            })
            .on('codecData', (data) => {
                // Extract duration from metadata if available, or parse it later
                if (data.duration) {
                    const parts = data.duration.split(':');
                    duration = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseFloat(parts[2]);
                }
            })
            .on('error', (err) => reject(err))
            .save(outputVideoPath);
    });
}

/**
 * Process Audio: Convert to MP3
 */
export function processAudio(inputPath) {
    return new Promise((resolve, reject) => {
        const filename = `${uuidv4()}.mp3`;
        const outputPath = path.join(os.tmpdir(), filename);
        let duration = 0;

        ffmpeg(inputPath)
            .toFormat('mp3')
            .audioBitrate('128k')
            .on('codecData', (data) => {
                if (data.duration) {
                    const parts = data.duration.split(':');
                    duration = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseFloat(parts[2]);
                }
            })
            .on('end', () => {
                resolve({
                    path: outputPath,
                    filename,
                    mimeType: 'audio/mpeg',
                    duration: Math.round(duration),
                    cleanup: () => {
                        try {
                            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
                        } catch (e) { }
                    }
                });
            })
            .on('error', (err) => reject(err))
            .save(outputPath);
    });
}
