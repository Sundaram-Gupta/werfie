require('dotenv').config();
const { getR2Client, R2_CONFIG } = require('../src/config/r2.config');
const { uploadToR2 } = require('../src/utils/r2-upload');

/**
 * Test R2 connection and upload
 */
async function testR2Connection() {
    console.log('='.repeat(60));
    console.log('Testing Cloudflare R2 Connection');
    console.log('='.repeat(60));

    try {
        // Check configuration
        console.log('\n📋 Configuration:');
        console.log(`  Account ID: ${R2_CONFIG.accountId ? '✅ Set' : '❌ Missing'}`);
        console.log(`  Access Key: ${R2_CONFIG.accessKeyId ? '✅ Set' : '❌ Missing'}`);
        console.log(`  Secret Key: ${R2_CONFIG.secretAccessKey ? '✅ Set' : '❌ Missing'}`);
        console.log(`  Bucket: ${R2_CONFIG.bucketName}`);
        console.log(`  Public URL: ${R2_CONFIG.publicUrl}`);
        console.log(`  R2 Enabled: ${R2_CONFIG.useR2 ? '✅ Yes' : '❌ No'}`);

        if (!R2_CONFIG.useR2) {
            console.error('\n❌ R2 is disabled. Set USE_R2_STORAGE=true in .env');
            process.exit(1);
        }

        // Initialize client
        console.log('\n🔌 Initializing R2 client...');
        const client = getR2Client();

        if (!client) {
            throw new Error('Failed to initialize R2 client');
        }
        console.log('✅ R2 client initialized successfully');

        // Test upload
        console.log('\n📤 Testing upload...');
        const testData = Buffer.from('Hello from Werfie! This is a test file.');
        const { key, url } = await uploadToR2(testData, 'test', 'txt', 'text/plain');

        console.log('✅ Upload successful!');
        console.log(`  Key: ${key}`);
        console.log(`  URL: ${url}`);

        console.log('\n' + '='.repeat(60));
        console.log('✅ All tests passed!');
        console.log('='.repeat(60));
        console.log('\n💡 Next steps:');
        console.log('  1. Verify the test file is accessible at the URL above');
        console.log('  2. Try uploading an image or video through the app');
        console.log('  3. Run migration script to move existing media to R2');

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error('\n🔧 Troubleshooting:');
        console.error('  1. Check environment variables in .env');
        console.error('  2. Verify R2 API credentials are correct');
        console.error('  3. Ensure bucket exists and API token has write permissions');
        console.error('  4. Check network connectivity');
        process.exit(1);
    }
}

// Run test
testR2Connection();
