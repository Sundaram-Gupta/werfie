const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const { getR2Client, R2_CONFIG } = require('../config/r2.config');
const { v4: uuidv4 } = require('uuid');

/**
 * Upload buffer to R2
 * @param {Buffer} buffer - File buffer
 * @param {string} folder - Folder in bucket (images/videos/thumbnails)
 * @param {string} extension - File extension (webp/mp4/jpg)
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

        console.log(`[R2] Uploaded: ${key}`);
        return { key, url: publicUrl };
    } catch (error) {
        console.error('[R2] Upload failed:', error.message);
        throw new Error(`Failed to upload to R2: ${error.message}`);
    }
}

/**
 * Upload large file using multipart upload
 * @param {Buffer|Stream} data - File data
 * @param {string} folder - Folder in bucket
 * @param {string} extension - File extension
 * @param {string} contentType - MIME type
 * @returns {Promise<{key: string, url: string}>}
 */
async function uploadLargeFile(data, folder, extension, contentType) {
    const client = getR2Client();

    if (!client) {
        throw new Error('R2 client not initialized. Check R2 configuration.');
    }

    // Add werfie/ prefix to organize media in the bucket
    const key = `werfie/${folder}/${uuidv4()}.${extension}`;

    try {
        const upload = new Upload({
            client,
            params: {
                Bucket: R2_CONFIG.bucketName,
                Key: key,
                Body: data,
                ContentType: contentType,
                CacheControl: 'public, max-age=31536000'
            }
        });

        await upload.done();

        const publicUrl = `${R2_CONFIG.publicUrl}/${key}`;

        console.log(`[R2] Large file uploaded: ${key}`);
        return { key, url: publicUrl };
    } catch (error) {
        console.error('[R2] Large file upload failed:', error.message);
        throw new Error(`Failed to upload large file to R2: ${error.message}`);
    }
}

/**
 * Delete object from R2
 * @param {string} key - Object key
 * @returns {Promise<void>}
 */
async function deleteFromR2(key) {
    const client = getR2Client();

    if (!client) {
        console.warn('[R2] Client not initialized. Skipping delete.');
        return;
    }

    try {
        const command = new DeleteObjectCommand({
            Bucket: R2_CONFIG.bucketName,
            Key: key
        });

        await client.send(command);
        console.log(`[R2] Deleted: ${key}`);
    } catch (error) {
        console.error('[R2] Delete failed:', error.message);
        // Don't throw - deletion failure shouldn't break the flow
    }
}

/**
 * Generate public URL for R2 object
 * @param {string} key - Object key
 * @returns {string}
 */
function getPublicUrl(key) {
    return `${R2_CONFIG.publicUrl}/${key}`;
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
    uploadLargeFile,
    deleteFromR2,
    getPublicUrl,
    isR2Enabled
};
