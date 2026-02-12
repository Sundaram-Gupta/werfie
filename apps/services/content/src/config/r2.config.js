const { S3Client } = require('@aws-sdk/client-s3');

// R2 Configuration
const R2_CONFIG = {
    accountId: process.env.R2_ACCOUNT_ID,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucketName: process.env.R2_BUCKET_NAME || 'werfie-media',
    publicUrl: process.env.R2_PUBLIC_URL,
    useR2: process.env.USE_R2_STORAGE === 'true'
};

// Validate R2 configuration
function validateR2Config() {
    if (!R2_CONFIG.useR2) {
        console.log('[R2] R2 storage is disabled. Using local storage.');
        return false;
    }

    const required = ['accountId', 'accessKeyId', 'secretAccessKey', 'publicUrl'];
    const missing = required.filter(key => !R2_CONFIG[key]);

    if (missing.length > 0) {
        console.error('[R2] Missing required environment variables:', missing.map(k => `R2_${k.toUpperCase()}`).join(', '));
        throw new Error('R2 configuration incomplete. Please set all required environment variables.');
    }

    return true;
}

// Create S3 Client for R2
function createR2Client() {
    if (!validateR2Config()) {
        return null;
    }

    try {
        const client = new S3Client({
            region: 'auto',
            endpoint: `https://${R2_CONFIG.accountId}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: R2_CONFIG.accessKeyId,
                secretAccessKey: R2_CONFIG.secretAccessKey
            },
            forcePathStyle: true // Required for R2
        });

        console.log('[R2] Client initialized successfully');
        return client;
    } catch (error) {
        console.error('[R2] Failed to initialize client:', error.message);
        throw new Error('Failed to connect to Cloudflare R2. Please check your credentials.');
    }
}

// Initialize client (singleton)
let r2Client = null;

function getR2Client() {
    if (!r2Client && R2_CONFIG.useR2) {
        r2Client = createR2Client();
    }
    return r2Client;
}

module.exports = {
    R2_CONFIG,
    getR2Client,
    validateR2Config
};
