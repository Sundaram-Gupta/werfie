import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'werfie-media';
// Fallback to R2_PUBLIC_DOMAIN if R2_PUBLIC_URL is missing
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || process.env.R2_PUBLIC_DOMAIN;

const s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
});

export async function uploadToR2(fileBuffer, contentType, folder = 'chat') {
    const fileName = `${uuidv4()}.${contentType.split('/')[1]}`;
    const key = `${folder}/${fileName}`;

    try {
        await s3Client.send(new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
            Body: fileBuffer,
            ContentType: contentType,
            ACL: 'public-read', // R2 doesn't always support ACLs, but good practice if needed
        }));

        return `${R2_PUBLIC_URL}/${key}`;
    } catch (error) {
        console.error('R2 Upload Error:', error);
        throw new Error('Failed to upload to R2');
    }
}
