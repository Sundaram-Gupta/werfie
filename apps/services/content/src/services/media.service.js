const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const { uploadToR2, uploadLargeFile, isR2Enabled } = require('../utils/r2-upload');

// Local storage directories (fallback)
const UPLOADS_DIR = path.join(__dirname, '../../uploads');
const IMAGE_DIR = path.join(UPLOADS_DIR, 'images');
const VIDEO_DIR = path.join(UPLOADS_DIR, 'videos');
const THUMB_DIR = path.join(UPLOADS_DIR, 'thumbnails');

// Ensure local directories exist (fallback)
[IMAGE_DIR, VIDEO_DIR, THUMB_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

class MediaService {
    /**
     * Process Image using Sharp and upload to R2
     */
    static async processImage(file) {
        const outName = `${uuidv4()}.webp`;

        try {
            // Process image with Sharp
            const buffer = await sharp(file.path)
                .resize({
                    width: 1080,
                    withoutEnlargement: true,
                    fit: 'inside'
                })
                .webp({ quality: 80 })
                .toBuffer();

            const metadata = await sharp(buffer).metadata();

            // Upload to R2 or save locally
            let mediaUrl;
            if (isR2Enabled()) {
                const { url } = await uploadToR2(buffer, 'images', outName, 'image/webp');
                mediaUrl = url;
            } else {
                // Fallback: Save locally
                const outPath = path.join(IMAGE_DIR, outName);
                await fs.writeFile(outPath, buffer);
                mediaUrl = `/uploads/images/${outName}`;
            }

            return {
                mediaType: 'image',
                mediaUrl,
                width: metadata.width,
                height: metadata.height,
                size: buffer.length
            };
        } catch (error) {
            console.error('[MediaService] Image processing failed:', error);
            throw error;
        }
    }

    /**
     * Process Audio using FFmpeg (Convert to MP3/AAC)
     */
    static async processAudio(file) {
        const outName = `${uuidv4()}.mp3`;
        const outPath = path.join(VIDEO_DIR, outName); // Use video dir or dedicated audio dir

        return new Promise((resolve, reject) => {
            let duration = 0;

            ffmpeg(file.path)
                .audioCodec('libmp3lame')
                .on('error', (err) => {
                    console.error('FFmpeg Audio Error:', err);
                    reject(err);
                })
                .on('end', async () => {
                    try {
                        let mediaUrl;
                        const stats = fs.statSync(outPath);

                        if (isR2Enabled()) {
                            // Stream upload for efficiency
                            const fileStream = fs.createReadStream(outPath);
                            const { url } = await uploadLargeFile(fileStream, 'audio', 'mp3', 'audio/mpeg');
                            mediaUrl = url;
                            await fs.unlink(outPath); // Cleanup
                        } else {
                            mediaUrl = `/uploads/videos/${outName}`; // Using video dir as fallback for now
                        }

                        // Get duration via ffprobe
                        ffmpeg.ffprobe(file.path, (err, metadata) => {
                            if (!err) duration = metadata.format.duration;

                            resolve({
                                mediaType: 'audio',
                                mediaUrl,
                                duration,
                                size: stats.size
                            });
                        });
                    } catch (error) {
                        reject(error);
                    }
                })
                .save(outPath);
        });
    }

    /**
     * Process Video using FFmpeg and upload to R2
     */
    static async processVideo(file) {
        const outName = `${uuidv4()}.mp4`;
        const thumbName = `${uuidv4()}.jpg`;
        const outPath = path.join(VIDEO_DIR, outName);
        const thumbPath = path.join(THUMB_DIR, thumbName);

        return new Promise((resolve, reject) => {
            let duration = 0;
            let videoWidth = 0;
            let videoHeight = 0;

            // Get Metadata (Duration, Resolution)
            ffmpeg.ffprobe(file.path, (err, metadata) => {
                if (err) {
                    console.error('FFprobe Error:', err);
                    return reject(err);
                }

                duration = metadata.format.duration;
                const videoStream = metadata.streams.find(s => s.codec_type === 'video');
                if (!videoStream) {
                    return reject(new Error('No video stream found'));
                }

                videoWidth = videoStream.width;
                videoHeight = videoStream.height;

                // Calculate output dimensions (max 720p height)
                let outputWidth = videoWidth;
                let outputHeight = videoHeight;
                if (videoHeight > 720) {
                    outputHeight = 720;
                    outputWidth = Math.round((videoWidth / videoHeight) * 720);
                    // Ensure even width
                    if (outputWidth % 2 !== 0) outputWidth++;
                }

                // Process video
                ffmpeg(file.path)
                    .videoCodec('libx264')
                    .audioCodec('aac')
                    .size(`${outputWidth}x${outputHeight}`)
                    .outputOptions([
                        '-movflags +faststart',
                        '-pix_fmt yuv420p'
                    ])
                    .on('error', (err) => {
                        console.error('FFmpeg Error:', err);
                        reject(err);
                    })
                    .on('end', async () => {
                        try {
                            // Upload video to R2 or keep local
                            let videoUrl;
                            if (isR2Enabled()) {
                                // Stream upload to prevent Memory Leaks
                                const fileStream = fs.createReadStream(outPath);
                                const { url } = await uploadLargeFile(fileStream, 'videos', 'mp4', 'video/mp4');
                                videoUrl = url;
                                // Clean up local file
                                await fs.unlink(outPath);
                            } else {
                                videoUrl = `/uploads/videos/${outName}`;
                            }

                            // Upload thumbnail to R2 or keep local
                            let thumbnailUrl;
                            if (isR2Enabled() && fs.existsSync(thumbPath)) {
                                const thumbBuffer = await fs.readFile(thumbPath);
                                const { url } = await uploadToR2(thumbBuffer, 'thumbnails', 'jpg', 'image/jpeg');
                                thumbnailUrl = url;
                                // Clean up local file
                                await fs.unlink(thumbPath);
                            } else if (fs.existsSync(thumbPath)) {
                                thumbnailUrl = `/uploads/thumbnails/${thumbName}`;
                            }

                            const stats = fs.existsSync(outPath) ? fs.statSync(outPath) : { size: 0 };

                            resolve({
                                mediaType: 'video',
                                mediaUrl: videoUrl,
                                thumbnailUrl: thumbnailUrl,
                                width: outputWidth,
                                height: outputHeight,
                                duration: duration,
                                size: stats.size
                            });
                        } catch (error) {
                            reject(error);
                        }
                    })
                    .save(outPath);

                // Generate thumbnail separately
                ffmpeg(file.path)
                    .screenshots({
                        timestamps: [2],
                        filename: thumbName,
                        folder: THUMB_DIR,
                        size: `${outputWidth}x${outputHeight}`
                    })
                    .on('error', (err) => {
                        console.error('Thumbnail Error:', err);
                        // Don't reject, thumbnail is optional
                    });
            });
        });
    }

    /**
     * Cleanup Temp File
     */
    static async cleanup(filePath) {
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        } catch (error) {
            console.error('Cleanup Error:', error);
        }
    }
}

module.exports = MediaService;
