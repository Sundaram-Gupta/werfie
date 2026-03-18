require('dotenv').config();
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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

// Generic Rewrite Middleware - MOVED TO TOP for consistent routing
app.use((req, res, next) => {
    // console.log(`[ContentService] Incoming: ${req.method} ${req.url}`);
    if (req.path.startsWith('/api/posts')) {
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

// Backup registration in case rewrite fails or is skipped
app.use('/api/soapbox', soapboxRoutes);
app.use('/api/debate', debateRoutes);

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
    const { q, limit = 20, offset = 0 } = req.query;

    if (!q || q.trim().length === 0) {
        return res.json([]);
    }

    try {
        const posts = await prisma.post.findMany({
            where: {
                content: {
                    contains: q,
                    mode: 'insensitive'
                }
            },
            include: {
                user: {
                    include: { profile: true }
                },
                media: true,
                _count: {
                    select: { likes: true, retweets: true, replies: true }
                }
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

        res.json(safePosts);
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
                if (file.mimetype.startsWith('image/')) {
                    processedMedia = await MediaService.processImage(file);
                } else if (file.mimetype.startsWith('video/')) {
                    processedMedia = await MediaService.processVideo(file);
                } else if (file.mimetype.startsWith('audio/')) {
                    processedMedia = await MediaService.processAudio(file);
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
        res.json(posts)
    } catch (err) {
        console.error('Scheduled posts error:', err)
        res.status(500).json({ error: err.message })
    }
})

// Get Timeline - cursor-based pagination for fast initial load and "load more". Latest first.
app.get('/timeline/home', authenticateToken, async (req, res) => {
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
            bookmarks: { where: { userId: currentUserId || '' }, select: { id: true } }
        };

        // Random feed mode: return a different set on each refresh (no cursor pagination)
        if (random && !cursor) {
            const idsRows = await prisma.$queryRaw`
                SELECT "id"
                FROM "Post"
                WHERE ("scheduledAt" IS NULL OR "scheduledAt" <= NOW())
                ORDER BY RANDOM()
                LIMIT ${limit}
            `;
            const ids = (Array.isArray(idsRows) ? idsRows : []).map(r => r.id).filter(Boolean);
            if (ids.length === 0) return res.json({ posts: [], nextCursor: null, hasMore: false });



            const fetched = await prisma.post.findMany({
                where: { id: { in: ids } },
                include
            });
            const byId = new Map(fetched.map(p => [p.id, p]));
            const posts = ids.map(id => byId.get(id)).filter(Boolean);
            return res.json({ posts, nextCursor: null, hasMore: false });
        }

        const posts = await prisma.post.findMany({
            where,
            orderBy,
            take: limit,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
            include
        });
        const nextCursor = posts.length === limit ? posts[posts.length - 1].id : null;
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

        const scored = [];
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


// Get All Posts (Feed compatible) - public when no auth; with auth includes bookmarks
app.get('/', optionalAuthenticateToken, async (req, res) => {
    console.log(`[ContentService] GET / posts hit. User: ${req.user?.userId || 'anonymous'}`);
    try {
        // Avoid any intermediary/proxy caching for feed requests.
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Surrogate-Control', 'no-store');

        const { userId, repliesOnly, excludeReplies, topLevelOnly, limit, offset, skip } = req.query;
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

        console.log(`[ContentService] Feed Params:`, { userId, repliesOnly, query: req.query });

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
        } else {
            includeOpt.bookmarks = { where: { userId: '' }, select: { id: true } };
        }
        const posts = await prisma.post.findMany({
            where,
            take,
            skip: skipCount,
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            include: includeOpt
        });

        res.json({ posts });
    } catch (error) {
        console.error('[ContentService] Feed Error:', error);
        // Handle Prisma schema mismatch (e.g. missing Post.scheduledAt column) gracefully in dev
        if (error && error.code === 'P2022') {
            return res.json({ posts: [] });
        }
        res.status(500).json({ error: 'Failed' });
    }
});

// Get Following Feed
app.get('/following', authenticateToken, async (req, res) => {
    try {
        const currentUserId = req.user.userId;
        const { limit, offset, skip } = req.query;

        // Get list of users the current user is following
        const following = await prisma.follow.findMany({
            where: { followerId: currentUserId },
            select: { followingId: true }
        });

        const followingIds = following.map(f => f.followingId);

        const takeRaw = parseInt(limit, 10);
        const take = Number.isFinite(takeRaw) && takeRaw > 0 ? Math.min(takeRaw, 100) : 20;
        const skipRaw = parseInt(offset ?? skip, 10);
        const skipCount = Number.isFinite(skipRaw) && skipRaw > 0 ? skipRaw : 0;

        const posts = await prisma.post.findMany({
            where: {
                ...publishedPostFilter(),
                userId: { in: followingIds }
            },
            take,
            skip: skipCount,
            orderBy: { createdAt: 'desc' },
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


        // Sanitize users in posts (remove passwordHash)
        const safePosts = posts.map(post => {
            if (post.user) {
                const { passwordHash, ...safeUser } = post.user;
                post.user = safeUser;
            }
            return post;
        });

        res.json({ posts: safePosts });
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
        res.json(replies);
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
    const { limit = 20, offset = 0 } = req.query;

    try {
        const bookmarks = await prisma.bookmark.findMany({
            where: { userId },
            include: {
                post: {
                    include: {
                        user: { include: { profile: true } },
                        media: true,
                        _count: {
                            select: { likes: true, retweets: true, replies: true }
                        }
                    }
                }
            },
            take: parseInt(limit),
            skip: parseInt(offset),
            orderBy: { createdAt: 'desc' }
        });

        const posts = bookmarks
            .map(b => b.post)
            .filter(Boolean)
            .map(post => {
                if (post.user) {
                    const { passwordHash, ...safeUser } = post.user;
                    return { ...post, user: safeUser };
                }
                return post;
            });
        res.json({ posts });
    } catch (error) {
        console.error('Get Bookmarks Error:', error);
        res.json({ posts: [] });
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
app.get('/:id', async (req, res) => {
    console.log('GET /:id hit', req.params.id);
    try {
        const post = await prisma.post.findUnique({
            where: { id: req.params.id },
            include: {
                user: { include: { profile: true } },
                media: true,
                replyTo: { include: { user: { include: { profile: true } } } },
                _count: { select: { replies: true, likes: true, retweets: true } }
            }
        });
        if (!post) return res.status(404).json({ error: `Post not found (ID: ${req.params.id})` });
        res.json(post);
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

const http = require('http');
// Create server with manual request handler to bypass Express middleware for WebSockets
const server = http.createServer((req, res) => {
    // If it's a socket.io request (polling or upgrade), don't pass to Express
    // This avoids URL rewrite and global Auth middleware interference
    if (req.url && (req.url.includes('/api/posts/ws') || req.url.includes('/ws/live'))) {
        return; // Let socket.io handle it
    }
    app(req, res);
});
const websocketService = require('./services/websocket.service');
const { startScheduledPostPublisher } = require('./scheduledPostPublisher');
websocketService.init(server);

const bindHost = process.env.BIND_HOST || '0.0.0.0';
server.listen(PORT, bindHost, () => {
    console.log(`Content Service with WebSockets running on port ${PORT} (bound to ${bindHost})`);
    startScheduledPostPublisher(); // Kafka-driven scheduled post publishing (every 60s)
});
