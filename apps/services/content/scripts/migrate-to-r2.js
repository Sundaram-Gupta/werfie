require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const { getR2Client, R2_CONFIG } = require('../src/config/r2.config');
const { uploadToR2, uploadLargeFile } = require('../src/utils/r2-upload');
const fs = require('fs-extra');
const path = require('path');

const prisma = new PrismaClient();

// Configuration
const DRY_RUN = process.env.DRY_RUN === 'true';
const DELETE_LOCAL = process.env.DELETE_LOCAL === 'true';
const UPLOADS_DIR = path.join(__dirname, '../uploads');

/**
 * Migrate existing local media to R2
 */
async function migrateToR2() {
    console.log('='.repeat(60));
    console.log('Cloudflare R2 Migration Script');
    console.log('='.repeat(60));
    console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
    console.log(`Delete local files: ${DELETE_LOCAL ? 'YES' : 'NO'}`);
    console.log('='.repeat(60));

    // Validate R2 configuration
    if (!R2_CONFIG.useR2) {
        console.error('❌ R2 is not enabled. Set USE_R2_STORAGE=true in .env');
        process.exit(1);
    }

    try {
        // Test R2 connection
        const client = getR2Client();
        if (!client) {
            throw new Error('Failed to initialize R2 client');
        }
        console.log('✅ R2 client initialized');

        // Fetch all media records with local paths
        const mediaRecords = await prisma.postMedia.findMany({
            where: {
                OR: [
                    { mediaUrl: { startsWith: '/uploads/' } },
                    { thumbnailUrl: { startsWith: '/uploads/' } }
                ]
            }
        });

        console.log(`\n📊 Found ${mediaRecords.length} media records to migrate\n`);

        if (mediaRecords.length === 0) {
            console.log('✅ No media to migrate. All done!');
            return;
        }

        let successCount = 0;
        let failCount = 0;
        let skippedCount = 0;

        for (const [index, media] of mediaRecords.entries()) {
            console.log(`\n[${index + 1}/${mediaRecords.length}] Processing: ${media.id}`);

            try {
                const updates = {};

                // Migrate main media file
                if (media.mediaUrl?.startsWith('/uploads/')) {
                    const localPath = path.join(UPLOADS_DIR, media.mediaUrl.replace('/uploads/', ''));

                    if (!fs.existsSync(localPath)) {
                        console.warn(`⚠️  File not found: ${localPath}`);
                        skippedCount++;
                        continue;
                    }

                    const buffer = await fs.readFile(localPath);
                    const extension = path.extname(localPath).substring(1);
                    const folder = media.mediaType === 'image' ? 'images' : 'videos';
                    const contentType = media.mediaType === 'image' ? 'image/webp' : 'video/mp4';

                    if (!DRY_RUN) {
                        if (media.mediaType === 'video' && buffer.length > 5 * 1024 * 1024) {
                            // Use multipart upload for large videos
                            const { url } = await uploadLargeFile(buffer, folder, extension, contentType);
                            updates.mediaUrl = url;
                        } else {
                            const { url } = await uploadToR2(buffer, folder, extension, contentType);
                            updates.mediaUrl = url;
                        }
                        console.log(`  ✅ Uploaded media: ${updates.mediaUrl}`);

                        // Delete local file if requested
                        if (DELETE_LOCAL) {
                            await fs.unlink(localPath);
                            console.log(`  🗑️  Deleted local file: ${localPath}`);
                        }
                    } else {
                        console.log(`  [DRY RUN] Would upload: ${localPath} → R2/${folder}/`);
                    }
                }

                // Migrate thumbnail
                if (media.thumbnailUrl?.startsWith('/uploads/')) {
                    const localPath = path.join(UPLOADS_DIR, media.thumbnailUrl.replace('/uploads/', ''));

                    if (fs.existsSync(localPath)) {
                        const buffer = await fs.readFile(localPath);
                        const extension = path.extname(localPath).substring(1);

                        if (!DRY_RUN) {
                            const { url } = await uploadToR2(buffer, 'thumbnails', extension, 'image/jpeg');
                            updates.thumbnailUrl = url;
                            console.log(`  ✅ Uploaded thumbnail: ${updates.thumbnailUrl}`);

                            if (DELETE_LOCAL) {
                                await fs.unlink(localPath);
                                console.log(`  🗑️  Deleted local thumbnail: ${localPath}`);
                            }
                        } else {
                            console.log(`  [DRY RUN] Would upload: ${localPath} → R2/thumbnails/`);
                        }
                    }
                }

                // Update database
                if (!DRY_RUN && Object.keys(updates).length > 0) {
                    await prisma.postMedia.update({
                        where: { id: media.id },
                        data: updates
                    });
                    console.log(`  ✅ Database updated`);
                }

                successCount++;
            } catch (error) {
                console.error(`  ❌ Failed: ${error.message}`);
                failCount++;
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('Migration Summary');
        console.log('='.repeat(60));
        console.log(`✅ Success: ${successCount}`);
        console.log(`❌ Failed: ${failCount}`);
        console.log(`⚠️  Skipped: ${skippedCount}`);
        console.log('='.repeat(60));

        if (DRY_RUN) {
            console.log('\n💡 This was a DRY RUN. No changes were made.');
            console.log('   To execute migration, run: node migrate-to-r2.js');
        }

    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Run migration
migrateToR2()
    .then(() => {
        console.log('\n✅ Migration completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    });
