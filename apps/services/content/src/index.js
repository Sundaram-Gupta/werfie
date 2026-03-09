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
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
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

app.use('/lists', listsRoutes);
app.use('/spaces', spacesRoutes);

// Auth Middleware
const authenticateToken = require('./middleware/auth');

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
            await MediaService.cleanup(req.file.path);
            return res.status(400).json({ status: false, message: 'Unsupported file type', data: null });
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

// Create Post (Media Support)
app.post('/', authenticateToken, upload.array('media', 4), async (req, res) => {
    const { content = '', replyToId } = req.body;
    const userId = req.user?.userId || req.user?.id;
    const files = req.files || [];

    console.log('[ContentService] Creating post:', { userId, contentLength: content.length, fileCount: files.length });

    if (!userId) {
        return res.status(401).json({ error: 'User ID missing from token' });
    }

    try {
        // 1. Create Post first (or in transaction)
        const post = await prisma.post.create({
            data: {
                userId,
                content,
                replyToId: replyToId || null
            }
        });

        // 2. Process Media
        const mediaPromises = files.map(async (file) => {
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

        // Notify if Reply
        if (replyToId) {
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

        // Emit Kafka Event (fire-and-forget - don't block response)
        setImmediate(() => {
            const kafkaProducer = require('./kafka');
            kafkaProducer.send('POST_CREATED', {
                id: finalPost.id,
                userId: finalPost.userId,
                content: finalPost.content,
                mediaCount: finalPost.media?.length || 0,
                createdAt: finalPost.createdAt
            }).catch(kafkaError => {
                console.error('Failed to emit POST_CREATED event:', kafkaError);
            });
        });

        res.json(finalPost);
    } catch (error) {
        console.error('CREATE POST ERROR:', error);
        // Attempt cleanup for all files on error
        if (req.files) {
            for (const file of req.files) {
                await MediaService.cleanup(file.path);
            }
        }
        res.status(500).json({ error: 'Failed to create post', details: error.message });
    }
});

// Get Timeline (Basic) - includes both top-level posts and replies
app.get('/timeline/home', authenticateToken, async (req, res) => {
    try {
        const posts = await prisma.post.findMany({
            take: 20,
            orderBy: { createdAt: 'desc' },
            include: {
                user: { include: { profile: true } },
                media: true,
                replyTo: { include: { user: { include: { profile: true } } } },
                _count: { select: { replies: true, likes: true, retweets: true } }
            }
        });

        res.json({ posts });
    } catch (error) {
        console.error('Timeline Error:', error);
        res.status(500).json({ error: 'Failed to fetch timeline', details: error.message });
    }
});

// Get Trends
app.get('/trends', async (req, res) => {
    console.log('GET /trends hit');
    try {
        const trends = await prisma.trend.findMany({
            orderBy: { posts: 'desc' },
            take: 20
        });
        res.json(trends);
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

        // Transform to match frontend expectations
        const transformedCommunities = communities.map(community => ({
            id: community.id,
            name: community.name,
            description: community.description,
            avatar: community.avatar,
            banner: community.banner,
            membersCount: community.membersCount,
            isJoined: false, // TODO: Check if current user is a member
            rules: [],
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





// Get Single Post - Moved to bottom to avoid conflicts
// app.get('/:id', ...)


// Get All Posts (Feed compatible)
app.get('/', authenticateToken, async (req, res) => {
    console.log(`[ContentService] GET / posts hit. User: ${req.user?.userId}`);
    try {
        const { userId, repliesOnly } = req.query;
        const currentUserId = req.user?.userId || req.user?.id;

        if (!currentUserId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Fetch Posts
        const where = {};
        if (userId) where.userId = userId;
        if (repliesOnly === 'true') where.replyToId = { not: null };

        console.log(`[ContentService] Feed Params:`, { userId, repliesOnly, query: req.query });
        console.log(`[ContentService] Fetching announcements?`, (!userId && !repliesOnly));

        const posts = await prisma.post.findMany({
            where,
            take: 20,
            orderBy: { createdAt: 'desc' },
            include: {
                user: { include: { profile: true } },
                media: true,
                replyTo: { include: { user: { include: { profile: true } } } },
                _count: { select: { replies: true, likes: true, retweets: true } }
            }
        });

        res.json({ posts });
    } catch (error) {
        console.error('[ContentService] Feed Error:', error);
        res.status(500).json({ error: 'Failed' });
    }
});

// Get Following Feed
app.get('/following', authenticateToken, async (req, res) => {
    try {
        const currentUserId = req.user.userId;

        // Get list of users the current user is following
        const following = await prisma.follow.findMany({
            where: { followerId: currentUserId },
            select: { followingId: true }
        });

        const followingIds = following.map(f => f.followingId);

        // Get posts from followed users
        const posts = await prisma.post.findMany({
            where: {
                userId: { in: followingIds }
            },
            take: 20,
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
                }
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
                    type: 'retweet',
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
            where.actor = { profile: { isVerified: true } };
        }

        const notifications = await prisma.notification.findMany({
            where,
            include: {
                actor: { include: { profile: true } },
                post: true
            },
            take: parseInt(limit),
            skip: parseInt(offset),
            orderBy: { createdAt: 'desc' }
        });

        res.json(notifications);
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
const server = http.createServer(app);
const websocketService = require('./services/websocket.service');
websocketService.init(server);

server.listen(PORT, '127.0.0.1', () => {
    console.log(`Content Service with WebSockets running on port ${PORT}`);
});
