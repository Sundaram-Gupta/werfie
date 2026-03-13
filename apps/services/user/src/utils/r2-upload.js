const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getR2Client, R2_CONFIG } = require('../config/r2.config');
const { v4: uuidv4 } = require('uuid');

/**
 * Upload buffer to R2
 * @param {Buffer} buffer - File buffer
 * @param {string} folder - Folder in bucket (docs/institutional)
 * @param {string} extension - File extension (webp/pdf/jpg)
 * @param {string} contentType - MIME type
 * @returns {Promise<{key: string, url: string}>}
 */
async function uploadToR2(buffer, folder, extension, contentType) {
    const client = getR2Client();

    if (!client) {
        throw new Error('R2 client not initialized. Check R2 configuration.');
    }

    // Add werfie/ prefix to organize media in the bucket
    const key = `werfie/${folder}/${uuidv4()}.${extension}`;

    try {
        const command = new PutObjectCommand({
            Bucket: R2_CONFIG.bucketName,
            Key: key,
            Body: buffer,
            ContentType: contentType,
            CacheControl: 'public, max-age=31536000' // 1 year cache
        });

        await client.send(command);

        const publicUrl = `${R2_CONFIG.publicUrl}/${key}`;

        console.log(`[R2] Uploaded Institutional Doc: ${key}`);
        return { key, url: publicUrl };
    } catch (error) {
        console.error('[R2] Upload failed:', error.message);
        throw new Error(`Failed to upload to R2: ${error.message}`);
    }
}

/**
 * Check if R2 is enabled
 * @returns {boolean}
 */
function isR2Enabled() {
    return R2_CONFIG.useR2 && getR2Client() !== null;
}

module.exports = {
    uploadToR2,
    isR2Enabled
};
