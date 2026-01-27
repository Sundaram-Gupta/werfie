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

// Configure Multer for local storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Append extension
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// app.use(cors()); // Handled by Gateway
app.use(express.json());
// Serve static files from uploads directory
app.use('/media/uploads', express.static('uploads'));

const adsRoutes = require('./routes/adsRoutes');
const listsRoutes = require('./routes/listsRoutes');
const spacesRoutes = require('./routes/spacesRoutes');

app.use('/ads', adsRoutes);
app.use('/lists', listsRoutes);
app.use('/spaces', spacesRoutes);

// Auth Middleware
// Auth Middleware (Imported)
const authenticateToken = require('./middleware/auth');

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'content-service' });
});

// Create Post
app.post('/', authenticateToken, async (req, res) => {
    const { content, mediaUrls, replyToId } = req.body;

    try {
        const post = await prisma.post.create({
            data: {
                userId: req.user.userId,
                content,
                mediaUrls: mediaUrls ? JSON.stringify(mediaUrls) : null,
                replyToId
            },
            include: {
                user: { select: { id: true } } // Minimal return
            }
        });

        // Notify if Reply
        if (replyToId) {
            const originalPost = await prisma.post.findUnique({ where: { id: replyToId } });
            if (originalPost && originalPost.userId !== req.user.userId) {
                await prisma.notification.create({
                    data: {
                        userId: originalPost.userId,
                        type: 'reply',
                        actorId: req.user.userId,
                        postId: post.id
                    }
                });
            }
        }

        // Emit Kafka Event
        try {
            const kafkaProducer = require('./kafka');
            await kafkaProducer.send('POST_CREATED', {
                id: post.id,
                userId: post.userId,
                content: post.content,
                createdAt: post.createdAt
            });
        } catch (kafkaError) {
            console.error('Failed to emit POST_CREATED event:', kafkaError);
            // Don't fail request if Kafka fails
        }

        res.json(post);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create post' });
    }
});

// Get Timeline (Basic)
app.get('/timeline/home', authenticateToken, async (req, res) => {
    try {
        const posts = await prisma.post.findMany({
            where: { replyToId: null },
            take: 20,
            orderBy: { createdAt: 'desc' },
            include: {
                user: true, // In real microservices, we might just get IDs and hydrate later, or use replication 
                _count: { select: { replies: true, likes: true, retweets: true } }
            }
        });
        res.json(posts);
    } catch (error) {
        console.error('Timeline Error:', error);
        res.status(500).json({ error: 'Failed to fetch timeline' });
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
    try {
        const { userId, repliesOnly } = req.query;
        const currentUserId = req.user.userId;

        // Build where clause
        const where = {};
        if (userId) {
            where.userId = userId;
        }
        if (repliesOnly === 'true') {
            where.replyToId = { not: null };
        }

        const posts = await prisma.post.findMany({
            where,
            take: 20,
            orderBy: { createdAt: 'desc' },
            include: {
                user: true,
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
        res.json({ posts }); // Wrap in object as expected by usePosts hook which expects data.posts
    } catch (error) {
        console.error('Feed Error:', error);
        res.status(500).json({ error: 'Failed to fetch posts' });
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
                user: true,
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

        res.json({ posts });
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
                user: true,
                _count: { select: { replies: true, likes: true, retweets: true } }
            }
        });
        res.json(replies);
    } catch (error) {
        console.error('Get Replies Error:', error);
        res.status(500).json({ error: 'Failed to fetch replies' });
    }
});

// Upload Media Endpoint
app.post('/media/upload', authenticateToken, upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        // Construct public URL. 
        // Gateway maps /api/media/ -> http://content_service/media/
        // We serve /media/uploads via express.static('uploads')
        // So file 'abc.png' in 'uploads/' is at http://content_service/media/uploads/abc.png
        // Authenticated client sees: http://localhost:3001/api/media/uploads/abc.png

        const fileUrl = `/api/media/uploads/${req.file.filename}`;
        res.json({ url: fileUrl });
    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ error: 'Failed to upload file' });
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

        const posts = bookmarks.map(b => b.post);
        res.json({ posts });
    } catch (error) {
        console.error('Get Bookmarks Error:', error);
        res.status(500).json({ error: 'Failed to get bookmarks' });
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

// Get Single Post - Moved to bottom to avoid conflicts
app.get('/:id', async (req, res) => {
    console.log('GET /:id hit', req.params.id);
    try {
        const post = await prisma.post.findUnique({
            where: { id: req.params.id },
            include: {
                user: true,
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
    const userId = req.user.userId;

    try {
        const result = await prisma.notification.updateMany({
            where: { userId, read: false },
            data: { read: true }
        });
        res.json({ count: result.count });
    } catch (error) {
        console.error('Mark All as Read Error:', error);
        res.status(500).json({ error: 'Failed to mark all as read' });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Content Service running on port ${PORT}`);
});
