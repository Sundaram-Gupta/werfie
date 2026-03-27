require('dotenv').config();
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3003;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

app.use(express.json());

app.use(cors({
    origin: (origin, callback) => callback(null, true), // Allow all origins in dev
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-User-Id']
}));
app.use(require('./middleware/api-response'));

// Handle /api/posts/liked before rewrite so the path is always matched (gateway forwards /api/posts/liked)
const optionalAuth = require('./middleware/auth').optionalAuthenticateToken;
app.get('/api/posts/liked', optionalAuth, async (req, res) => {
    try {
        const raw = req.query.userId;
        const queryUserId = (typeof raw === 'string' && raw.trim() && raw !== 'undefined') ? raw.trim() : null;
        const currentUserId = req.user?.userId || req.user?.id || null;
        const targetUserId = queryUserId || currentUserId;
        if (!targetUserId) {
            return res.status(401).json({ error: 'Unauthorized', posts: [] });
        }
        const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
        const postInclude = {
            user: { include: { profile: true } },
            media: true,
            replyTo: { include: { user: { include: { profile: true } } } },
            _count: { select: { replies: true, likes: true, retweets: true } }
        };
        if (currentUserId) {
            postInclude.likes = { where: { userId: currentUserId }, select: { id: true } };
            postInclude.bookmarks = { where: { userId: currentUserId }, select: { id: true } };
            postInclude.highlightedIn = { where: { userId: currentUserId }, select: { id: true } };
        }
        const likes = await prisma.like.findMany({
            where: { userId: targetUserId },
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: { post: { include: postInclude } }
        });
        const now = new Date();
        const posts = backfillMediaUrls(
            likes.map((l) => l.post).filter((p) => p && (!p.scheduledAt || new Date(p.scheduledAt) <= now))
        );
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        res.json({ posts });
    } catch (err) {
        console.error('[ContentService] GET /api/posts/liked error:', err);
        res.status(500).json({ error: 'Failed to fetch liked posts', posts: [] });
    }
});

// Generic Rewrite Middleware - MOVED TO TOP for consistent routing
app.use((req, res, next) => {
    // console.log(`[ContentService] Incoming: ${req.method} ${req.url}`);
    // Skip rewrite for socket.io paths to avoid breaking polling/handshakes
    if (req.url && (req.url.includes('/ws/live') || req.url.includes('/api/posts/ws'))) {
        return next();
    }
    if (req.url.startsWith('/api/posts')) {
        let newUrl = req.url.replace('/api/posts', '');
        if (!newUrl.startsWith('/')) newUrl = '/' + newUrl;
        req.url = newUrl;
    } else if (req.path.startsWith('/api/')) {
        req.url = req.url.replace('/api', '');
    }
    next();
});

const adsRoutes = require('./routes/adsRoutes');
const listsRoutes = require('./routes/listsRoutes');
const spacesRoutes = require('./routes/spacesRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const worldLeaderFeedRoutes = require('./routes/worldLeaderFeedRoutes');
const enterpriseRoutes = require('./routes/enterpriseRoutes');
const commentRoutes = require('./routes/commentRoutes');
const crisisRoutes = require('./routes/crisisRoutes');
const soapboxRoutes = require('./routes/soapboxRoutes');
const debateRoutes = require('./routes/debateRoutes');
const highlightsRoutes = require('./routes/highlightsRoutes');
const articlesRoutes = require('./routes/articlesRoutes');
const MediaService = require('./services/media.service');

// All routes now assume the /api prefix has been stripped if they were called with it
app.use('/ads', adsRoutes);
app.use('/announcements', announcementRoutes);
app.use('/feed', worldLeaderFeedRoutes);
app.use('/enterprise', enterpriseRoutes);
app.use('/comments', commentRoutes);
app.use('/crisis', crisisRoutes);
app.use('/soapbox', soapboxRoutes);
app.use('/debate', debateRoutes);
app.use('/highlights', highlightsRoutes);
app.use('/articles', articlesRoutes);

// Backup registration in case rewrite fails or is skipped
app.use('/api/soapbox', soapboxRoutes);
app.use('/api/debate', debateRoutes);
app.use('/api/highlights', highlightsRoutes);
app.use('/api/articles', articlesRoutes);

// Health Checks
app.get('/_health', (req, res) => res.json({ status: 'ok', service: 'content-service' }));
app.get('/api/soapbox/_health', (req, res) => res.json({ status: 'ok', module: 'soapbox' }));
app.get('/soapbox/_health', (req, res) => res.json({ status: 'ok', module: 'soapbox' }));

app.use('/lists', listsRoutes);
app.use('/spaces', spacesRoutes);

// Static serving for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rewrite middleware was here, moved to top.


app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'content-service' });
});

// Internal admin endpoint - for admin panel (same DB as client posts)
const ADMIN_SECRET = process.env.ADMIN_INTERNAL_SECRET || 'dev-admin-internal';
app.get('/internal/admin/posts', async (req, res) => {
    if (req.headers['x-internal-key'] !== ADMIN_SECRET) {
        return res.status(403).json({ error: 'Forbidden' });
    }
    try {
        const posts = await prisma.post.findMany({
            include: {
                user: { include: { profile: true } },
                media: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(posts);
    } catch (err) {
        console.error('[ContentService] Internal admin posts:', err);
        if (err?.code === 'P2022') {
            try {
                const posts = await prisma.post.findMany({
                    include: { user: true, media: true },
                    orderBy: { createdAt: 'desc' }
                });
                return res.json(posts);
            } catch (fallbackErr) {
                console.error('[ContentService] Internal admin posts fallback:', fallbackErr);
            }
        }
        res.status(500).json({ error: err?.message || 'Failed to fetch posts' });
    }
});

// Auth Middleware
const authMiddleware = require('./middleware/auth');
const authenticateToken = authMiddleware;
const optionalAuthenticateToken = authMiddleware.optionalAuthenticateToken || authMiddleware;

// Multer Config - ensure temp dir exists
const tempDir = path.join(__dirname, '../temp');
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, tempDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB Max
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
            'video/mp4', 'video/quicktime', 'video/webm',
            'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/webm'
        ];
        if (allowedTypes.includes(file.mimetype) || file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/') || file.mimetype.startsWith('audio/')) {
            cb(null, true);
        } else {
            cb(new Error('Unsupported file type'), false);
        }
    }
});

// Multer for media upload - same config, used in route
const mediaUpload = multer({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/') || file.mimetype.startsWith('audio/')) {
            cb(null, true);
        } else {
            cb(new Error('Unsupported file type'), false);
        }
    }
});

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'content-service' });
});

// Standalone Media Upload (POST /media/upload - gateway sends /api/media/upload, rewritten  to /media/upload)
app.post('/media/upload', authenticateToken, (req, res, next) => {
    mediaUpload.single('file')(req, res, (err) => {
        if (err) return res.status(400).json({ status: false, message: err.message || 'Upload error', data: null });
        next();
    });
}, async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ status: false, message: 'No file uploaded', data: null });
    }
    const userId = req.user?.userId || req.user?.id;
    if (!userId) return res.status(401).json({ status: false, message: 'Unauthorized', data: null });
    try {
        let result;
        if (req.file.mimetype.startsWith('image/')) {
            result = await MediaService.processImage(req.file);
        } else if (req.file.mimetype.startsWith('video/')) {
            result = await MediaService.processVideo(req.file);
        } else if (req.file.mimetype.startsWith('audio/')) {
            result = await MediaService.processAudio(req.file);
        } else {
            result = await MediaService.processFile(req.file);
        }
        await MediaService.cleanup(req.file.path);
        return res.json({
            status: true,
            message: 'Media uploaded successfully',
            data: {
                url: result.mediaUrl,
                thumbnailUrl: result.thumbnailUrl,
                duration: result.duration,
                size: result.size,
                mimeType: result.mediaType === 'image' ? 'image/webp' : req.file.mimetype
            }
        });
    } catch (err) {
        if (req.file?.path) await MediaService.cleanup(req.file.path).catch(() => {});
        console.error('[Media Upload]', err);
        return res.status(500).json({ status: false, message: err.message || 'Upload failed', data: null });
    }
});

// GET /media/library - Creator Studio: list user's media from their posts
app.get('/media/library', authenticateToken, async (req, res) => {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) return res.status(401).json({ status: false, message: 'Unauthorized', data: null });
    try {
        const { limit = 50, offset = 0 } = req.query;
        const media = await prisma.postMedia.findMany({
            where: { post: { userId } },
            orderBy: { createdAt: 'desc' },
            take: Math.min(parseInt(limit) || 50, 100),
            skip: parseInt(offset) || 0
        });
        const items = media.map(m => ({
            id: m.id,
            mediaType: m.mediaType,
            mediaUrl: m.mediaUrl,
            thumbnailUrl: m.thumbnailUrl,
            size: m.size,
            width: m.width,
            height: m.height,
            duration: m.duration,
            createdAt: m.createdAt
        }));
        return res.json({ status: true, message: 'Media library fetched', data: items });
    } catch (err) {
        console.error('[Media Library]', err);
        return res.status(500).json({ status: false, message: err.message || 'Failed to fetch library', data: null });
    }
});

// Search Posts (route at /search - gateway rewrite strips /api/posts from /api/posts/search)
app.get('/search', async (req, res) => {
    const { q, limit = 20, offset = 0, hasMedia } = req.query;

    if (!q || q.trim().length === 0) {
        return res.json([]);
    }

    // Split query for multi-keyword processing
    const terms = q.trim().split(/\s+/).filter(t => t.length > 0);

    try {
        // Build an 'AND' query: ALL terms must be present in the content
        const andConditions = terms.map(term => ({
            content: { contains: term, mode: 'insensitive' }
        }));

        const posts = await prisma.post.findMany({
            where: {
                AND: andConditions,
                ...(hasMedia === 'true' ? { media: { some: {} } } : {})
            },
            include: {
                user: {
                    include: { profile: true }
                },
                media: true,
                _count: {
                    select: { likes: true, retweets: true, replies: true }
                },
                highlightedIn: { where: { userId: req.headers['x-user-id'] || '' }, select: { id: true } }
            },
            take: parseInt(limit),
            skip: parseInt(offset),
            orderBy: { createdAt: 'desc' }
        });

        // Sanitize
        const safePosts = posts.map(post => {
            if (post.user) {
                const { passwordHash, ...safeUser } = post.user;
                return {
                    ...post,
                    user: safeUser
                };
            }
            return {
                ...post,
                user: { id: post.userId, profile: { handle: 'unknown', name: 'Deleted User' } }
            };
        });

        res.json(backfillMediaUrls(safePosts));
    } catch (error) {
        console.error('Search Posts Error:', error);
        res.status(500).json({ error: 'Failed to search posts', details: error.message });
    }
});

// Helper: only show posts that are published (scheduledAt null or in the past)
const publishedPostFilter = () => ({
    OR: [
        { scheduledAt: null },
        { scheduledAt: { lte: new Date() } }
    ]
});

// Create Post - shared handler for both JSON (poll/text-only) and FormData (with media)
async function handleCreatePost(req, res, body, files) {
    const content = typeof body.content === 'string' ? body.content : (body.content != null ? String(body.content) : '');
    const replyToId = body.replyToId || null;
    const rawScheduledAt = body.scheduledAt;
    const userId = req.user?.userId || req.user?.id;
    const fileList = Array.isArray(files) ? files : [];

    let scheduledAt = null;
    if (rawScheduledAt) {
        const dt = new Date(rawScheduledAt);
        if (!isNaN(dt.getTime()) && dt > new Date()) {
            scheduledAt = dt;
        }
    }

    console.log('[ContentService] Creating post:', { userId, contentLength: content.length, fileCount: fileList.length, scheduledAt: scheduledAt?.toISOString() || null });

    if (!userId) {
        return res.status(401).json({ error: 'User ID missing from token' });
    }

    if (!content.trim() && fileList.length === 0) {
        return res.status(400).json({ error: 'Content or media is required' });
    }

    try {
        const post = await prisma.post.create({
            data: {
                userId,
                content,
                replyToId: replyToId || null,
                scheduledAt
            }
        });

        // 2. Process Media
        const mediaPromises = fileList.map(async (file) => {
            try {
                let processedMedia;
                const mimetype = (file.mimetype || '').toLowerCase();
                const ext = path.extname(file.originalname || '').toLowerCase();
                
                const isGeneric = !mimetype || mimetype === 'application/octet-stream' || mimetype === 'binary/octet-stream';
                const isVideo = mimetype.startsWith('video/') || ['.mp4', '.webm', '.mov', '.m4v'].includes(ext);
                const isAudio = mimetype.startsWith('audio/') || ['.mp3', '.wav', '.ogg', '.m4a'].includes(ext);
                const isImage = mimetype.startsWith('image/') || ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext);

                if (isImage && !isVideo && !isAudio) {
                    processedMedia = await MediaService.processImage(file);
                } else if (isVideo) {
                    processedMedia = await MediaService.processVideo(file);
                } else if (isAudio) {
                    processedMedia = await MediaService.processAudio(file);
                } else {
                    processedMedia = await MediaService.processFile(file);
                }

                if (processedMedia) {
                    await prisma.postMedia.create({
                        data: {
                            postId: post.id,
                            ...processedMedia
                        }
                    });
                }
            } finally {
                // Always clean up temp file
                await MediaService.cleanup(file.path);
            }
        });

        await Promise.all(mediaPromises);

        // 2b. Update mediaUrls on the Post row (JSON array of URLs) so the column is never null when media exists
        if (fileList.length > 0) {
            try {
                const savedMedia = await prisma.postMedia.findMany({
                    where: { postId: post.id },
                    select: { mediaUrl: true }
                });
                if (savedMedia.length > 0) {
                    const urls = savedMedia.map(m => m.mediaUrl);
                    await prisma.post.update({
                        where: { id: post.id },
                        data: { mediaUrls: JSON.stringify(urls) }
                    });
                }
            } catch (mediaUrlErr) {
                // Non-fatal: mediaUrls column update failed, media array is still accessible
                console.error('[ContentService] Failed to update mediaUrls column:', mediaUrlErr);
            }
        }

        // 3. Fetch full post with media (and replyTo when it's a reply)
        const includeObj = {
            user: { select: { id: true, profile: { select: { handle: true, name: true, avatar: true } } } },
            media: true
        };
        if (replyToId) {
            includeObj.replyTo = { include: { user: { include: { profile: { select: { handle: true } } } } } };
        }
        const finalPost = await prisma.post.findUnique({
            where: { id: post.id },
            include: includeObj
        });
        if (finalPost && replyToId && finalPost.replyTo) {
            finalPost.replyToHandle = finalPost.replyTo.user?.profile?.handle || finalPost.replyTo.user?.handle || null;
        }

        // Notify if Reply (skip for scheduled posts - notify when published)
        if (replyToId && !scheduledAt) {
            const originalPost = await prisma.post.findUnique({ where: { id: replyToId } });
            if (originalPost && originalPost.userId !== userId) {
                await prisma.notification.create({
                    data: {
                        userId: originalPost.userId,
                        type: 'reply',
                        actorId: userId,
                        postId: post.id
                    }
                });
            }
        }

        // Emit Kafka: immediate posts -> POST_CREATED; scheduled -> POST_SCHEDULED (publisher emits POST_CREATED when due)
        const kafkaProducer = require('./kafka');
        const websocketService = require('./services/websocket.service');
        if (!scheduledAt) {
            setImmediate(() => {
                kafkaProducer.send('POST_CREATED', {
                    id: finalPost.id,
                    userId: finalPost.userId,
                    content: finalPost.content,
                    mediaCount: finalPost.media?.length || 0,
                    createdAt: finalPost.createdAt
                }).catch(kafkaError => {
                    console.error('Failed to emit POST_CREATED event:', kafkaError);
                });
                websocketService.broadcastFeedUpdate();
            });
        } else {
            setImmediate(() => {
                kafkaProducer.send('POST_SCHEDULED', {
                    id: finalPost.id,
                    userId: finalPost.userId,
                    scheduledAt: scheduledAt.toISOString(),
                    content: finalPost.content,
                    mediaCount: finalPost.media?.length || 0
                }).catch(kafkaError => {
                    console.error('Failed to emit POST_SCHEDULED event:', kafkaError);
                });
            });
        }

        res.json({ ...finalPost, scheduledAt: scheduledAt ? scheduledAt.toISOString() : null });
    } catch (error) {
        console.error('CREATE POST ERROR:', error);
        // Attempt cleanup for all files on error
        for (const file of fileList) {
            if (file && file.path) await MediaService.cleanup(file.path).catch(() => {});
        }
        res.status(500).json({ error: 'Failed to create post', details: error.message });
    }
}

// JSON route for text-only posts (polls, etc.) - MUST run before multer so body is not consumed
app.post('/', authenticateToken, async (req, res, next) => {
    const ct = (req.get('content-type') || '').toLowerCase();
    if (ct.includes('application/json')) {
        const body = req.body || {};
        try {
            await handleCreatePost(req, res, body, []);
        } catch (err) {
            console.error('[ContentService] Create post (JSON) error:', err);
            if (!res.headersSent) res.status(500).json({ error: 'Failed to create post', details: err.message });
        }
        return;
    }
    next();
});

// FormData route (with media) - runs when Content-Type is multipart
app.post('/', authenticateToken, upload.fields([{ name: 'media', maxCount: 4 }]), async (req, res) => {
    const body = req.body || {};
    const files = (req.files && req.files.media) ? (Array.isArray(req.files.media) ? req.files.media : [req.files.media]) : [];
    await handleCreatePost(req, res, body, files);
});

// Get post count for a user (Creator Studio stats - accepts x-user-id or auth)
app.get('/count', authenticateToken, async (req, res) => {
    try {
        const userId = req.headers['x-user-id'] || req.user?.userId || req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Unauthorized', count: 0 });
        const where = { userId, ...publishedPostFilter() };
        const count = await prisma.post.count({ where });
        res.json({ count });
    } catch (err) {
        console.error('[ContentService] Post count error:', err);
        res.status(500).json({ error: 'Failed to get count', count: 0 });
    }
});

// Get posts for audience insights (hashtag extraction - Creator Studio)
app.get('/for-audience-insights', authenticateToken, async (req, res) => {
    try {
        const userId = req.headers['x-user-id'] || req.user?.userId || req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Unauthorized', posts: [] });
        const where = { userId, ...publishedPostFilter() };
        const posts = await prisma.post.findMany({
            where,
            take: 100,
            select: { content: true, _count: { select: { likes: true, retweets: true, replies: true } } }
        });
        res.json({ posts });
    } catch (err) {
        console.error('[ContentService] For-audience-insights error:', err);
        res.status(500).json({ error: 'Failed', posts: [] });
    }
});

// Get engagement stats for a user (Creator Studio - likes, replies, retweets)
app.get('/engagement-stats', authenticateToken, async (req, res) => {
    try {
        const userId = req.headers['x-user-id'] || req.user?.userId || req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Unauthorized', totalEngagements: 0, totalLikes: 0, totalReplies: 0, totalRetweets: 0 });
        const where = { userId, ...publishedPostFilter() };
        const [likesCount, retweetsCount, repliesCount] = await Promise.all([
            prisma.like.count({ where: { post: where } }),
            prisma.retweet.count({ where: { post: where } }),
            prisma.post.count({ where: { replyToId: { not: null }, replyTo: { userId, ...publishedPostFilter() } } })
        ]);
        const totalEngagements = likesCount + retweetsCount + repliesCount;
        res.json({ totalEngagements, totalLikes: likesCount, totalReplies: repliesCount, totalRetweets: retweetsCount });
    } catch (err) {
        console.error('[ContentService] Engagement stats error:', err);
        res.status(500).json({ error: 'Failed', totalEngagements: 0, totalLikes: 0, totalReplies: 0, totalRetweets: 0 });
    }
});

// Get user's scheduled posts (for scheduled-posts page)
app.get('/scheduled', authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?.id
        if (!userId) return res.status(401).json({ error: 'Unauthorized' })
        const posts = await prisma.post.findMany({
            where: {
                userId,
                scheduledAt: { not: null, gt: new Date() }
            },
            orderBy: { scheduledAt: 'asc' },
            include: { user: { include: { profile: true } }, media: true }
        })
        res.json(backfillMediaUrls(posts))
    } catch (err) {
        console.error('Scheduled posts error:', err)
        res.status(500).json({ error: err.message })
    }
})

// Get Timeline - cursor-based pagination for fast initial load and "load more". Latest first.
app.get('/timeline/home', authenticateToken, async (req, res) => {
    // Prevent aggressive mobile OS caching (URLSession/OkHttp)
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');

    try {
        const currentUserId = req.user?.userId || req.user?.id;
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 30));
        const random = String(req.query.random || '').toLowerCase() === '1' || String(req.query.random || '').toLowerCase() === 'true';
        const cursor = req.query.cursor || null;
        const where = publishedPostFilter();
        const orderBy = [{ createdAt: 'desc' }, { id: 'desc' }];
        const include = {
            user: { include: { profile: true } },
            media: true,
            replyTo: { include: { user: { include: { profile: true } } } },
            _count: { select: { replies: true, likes: true, retweets: true } },
            bookmarks: { where: { userId: currentUserId || '' }, select: { id: true } },
            highlightedIn: { where: { userId: currentUserId || '' }, select: { id: true } }
        };

        // Random feed mode: return a different set on each refresh (no cursor pagination)
        if (random && !cursor) {
            const count = await prisma.post.count({ where });
            const randomOffset = Math.floor(Math.random() * Math.max(0, count - limit));
            
            const rawPosts = await prisma.post.findMany({
                where,
                include,
                take: limit,
                skip: randomOffset,
            });
            
            const posts = backfillMediaUrls(interleaveRandomFeed(rawPosts));
            return res.json({ posts, nextCursor: null, hasMore: false });
        }

        const rawPosts = await prisma.post.findMany({
            where,
            orderBy,
            take: limit,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
            include
        });
        const nextCursor = rawPosts.length === limit ? rawPosts[rawPosts.length - 1].id : null;
        const posts = backfillMediaUrls(interleaveRandomFeed(rawPosts));
        res.json({ posts, nextCursor, hasMore: !!nextCursor });
    } catch (error) {
        console.error('Timeline Error:', error);
        res.status(500).json({ error: 'Failed to fetch timeline', details: error.message });
    }
});

// --- Spike-based Trending Hashtags (X-style) ---
// Extracts hashtags from post content: #word (case-insensitive, normalized to lowercase)
function extractHashtags(content) {
    if (!content || typeof content !== 'string') return [];
    const matches = content.match(/#[a-zA-Z0-9_]+/g) || [];
    return [...new Set(matches.map(m => '#' + m.slice(1).toLowerCase()))];
}

/**
 * Shuffles an array in place using Fisher-Yates algorithm.
 */
function shuffleInPlace(arr) {
    if (!Array.isArray(arr)) return arr;
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

/**
 * Professional feed logic: Groups posts by user and interleaves them to prevent 
 * consecutive posts from the same user (unless unavoidable due to small user pool).
 * Also randomizes the order within each batch for a fresh "Discovery" feel.
 */
function interleaveRandomFeed(items, options = {}) {
    const { stable = false, seed = null } = options;
    
    // Seeded pseudo-random helper
    const seededRandom = (s) => {
        const x = Math.sin(s) * 10000;
        return x - Math.floor(x);
    };

    const seededShuffle = (arr, s) => {
        let m = arr.length, t, i;
        let currSeed = s;
        while (m) {
            i = Math.floor(seededRandom(currSeed++) * m--);
            t = arr[m];
            arr[m] = arr[i];
            arr[i] = t;
        }
        return arr;
    };
    const list = Array.isArray(items) ? items.slice() : [];
    if (list.length <= 2) return list;

    // Group posts by user ID to identify clumps
    const groups = new Map();
    for (const it of list) {
        const uid = String(it.userId || (it.user && (it.user.id || it.user.userId)) || 'anon');
        if (!groups.has(uid)) groups.set(uid, []);
        groups.get(uid).push(it);
    }

    const keys = Array.from(groups.keys());
    // Randomize within each user's internal list
    if (!stable && seed === null) {
        for (const k of keys) shuffleInPlace(groups.get(k));
    } else if (seed !== null) {
        // Seeded shuffle for stable variety
        let s = seed;
        for (const k of keys) seededShuffle(groups.get(k), s++);
    }

    const out = [];
    let prevKey = null;

    while (out.length < list.length) {
        let total = 0;
        let max = 0;
        for (const k of keys) {
            const c = groups.get(k).length;
            if (c > max) max = c;
            total += c;
        }
        if (total === 0) break;

        const criticalLimit = Math.ceil(total / 2);
        let candidates = [];
        
        // If one bucket dominates (>50%), they MUST be picked to prevent back-to-back clumping later
        if (max >= criticalLimit) {
            for (const k of keys) {
                if (groups.get(k).length >= criticalLimit && k !== prevKey) {
                    candidates.push(k);
                }
            }
        }

        // Proportional probability selection for fairer top-post randomization
        if (candidates.length === 0) {
            for (const k of keys) {
                const c = groups.get(k).length;
                if (c > 0 && k !== prevKey) {
                    for (let i = 0; i < c; i++) candidates.push(k);
                }
            }
        }

        // If forced to repeat (unavoidable), allow selection from all remaining buckets
        if (candidates.length === 0) {
            for (const k of keys) {
                if (groups.get(k).length > 0) candidates.push(k);
            }
        }

        // Pick candidate among equals
        let pick;
        if (!stable && seed === null) {
            // maintain entropy for discovery/random feeds
            pick = candidates[Math.floor(Math.random() * candidates.length)];
        } else if (seed !== null) {
            // Seeded pick for stable following variety
            candidates.sort();
            const pickIndex = Math.floor(seededRandom(seed + out.length) * candidates.length);
            pick = candidates[pickIndex];
        } else {
            // strictly deterministic
            candidates.sort();
            pick = candidates[0];
        }
        const bucket = groups.get(pick);
        const nextItem = bucket.shift();
        if (nextItem) {
            out.push(nextItem);
            prevKey = pick;
        }
    }
    
    // Safety check for edge case leftovers
    if (out.length < list.length) {
        const outIds = new Set(out.map(o => String(o.id)));
        for (const it of list) {
            if (!outIds.has(String(it.id))) out.push(it);
        }
    }

    return out;
}

// Get Trends – spike-based from real posts: sudden increase in usage, unique users, time-sensitive
app.get('/trends', async (req, res) => {
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const region = (req.query.region || req.query.location || 'India').trim() || 'India';
    const categoryLabel = `Trending in ${region}`;
    try {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const where = { ...publishedPostFilter(), createdAt: { gte: twentyFourHoursAgo } };

        const posts = await prisma.post.findMany({
            where,
            select: { id: true, content: true, userId: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
            take: 10000
        });

        const recentWindow = oneHourAgo.getTime();
        const baselineStart = twentyFourHoursAgo.getTime();
        const tagStats = new Map(); // tag -> { recentCount, baselineCount, recentUserIds: Set }

        for (const post of posts) {
            const tags = extractHashtags(post.content);
            const ts = post.createdAt.getTime();
            const inRecent = ts >= recentWindow;
            const inBaseline = ts >= baselineStart && ts < recentWindow;

            for (const tag of tags) {
                if (!tag || tag === '#') continue;
                let s = tagStats.get(tag);
                if (!s) {
                    s = { recentCount: 0, baselineCount: 0, recentUserIds: new Set() };
                    tagStats.set(tag, s);
                }
                if (inRecent) {
                    s.recentCount += 1;
                    s.recentUserIds.add(post.userId);
                } else if (inBaseline) {
                    s.baselineCount += 1;
                }
            }
        }

        let scored = [];
        for (const [topic, s] of tagStats) {
            const baseline = Math.max(s.baselineCount, 1);
            const uniqueUsers = s.recentUserIds.size;
            const spikeScore = (s.recentCount * 2 + uniqueUsers) / baseline;
            if (s.recentCount > 0) {
                scored.push({
                    topic,
                    category: categoryLabel,
                    posts: s.recentCount,
                    uniqueUsers,
                    spikeScore
                });
            }
        }
        scored.sort((a, b) => b.spikeScore - a.spikeScore);

        // Fallback: If no results in the 24-hour window, search entire history for top hashtags
        if (scored.length === 0) {
            const allTimePosts = await prisma.post.findMany({
                where: { content: { contains: '#' } },
                select: { id: true, content: true, userId: true },
                take: 5000,
                orderBy: { createdAt: 'desc' }
            });
            const allTimeStats = new Map();
            for (const post of allTimePosts) {
                const tags = extractHashtags(post.content);
                for (const tag of tags) {
                    if (!tag || tag === '#') continue;
                    allTimeStats.set(tag, (allTimeStats.get(tag) || 0) + 1);
                }
            }
            for (const [topic, count] of allTimeStats) {
                scored.push({
                    topic,
                    category: categoryLabel,
                    posts: count,
                    uniqueUsers: 1,
                    spikeScore: count
                });
            }
            scored.sort((a, b) => b.posts - a.posts);
        }

        const top = scored.slice(0, limit).map((item, i) => ({
            id: `trend-${i}-${item.topic.replace('#', '')}`,
            category: item.category,
            topic: item.topic,
            posts: item.posts
        }));

        res.json(top);
    } catch (error) {
        console.error('Trends Error:', error);
        res.status(500).json({ error: 'Failed to fetch trends' });
    }
});

// Get Explore Items
app.get('/explore', async (req, res) => {
    console.log('GET /explore hit', req.query);
    const { category, limit = 20 } = req.query;
    try {
        const where = {};
        if (category && category !== 'foryou') {
            where.category = category;
        }

        const items = await prisma.trend.findMany({
            where,
            orderBy: { posts: 'desc' },
            take: parseInt(limit)
        });

        // Fallback: If trend table is empty, return some default categories and popular hashtags formatted as trends
        if (items.length === 0) {
             const fallbackTrends = [
                 { id: 'exp-1', category: 'Technology', topic: '#Programming', posts: 12500 },
                 { id: 'exp-2', category: 'News', topic: '#WorldEvents', posts: 8900 },
                 { id: 'exp-3', category: 'Entertainment', topic: '#Movies', posts: 45000 },
                 { id: 'exp-4', category: 'Sports', topic: '#ChampionsLeague', posts: 32000 }
             ];
             return res.json(fallbackTrends);
        }

        res.json(items);

    } catch (error) {
        console.error('Explore Error:', error);
        res.status(500).json({ error: 'Failed to fetch explore items' });
    }
});

// Get Communities
app.get('/communities', async (req, res) => {
    try {
        const currentUserId = req.headers['x-user-id'] || null;
        const communities = await prisma.community.findMany({
            include: {
                members: {
                    include: {
                        user: {
                            include: { profile: true }
                        }
                    }
                },
                moderators: {
                    include: {
                        user: {
                            include: { profile: true }
                        }
                    }
                },
                _count: {
                    select: { members: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const memberIdsByCommunity = new Map();
        communities.forEach(c => {
            memberIdsByCommunity.set(c.id, new Set(c.members.map(m => m.userId)));
        });

        const transformedCommunities = communities.map(community => ({
            id: community.id,
            name: community.name,
            description: community.description,
            avatar: community.avatar,
            banner: community.banner,
            membersCount: community.membersCount,
            isJoined: currentUserId ? memberIdsByCommunity.get(community.id)?.has(currentUserId) : false,
            rules: Array.isArray(community.rules) ? community.rules : (community.rules ? [community.rules] : []),
            moderators: community.moderators.map(mod => ({
                name: mod.user.profile?.name || mod.user.email,
                handle: mod.user.profile?.handle || mod.user.email.split('@')[0],
                avatar: mod.user.profile?.avatar
            })),
            posts: [],
            members: community.members.slice(0, 5).map(member => ({
                name: member.user.profile?.name || member.user.email,
                handle: member.user.profile?.handle || member.user.email.split('@')[0],
                avatar: member.user.profile?.avatar
            }))
        }));

        // Fallback: If no communities exist, return some default ones to keep UI populated
        if (transformedCommunities.length === 0) {
            return res.json([
                {
                    id: 'comm-1',
                    name: 'Technology',
                    description: 'Latest in tech and gadgets',
                    membersCount: '1.2M',
                    isJoined: false,
                    posts: [],
                    members: []
                },
                {
                    id: 'comm-2',
                    name: 'News',
                    description: 'Global news and updates',
                    membersCount: '850K',
                    isJoined: false,
                    posts: [],
                    members: []
                }
            ]);
        }

        res.json(transformedCommunities);
    } catch (error) {
        console.error('Communities Error:', error);
        res.status(500).json({ error: 'Failed to fetch communities' });
    }
});

// Get single community detail
app.get('/communities/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const currentUserId = req.headers['x-user-id'] || null;
        const community = await prisma.community.findUnique({
            where: { id },
            include: {
                members: {
                    include: {
                        user: { include: { profile: true } }
                    },
                    orderBy: { joinedAt: 'desc' },
                    take: 50
                },
                moderators: {
                    include: {
                        user: { include: { profile: true } }
                    }
                },
                posts: {
                    include: {
                        post: {
                            include: {
                                user: { include: { profile: true } },
                                media: true,
                                _count: { select: { likes: true, replies: true, retweets: true } }
                            }
                        }
                    },
                    orderBy: { post: { createdAt: 'desc' } },
                    take: 50
                }
            }
        });
        if (!community) {
            return res.status(404).json({ error: 'Community not found' });
        }
        const isJoined = currentUserId ? community.members.some(m => m.userId === currentUserId) : false;
        const rules = Array.isArray(community.rules) ? community.rules : (community.rules ? [community.rules] : []);
        res.json({
            id: community.id,
            name: community.name,
            description: community.description,
            avatar: community.avatar,
            banner: community.banner,
            membersCount: community.membersCount,
            isJoined,
            rules,
            moderators: community.moderators.map(mod => ({
                name: mod.user.profile?.name || mod.user.email,
                handle: mod.user.profile?.handle || mod.user.email.split('@')[0],
                avatar: mod.user.profile?.avatar
            })),
            members: community.members.map(member => ({
                name: member.user.profile?.name || member.user.email,
                handle: member.user.profile?.handle || member.user.email.split('@')[0],
                avatar: member.user.profile?.avatar
            })),
            posts: community.posts.map(cp => ({
                ...cp.post,
                user: cp.post.user,
                _count: cp.post._count
            }))
        });
    } catch (error) {
        console.error('Community detail error:', error);
        res.status(500).json({ error: 'Failed to fetch community' });
    }
});

// Join community
app.post('/communities/:id/join', async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });
        const { id } = req.params;
        const community = await prisma.community.findUnique({ where: { id } });
        if (!community) return res.status(404).json({ error: 'Community not found' });
        await prisma.communityMember.upsert({
            where: {
                userId_communityId: { userId, communityId: id }
            },
            create: { userId, communityId: id },
            update: {}
        });
        res.json({ status: true, message: 'Joined community', isJoined: true });
    } catch (error) {
        console.error('Join community error:', error);
        res.status(500).json({ error: 'Failed to join community' });
    }
});

// Leave community
app.post('/communities/:id/leave', async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });
        const { id } = req.params;
        await prisma.communityMember.deleteMany({
            where: { userId, communityId: id }
        });
        res.json({ status: true, message: 'Left community', isJoined: false });
    } catch (error) {
        console.error('Leave community error:', error);
        res.status(500).json({ error: 'Failed to leave community' });
    }
});

// Get community members
app.get('/communities/:id/members', async (req, res) => {
    try {
        const { id } = req.params;
        const { limit = 50, offset = 0 } = req.query;
        const community = await prisma.community.findUnique({ where: { id } });
        if (!community) return res.status(404).json({ error: 'Community not found' });
        const members = await prisma.communityMember.findMany({
            where: { communityId: id },
            include: { user: { include: { profile: true } } },
            take: parseInt(limit) || 50,
            skip: parseInt(offset) || 0,
            orderBy: { joinedAt: 'desc' }
        });
        res.json(members.map(m => ({
            name: m.user.profile?.name || m.user.email,
            handle: m.user.profile?.handle || m.user.email.split('@')[0],
            avatar: m.user.profile?.avatar,
            joinedAt: m.joinedAt
        })));
    } catch (error) {
        console.error('Community members error:', error);
        res.status(500).json({ error: 'Failed to fetch members' });
    }
});





// Get Single Post - Moved to bottom to avoid conflicts
// app.get('/:id', ...)

// Get posts liked by a user (for profile Likes tab)
app.get('/liked', optionalAuthenticateToken, async (req, res) => {
    try {
        const raw = req.query.userId;
        const queryUserId = (typeof raw === 'string' && raw.trim() && raw !== 'undefined') ? raw.trim() : null;
        const currentUserId = req.user?.userId || req.user?.id || null;
        const targetUserId = queryUserId || currentUserId;
        if (!targetUserId) {
            return res.status(401).json({ error: 'Unauthorized', posts: [] });
        }
        const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
        const postInclude = {
            user: { include: { profile: true } },
            media: true,
            replyTo: { include: { user: { include: { profile: true } } } },
            _count: { select: { replies: true, likes: true, retweets: true } }
        };
        if (currentUserId) {
            postInclude.likes = { where: { userId: currentUserId }, select: { id: true } };
            postInclude.bookmarks = { where: { userId: currentUserId }, select: { id: true } };
            postInclude.highlightedIn = { where: { userId: currentUserId }, select: { id: true } };
        }
        const likes = await prisma.like.findMany({
            where: { userId: targetUserId },
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: { post: { include: postInclude } }
        });
        const now = new Date();
        const posts = backfillMediaUrls(
            likes.map((l) => l.post).filter((p) => p && (!p.scheduledAt || new Date(p.scheduledAt) <= now))
        );
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        res.json({ posts });
    } catch (err) {
        console.error('[ContentService] GET /liked error:', err);
        res.status(500).json({ error: 'Failed to fetch liked posts', posts: [] });
    }
});

// Derive legacy `mediaUrls` (JSON string array) from `media` rows when DB column is empty; recurse into replyTo.
function urlsFromPostMedia(post) {
    if (!post || !Array.isArray(post.media) || post.media.length === 0) return null;
    // Some records return `mediaUrl`, others use legacy `url`.
    const urls = post.media
        .map((m) => m && (m.mediaUrl || m.url))
        .filter(Boolean);
    return urls.length ? urls : null;
}

function needsMediaUrlsBackfill(post, urls) {
    if (!urls || urls.length === 0) return false;
    const mu = post.mediaUrls;
    if (mu == null || mu === undefined) return true;
    if (typeof mu === 'string') {
        const t = mu.trim();
        if (!t || t === '[]' || t === 'null') return true;
    }
    return false;
}

function normalizePostMediaUrlsInTree(post) {
    if (!post) return post;
    const urls = urlsFromPostMedia(post);
    let next = post;
    if (needsMediaUrlsBackfill(post, urls)) {
        next = { ...post, mediaUrls: JSON.stringify(urls) };
    }
    if (next.replyTo) {
        const nested = normalizePostMediaUrlsInTree(next.replyTo);
        if (nested !== next.replyTo) {
            next = { ...next, replyTo: nested };
        }
    }
    return next;
}

function backfillMediaUrls(posts) {
    if (!Array.isArray(posts)) return posts;
    return posts.map((p) => normalizePostMediaUrlsInTree(p));
}

// Get All Posts (Feed compatible) - public when no auth; with auth includes bookmarks
app.get('/', optionalAuthenticateToken, async (req, res) => {
    console.log(`[ContentService] GET / posts hit. User: ${req.user?.userId || 'anonymous'}`);
    try {
        // Avoid any intermediary/proxy caching for feed requests.
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Surrogate-Control', 'no-store');

        const { userId, repliesOnly, excludeReplies, topLevelOnly, limit, offset, skip, cursor, seed } = req.query;
        const currentUserId = req.user?.userId || req.user?.id || null;

        const where = { ...publishedPostFilter() };
        if (userId) where.userId = userId;
        const isTruthy = (v) => {
            if (v === true) return true;
            const s = String(v ?? '').trim().toLowerCase();
            return s === 'true' || s === '1' || s === 'yes' || s === 'y' || s === 'on';
        };
        if (isTruthy(repliesOnly)) where.replyToId = { not: null };
        // excludeReplies/topLevelOnly means only top-level posts (no replies)
        if (isTruthy(excludeReplies) || isTruthy(topLevelOnly)) where.replyToId = null;

        console.log(`[ContentService] Feed Params:`, { userId, repliesOnly, excludeReplies, query: req.query });

        const takeRaw = parseInt(limit, 10);
        const take = Number.isFinite(takeRaw) && takeRaw > 0 ? Math.min(takeRaw, 100) : 20;
        const skipRaw = parseInt(offset ?? skip, 10);
        const skipCount = Number.isFinite(skipRaw) && skipRaw > 0 ? skipRaw : 0;

        const includeOpt = {
            user: { include: { profile: true } },
            media: true,
            replyTo: { include: { user: { include: { profile: true } } } },
            _count: { select: { replies: true, likes: true, retweets: true } }
        };
        if (currentUserId) {
            includeOpt.bookmarks = { where: { userId: currentUserId }, select: { id: true } };
            includeOpt.highlightedIn = { where: { userId: currentUserId }, select: { id: true } };
            includeOpt.likes = { where: { userId: currentUserId }, select: { id: true } };
            includeOpt.retweets = { where: { userId: currentUserId }, select: { id: true } };
        } else {
            includeOpt.bookmarks = { where: { userId: '' }, select: { id: true } };
            includeOpt.highlightedIn = { where: { userId: '' }, select: { id: true } };
        }
        
        // Ensure latest posts are first
        const orderBy = [{ createdAt: 'desc' }, { id: 'desc' }];

        // Offset-based pagination prioritized over complex cursor logic for reliable ordering
        let fetchedPosts = [];
        let nextCursor = null;
        let hasMore = false;

        // If cursor is provided, try cursor pagination, otherwise default to offset
        if (cursor && !skipCount) {
             const cursorId = String(cursor);
             const cursorPost = await prisma.post.findUnique({
                 where: { id: cursorId },
                 select: { id: true, createdAt: true }
             });

             const cursorCreatedAt = cursorPost?.createdAt || null;

             const cursorWhere = cursorCreatedAt
                 ? {
                     AND: [
                         where,
                         {
                             OR: [
                                 { createdAt: { lt: cursorCreatedAt } },
                                 { AND: [{ createdAt: cursorCreatedAt }, { id: { lt: cursorId } }] }
                             ]
                         }
                     ]
                 }
                 : where;

             const cursorRows = await prisma.post.findMany({
                 where: cursorWhere,
                 take: take + 1,
                 orderBy,
                 include: includeOpt
             });
             hasMore = cursorRows.length > take;
             fetchedPosts = hasMore ? cursorRows.slice(0, take) : cursorRows;
             nextCursor = hasMore && fetchedPosts.length ? fetchedPosts[fetchedPosts.length - 1].id : null;
             
             // Shuffle only for discovery/general feeds (not specific users/communities)
             const shouldShuffle = !userId && !req.query.communityId && !req.query.search;
             const posts = backfillMediaUrls(shouldShuffle ? interleaveRandomFeed(fetchedPosts, { seed: seed ? parseInt(seed, 10) : null }) : fetchedPosts);
             
             return res.json({ posts, nextCursor, hasMore });
        }
        // Optimized Retrieval Strategy: Discovery/For-You Mix (50% Recent, 30% Popular, 20% Random)
        const isDiscovery = !userId && !req.query.communityId && !req.query.search;
        
        if (isDiscovery && seed) {
            const recentLimit = Math.ceil(take * 0.5);
            const popularLimit = Math.ceil(take * 0.3);
            const randomLimit = Math.max(1, take - recentLimit - popularLimit);

            // 1. Decode Fused Cursor
            let cursors = { recentOffset: 0, popularOffset: 0, randomOffset: 0 };
            if (cursor) {
                try {
                    const decoded = Buffer.from(String(cursor), 'base64').toString();
                    cursors = { ...cursors, ...JSON.parse(decoded) };
                } catch (e) {
                    console.error('[ContentService] Cursor Parse Error:', e);
                }
            }

            const seedInt = parseInt(String(seed).replace(/[^0-9]/g, '').slice(0, 8), 10) || 0;
            console.log(`[ContentService] DISCOVERY FEED: seed=${seed}, seedInt=${seedInt}, cursor=${cursor ? 'YES' : 'NO'}`);

            // 2. Fetch Streams
            const lastMonth = new Date();
            lastMonth.setMonth(lastMonth.getMonth() - 1);

            const totalCount = await prisma.post.count({ where });
            const driftLimit = Math.min(totalCount, 5000);

            // Use seed to drift the starting point of "Recent" and "Popular" for variety
            const recentStart = cursors.recentOffset || (seedInt % Math.max(1, driftLimit)); // Drift within top 5000
            const popularStart = cursors.popularOffset || (seedInt % Math.max(1, driftLimit)); // Drift within top 5000

            const [recentRows, popularRows] = await Promise.all([
                prisma.post.findMany({
                    where,
                    take: recentLimit + 1,
                    skip: recentStart,
                    orderBy: { createdAt: 'desc' },
                    include: includeOpt
                }),
                prisma.post.findMany({
                    where: {
                        ...where,
                        createdAt: { gte: lastMonth } // Limit popularity scan to recent posts
                    },
                    take: popularLimit + 1,
                    skip: popularStart,
                    orderBy: [
                        { likes: { _count: 'desc' } },
                        { createdAt: 'desc' }
                    ],
                    include: includeOpt
                })
            ]);

            // Random stream uses a stable offset derived from seed + session progress
            const initialRandomOffset = seedInt % Math.max(1, totalCount - take);
            const currentRandomOffset = (initialRandomOffset + (cursors.randomOffset || 0)) % Math.max(1, totalCount);

            const randomRows = await prisma.post.findMany({
                where,
                take: randomLimit + 1,
                skip: currentRandomOffset,
                orderBy: { id: 'asc' }, // Stable order for offset pagination
                include: includeOpt
            });

            // 3. Merge and Deduplicate
            const seenIds = new Set();
            const merged = [];
            const addBatch = (batch, limit) => {
                let count = 0;
                for (const p of batch) {
                    if (count >= limit) break;
                    if (!seenIds.has(p.id)) {
                        seenIds.add(p.id);
                        merged.push(p);
                        count++;
                    }
                }
            };

            addBatch(recentRows, recentLimit);
            addBatch(popularRows, popularLimit);
            addBatch(randomRows, randomLimit);

            // 4. Update Cursors
            const nextCursors = {
                recentOffset: recentStart + recentLimit,
                popularOffset: popularStart + popularLimit,
                randomOffset: (cursors.randomOffset || 0) + randomLimit
            };

            hasMore = recentRows.length > recentLimit || popularRows.length > popularLimit || (nextCursors.randomOffset < totalCount);
            nextCursor = hasMore ? Buffer.from(JSON.stringify(nextCursors)).toString('base64') : null;

            // Re-shuffle to prevent grouping same types or same users
            const shuffled = backfillMediaUrls(interleaveRandomFeed(merged, { seed: seedInt }));
            
            return res.json({ 
                posts: shuffled, 
                nextCursor, 
                hasMore 
            });
        }

        // Fallback: Standard Pagination (Profiles, Searches, Bookmarks, or No Seed)
        fetchedPosts = [];
        nextCursor = null;
        hasMore = false;
        const orderByCombined = [{ createdAt: 'desc' }, { id: 'desc' }];

        const rows = await prisma.post.findMany({
            where,
            take: take + 1,
            ...(cursor ? { cursor: { id: String(cursor) }, skip: 1 } : { skip: skipCount }),
            orderBy: orderByCombined,
            include: includeOpt
        });

        hasMore = rows.length > take;
        fetchedPosts = hasMore ? rows.slice(0, take) : rows;
        nextCursor = hasMore && fetchedPosts.length ? fetchedPosts[fetchedPosts.length - 1].id : null;

        const resultPosts = backfillMediaUrls(isDiscovery ? interleaveRandomFeed(fetchedPosts, { seed: seed ? parseInt(seed, 10) : null }) : fetchedPosts);
        res.json({ posts: resultPosts, nextCursor, hasMore });
    } catch (error) {
        console.error('[ContentService] Feed Error:', error);
        if (error && error.code === 'P2022') {
            return res.json({ posts: [] });
        }
        res.status(500).json({ error: 'Failed' });
    }
});

// Get Following Feed
app.get('/following', authenticateToken, async (req, res) => {
    try {
        // Prevent caching to serve fresh feed
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Surrogate-Control', 'no-store');

        const currentUserId = req.user?.userId || req.user?.id;
        if (!currentUserId) {
            return res.status(401).json({ error: 'Unauthorized', posts: [], nextCursor: null, hasMore: false });
        }
        const { limit, offset, skip, cursor, excludeReplies, topLevelOnly, seed } = req.query;

        console.log(`[ContentService] Following Feed Params:`, { excludeReplies, query: req.query });

        // Primary source: local follow table in this service DB.
        const following = await prisma.follow.findMany({
            where: { followerId: currentUserId },
            select: { followingId: true }
        });

        let followingIds = following.map(f => f.followingId).filter(Boolean);

        // Fallback source: user-service (authoritative follow graph in some deployments).
        if (followingIds.length === 0) {
            try {
                const gatewayBase = process.env.GATEWAY_URL || 'http://localhost:3001';
                const authHeader = req.headers?.authorization || '';
                const resp = await axios.get(
                    `${gatewayBase.replace(/\/$/, '')}/api/users/${currentUserId}/following`,
                    {
                        headers: authHeader ? { Authorization: authHeader } : {},
                        timeout: 4000
                    }
                );
                const remote = Array.isArray(resp.data) ? resp.data : [];
                followingIds = remote
                    .map((u) => u?.id)
                    .filter(Boolean);
            } catch (fallbackErr) {
                console.warn('[ContentService] Following fallback (user-service) failed:', fallbackErr?.message || fallbackErr);
            }
        }

        if (followingIds.length === 0) {
            return res.json({ posts: [], nextCursor: null, hasMore: false });
        }

        const takeRaw = parseInt(limit, 10);
        const requestedLimit = Number.isFinite(takeRaw) && takeRaw > 0 ? Math.min(takeRaw, 100) : 20;
        
        const skipRaw = parseInt(cursor ?? offset ?? skip, 10);
        const skipCount = Number.isFinite(skipRaw) && skipRaw > 0 ? skipRaw : 0;

        const publishedFilter = publishedPostFilter();
        const where = {
             ...publishedFilter,
             userId: { in: followingIds }
        };

        const isTruthy = (v) => {
            if (v === true) return true;
            const s = String(v ?? '').trim().toLowerCase();
            return s === 'true' || s === '1' || s === 'yes' || s === 'y' || s === 'on';
        };

        if (isTruthy(excludeReplies) || isTruthy(topLevelOnly)) {
            where.replyToId = null;
        }

        const orderBy = [{ createdAt: 'desc' }, { id: 'desc' }];

        // Optimized Retrieval Strategy:
        // Use a single query with the composite index [userId, createdAt]
        // This is much faster than 50 parallel queries and handles large follow lists efficiently.
        const rawBatch = await prisma.post.findMany({
            where,
            take: 1000,
            skip: skipCount,
            orderBy,
            select: { id: true, userId: true, createdAt: true }
        });

        // Step 2 - Interleave the IDs to ensure user variety (stable order for following tab if seed provided)
        const interleavedRaw = interleaveRandomFeed(rawBatch, { 
            seed: seed ? parseInt(seed, 10) : null,
            stable: !seed // if no seed, use strict deterministic mode
        });
        
        // Step 3 - Take the top N IDs and fetch their full content
        const targetIds = interleavedRaw.slice(0, requestedLimit).map(p => p.id).filter(Boolean);
        if (targetIds.length === 0) {
            return res.json({ posts: [], nextCursor: null, hasMore: false });
        }
        
        // hasMore is true if we have more interleaved posts left, OR if the rawBatch was full (suggesting more in DB)
        const hasMore = interleavedRaw.length > requestedLimit || rawBatch.length >= 1000;
        const nextCursor = hasMore ? (skipCount + requestedLimit) : null;

        const posts = await prisma.post.findMany({
            where: { id: { in: targetIds } },
            include: {
                user: { include: { profile: true } },
                media: true,
                replyTo: { include: { user: { include: { profile: true } } } },
                _count: { select: { replies: true, likes: true, retweets: true } },
                likes: {
                    where: { userId: currentUserId },
                    select: { id: true }
                },
                retweets: {
                    where: { userId: currentUserId },
                    select: { id: true }
                },
                bookmarks: { where: { userId: currentUserId }, select: { id: true } }
            }
        });

        // Re-apply interleaving order to the final result
        const postMap = new Map(posts.map(p => [p.id, p]));
        const orderedPosts = targetIds.map(id => postMap.get(id)).filter(Boolean);

        // Sanitize users in posts
        const safePosts = orderedPosts.map(post => {
            if (post.user) {
                const { passwordHash, ...safeUser } = post.user;
                post.user = safeUser;
            }
            return post;
        });

        res.json({ posts: backfillMediaUrls(safePosts), nextCursor, hasMore });
    } catch (error) {
        console.error('Following Feed Error:', error);
        res.status(500).json({ error: 'Failed to fetch following feed' });
    }
});



// Like Post
app.post('/:id/like', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;

    try {
        // Toggle like (simple implementation: if exists, do nothing or throw, frontend handles toggle via delete)
        // But for specific POST endpoint, we assume CREATE like.
        // Check if already liked to avoid error
        const existingLike = await prisma.like.findUnique({
            where: {
                postId_userId: {
                    userId,
                    postId: id
                }
            }
        });

        if (existingLike) {
            return res.json(existingLike);
        }

        const like = await prisma.like.create({
            data: {
                userId,
                postId: id
            }
        });

        // Notification
        const post = await prisma.post.findUnique({ where: { id } });
        if (post && post.userId !== userId) {
            await prisma.notification.create({
                data: {
                    userId: post.userId,
                    type: 'like',
                    actorId: userId,
                    postId: id
                }
            });
        }

        res.json(like);
    } catch (error) {
        console.error('Like Error:', error);
        res.status(500).json({ error: 'Failed to like post' });
    }
});

// Unlike Post
app.delete('/:id/like', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;

    try {
        await prisma.like.delete({
            where: {
                postId_userId: {
                    userId,
                    postId: id
                }
            }
        });
        res.json({ success: true });
    } catch (error) {
        if (error.code === 'P2025') { // Record not found
            return res.json({ success: true });
        }
        console.error('Unlike Error:', error);
        res.status(500).json({ error: 'Failed to unlike post' });
    }
});

// Retweet Post
app.post('/:id/retweet', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;

    try {
        const existingRetweet = await prisma.retweet.findUnique({
            where: {
                postId_userId: {
                    userId,
                    postId: id
                }
            }
        });

        if (existingRetweet) return res.json(existingRetweet);

        const retweet = await prisma.retweet.create({
            data: {
                userId,
                postId: id
            }
        });

        const post = await prisma.post.findUnique({ where: { id } });
        if (post && post.userId !== userId) {
            await prisma.notification.create({
                data: {
                    userId: post.userId,
                    type: 'repost', // Unified to 'repost' for frontend consistency
                    actorId: userId,
                    postId: id
                }
            });
        }

        res.json(retweet);
    } catch (error) {
        console.error('Retweet Error:', error);
        res.status(500).json({ error: 'Failed to retweet post' });
    }
});

// Unretweet Post
app.delete('/:id/retweet', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;

    try {
        await prisma.retweet.delete({
            where: {
                postId_userId: {
                    userId,
                    postId: id
                }
            }
        });
        res.json({ success: true });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.json({ success: true });
        }
        console.error('Unretweet Error:', error);
        res.status(500).json({ error: 'Failed to unretweet post' });
    }
});

// Create Reply - POST /api/posts/:id/replies
app.post('/:id/replies', authenticateToken, async (req, res) => {
    const postId = req.params.id;
    const body = req.body || {};
    const content = typeof body.content === 'string' ? body.content.trim() : '';

    if (!content) {
        return res.status(400).json({ error: 'Content is required for a reply' });
    }

    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const parentPost = await prisma.post.findUnique({ where: { id: postId } });
        if (!parentPost) {
            return res.status(404).json({ error: 'Post not found' });
        }

        await handleCreatePost(req, res, { content, replyToId: postId }, []);
    } catch (error) {
        if (!res.headersSent) {
            console.error('[ContentService] Create reply error:', error);
            res.status(500).json({ error: 'Failed to create reply', details: error.message });
        }
    }
});

// Get Post Replies
app.get('/:id/replies', async (req, res) => {
    try {
        const replies = await prisma.post.findMany({
            where: { replyToId: req.params.id },
            orderBy: { createdAt: 'desc' },
            include: {
                user: { include: { profile: true } },
                media: true,
                replyTo: { include: { user: { include: { profile: true } } } },
                _count: { select: { replies: true, likes: true, retweets: true } }
            }
        });
        res.json(backfillMediaUrls(replies));
    } catch (error) {
        console.error('Get Replies Error:', error);
        res.status(500).json({ error: 'Failed to fetch replies' });
    }
});



// Delete Post
app.delete('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;

    try {
        const post = await prisma.post.findUnique({ where: { id } });

        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        if (post.userId !== userId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        await prisma.post.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        console.error('Delete Post Error:', error);
        res.status(500).json({ error: 'Failed to delete post' });
    }
});

// Bookmark Post
app.post('/:id/bookmark', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;

    try {
        const existing = await prisma.bookmark.findUnique({
            where: { postId_userId: { postId: id, userId } }
        });

        if (existing) {
            return res.json(existing);
        }

        const bookmark = await prisma.bookmark.create({
            data: { postId: id, userId }
        });

        res.json(bookmark);
    } catch (error) {
        console.error('Bookmark Error:', error);
        res.status(500).json({ error: 'Failed to bookmark post' });
    }
});

// Remove Bookmark
app.delete('/:id/bookmark', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;

    try {
        await prisma.bookmark.deleteMany({
            where: { postId: id, userId }
        });
        res.json({ success: true });
    } catch (error) {
        console.error('Remove Bookmark Error:', error);
        res.status(500).json({ error: 'Failed to remove bookmark' });
    }
});

// Get Bookmarks
app.get('/bookmarks', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const { limit = 20, offset = 0, cursor, search } = req.query;

    try {
        const take = parseInt(limit) || 20;
        const skipCount = parseInt(offset) || 0;

        let where;

        if (search && search.trim()) {
            const s = search.trim();
            // Must be bookmarked by user AND match search across content/author name/handle
            where = {
                AND: [
                    { bookmarks: { some: { userId } } },
                    {
                        OR: [
                            { content: { contains: s, mode: 'insensitive' } },
                            { user: { profile: { name: { contains: s, mode: 'insensitive' } } } },
                            { user: { profile: { handle: { contains: s, mode: 'insensitive' } } } }
                        ]
                    }
                ]
            };
        } else {
            where = { bookmarks: { some: { userId } } };
        }

        const posts = await prisma.post.findMany({
            where,
            include: {
                user: { include: { profile: true } },
                media: true,
                _count: {
                    select: { likes: true, retweets: true, replies: true }
                },
                likes: { where: { userId }, select: { id: true } },
                bookmarks: { where: { userId }, select: { id: true } }
            },
            take: take + 1,
            ...(cursor ? { cursor: { id: String(cursor) }, skip: 1 } : { skip: skipCount }),
            orderBy: { createdAt: 'desc' }
        });

        const hasMore = posts.length > take;
        const fetchedPosts = hasMore ? posts.slice(0, take) : posts;
        const nextCursor = hasMore && fetchedPosts.length ? fetchedPosts[fetchedPosts.length - 1].id : null;

        const safePosts = backfillMediaUrls(fetchedPosts.map(post => {
            if (post.user) {
                const { passwordHash, ...safeUser } = post.user;
                return { ...post, user: safeUser };
            }
            return post;
        }));

        res.json({ 
            posts: safePosts,
            nextCursor,
            hasMore
        });
    } catch (error) {
        console.error('Get Bookmarks Error:', error);
        res.status(500).json({ posts: [], hasMore: false, nextCursor: null, error: error.message });
    }
});


// Get Notifications
app.get('/notifications', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const { limit = 20, offset = 0, unreadOnly = false, filter } = req.query;

    try {
        const where = { userId };

        if (unreadOnly === 'true') {
            where.read = false;
        }

        if (filter === 'mentions') {
            where.type = 'mention';
        }

        if (filter === 'verified') {
            where.actor = { profile: { verified: true } };
        }

        const notifications = await prisma.notification.findMany({
            where,
            include: {
                actor: { include: { profile: true } },
                post: true
            },
            take: parseInt(limit) || 20,
            skip: parseInt(offset) || 0,
            orderBy: { createdAt: 'desc' }
        });

        // Normalize actors for frontend
        const mapped = notifications.map(n => {
            const actor = n.actor || {};
            const profile = actor.profile || {};
            const emailPrefix = (actor.email || '').split('@')[0] || 'user';
            const handle = profile.handle || actor.handle || emailPrefix;
            const name = profile.name || actor.name || handle.charAt(0).toUpperCase() + handle.slice(1);

            return {
                ...n,
                actor: {
                    ...actor,
                    name,
                    handle,
                    profile: {
                        ...profile,
                        name,
                        handle
                    }
                }
            };
        });

        res.json(mapped);

    } catch (error) {
        console.error('Get Notifications Error:', error);
        res.status(500).json({ error: 'Failed to get notifications' });
    }
});

// Mark Notification as Read
app.put('/notifications/:id/read', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;

    try {
        const notification = await prisma.notification.update({
            where: { id, userId },
            data: { read: true }
        });
        res.json(notification);
    } catch (error) {
        console.error('Mark as Read Error:', error);
        res.status(404).json({ error: 'Notification not found' });
    }
});

// Get Spaces
app.get('/spaces', async (req, res) => {
    try {
        const spaces = await prisma.space.findMany({
            include: {
                host: {
                    include: { profile: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(spaces);
    } catch (error) {
        console.error('Get Spaces Error:', error);
        res.status(500).json({ error: 'Failed to get spaces' });
    }
});

// Create Space
app.post('/spaces', authenticateToken, async (req, res) => {
    const { title, topics, status = 'scheduled', scheduledAt } = req.body;
    const hostId = req.user.userId;

    try {
        const space = await prisma.space.create({
            data: {
                title,
                topics,
                status, // 'live' or 'scheduled'
                scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
                startedAt: status === 'live' ? new Date() : null,
                hostId
            }
        });
        res.json(space);
    } catch (error) {
        console.error('Create Space Error:', error);
        res.status(500).json({ error: 'Failed to create space' });
    }
});

// Get Single Post - Moved to bottom to avoid conflicts
app.get('/:id', optionalAuthenticateToken, async (req, res) => {
    console.log('GET /:id hit', req.params.id);
    const currentUserId = req.user?.userId || req.user?.id || null;
    try {
        const postInclude = {
            user: { include: { profile: true } },
            media: true,
            replyTo: { include: { user: { include: { profile: true } } } },
            _count: { select: { replies: true, likes: true, retweets: true } }
        };
        if (currentUserId) {
            postInclude.likes = { where: { userId: currentUserId }, select: { id: true } };
            postInclude.bookmarks = { where: { userId: currentUserId }, select: { id: true } };
            // Note: highlightedIn is the relation name from Post to Highlight
            postInclude.highlightedIn = { where: { userId: currentUserId }, select: { id: true } };
        }

        const post = await prisma.post.findUnique({
            where: { id: req.params.id },
            include: postInclude
        });
        if (!post) return res.status(404).json({ error: `Post not found (ID: ${req.params.id})` });
        res.json(normalizePostMediaUrlsInTree(post));
    } catch (error) {
        console.error('Get Post Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Mark All Notifications as Read
app.put('/notifications/read-all', authenticateToken, async (req, res) => {
    const userId = req.user?.userId || req.user?.sub;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    try {
        const result = await prisma.notification.updateMany({
            where: { userId, read: false },
        });
        res.json({ count: result.count });
    } catch (error) {
        console.error('Mark All as Read Error:', error);
        res.json({ count: 0 });
    }
});

// GET /:postId/analytics - per-post analytics (owner only)
app.get('/:postId/analytics', authenticateToken, async (req, res) => {
    const { postId } = req.params;
    const currentUserId = req.user?.userId || req.user?.id || null;

    if (!currentUserId) {
        return res.status(401).json({ status: false, message: 'Unauthorized', data: null });
    }

    try {
        const post = await prisma.post.findUnique({
            where: { id: postId },
            include: {
                user: { include: { profile: true } },
                media: true,
                _count: {
                    select: {
                        likes: true,
                        retweets: true,
                        replies: true,
                        bookmarks: true,
                    }
                },
                likes: { where: { userId: currentUserId }, select: { id: true } },
                bookmarks: { where: { userId: currentUserId }, select: { id: true } },
            }
        });

        if (!post) {
            return res.status(404).json({ status: false, message: 'Post not found', data: null });
        }

        // Only the post owner can view analytics
        if (post.userId !== currentUserId) {
            return res.status(403).json({ status: false, message: 'You can only view analytics for your own posts', data: null });
        }


        // Fetch recent likers (up to 5) so the modal can show faces
        const recentLikers = await prisma.like.findMany({
            where: { postId },
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: {
                user: {
                    select: {
                        id: true,
                        profile: { select: { handle: true, name: true, avatar: true, verified: true } }
                    }
                }
            }
        });

        const likes = post._count.likes;
        const reposts = post._count.retweets;
        const replies = post._count.replies;
        const bookmarks = post._count.bookmarks;
        const engagements = likes + reposts + replies + bookmarks;

        const data = {
            postId: post.id,
            author: {
                id: post.user?.id,
                name: post.user?.profile?.name || post.user?.handle || 'Unknown',
                handle: post.user?.profile?.handle || 'unknown',
                avatar: post.user?.profile?.avatar || null,
                verified: post.user?.profile?.verified || false,
            },
            content: post.content || '',
            createdAt: post.createdAt,
            media: post.media || [],
            metrics: {
                likes,
                reposts,
                replies,
                bookmarks,
                engagements,
                // Views tracked via `views` field if it exists, or fallback to 0
                impressions: post.views || 0,
                profileVisits: 0,   // Not tracked per-post yet
                detailExpands: 0,   // Not tracked per-post yet
                linkClicks: 0,      // Not tracked per-post yet
            },
            recentLikers: recentLikers.map(l => ({
                id: l.user?.id,
                name: l.user?.profile?.name || l.user?.handle || 'User',
                handle: l.user?.profile?.handle || 'unknown',
                avatar: l.user?.profile?.avatar || null,
                verified: l.user?.profile?.verified || false,
            }))
        };

        return res.json({ status: true, message: 'Analytics fetched', data });
    } catch (err) {
        console.error('[ContentService] Post analytics error:', err);
        return res.status(500).json({ status: false, message: 'Failed to fetch analytics', data: null });
    }
});

const http = require('http');
const websocketService = require('./services/websocket.service');
const redisService = require('./services/redis.service');
const { startScheduledPostPublisher } = require('./scheduledPostPublisher');

const server = http.createServer(app);

const bindHost = process.env.BIND_HOST || '0.0.0.0';

async function ensureArticleSchemaCompatibility() {
    // Self-heal when DB misses the Article table but service code is already deployed.
    await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Article" (
            "id" TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            "title" TEXT NOT NULL,
            "content" TEXT NOT NULL,
            "coverImage" TEXT,
            "isPublished" BOOLEAN NOT NULL DEFAULT false,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "Article_pkey" PRIMARY KEY ("id"),
            CONSTRAINT "Article_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
        )
    `);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Article_userId_idx" ON "Article"("userId")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Article_createdAt_idx" ON "Article"("createdAt")`);
}

ensureArticleSchemaCompatibility()
    .then(async () => {
        await redisService.init();
        websocketService.init(server);
        server.listen(PORT, bindHost, () => {
            console.log(`Content Service with WebSockets running on port ${PORT} (bound to ${bindHost})`);
            startScheduledPostPublisher(); // Kafka-driven scheduled post publishing (every 60s)
        });
    })
    .catch((err) => {
        console.error('Failed to ensure article schema compatibility on startup:', err);
        process.exit(1);
    });
