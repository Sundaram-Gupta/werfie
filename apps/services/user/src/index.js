const express = require('express');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3002;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

const businessRoutes = require('./routes/businessRoutes');
const institutionalRoutes = require('./routes/institutionalRoutes');
const worldLeaderRoutes = require('./routes/worldLeaderRoutes');

app.use(cors({
    origin: true, // Reflects the request origin
    credentials: true
}));
app.use(express.json());

// Debug Middleware - MOVED TO TOP
app.use((req, res, next) => {
    console.log(`[User Service] ${new Date().toISOString()} ${req.method} ${req.url}`);
    next();
});

// Rewrite Middleware
app.use((req, res, next) => {
    if (req.url.startsWith('/api/users')) {
        let newUrl = req.url.replace('/api/users', '');
        if (!newUrl.startsWith('/')) newUrl = '/' + newUrl;
        console.log(`[User Service] Rewrite /api/users: ${req.url} -> ${newUrl}`);
        req.url = newUrl;
    }
    next();
});

// 1. Institutional Routes (Prioritized)
app.use('/api/institutional', institutionalRoutes);
app.use('/institutional', institutionalRoutes);

// 2. Other Routes
app.use('/api/business', businessRoutes);
app.use('/business', businessRoutes);
app.use('/api/leaders', worldLeaderRoutes);
app.use('/leaders', worldLeaderRoutes);

// Debug Middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Auth Middleware
// Auth Middleware (Imported)
const authenticateToken = require('./middleware/auth');

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'user-service' });
});

app.get('/test-route', (req, res) => {
    res.json({ message: 'User service is reachable', url: req.url });
});

app.get('/api/institutional/health-check', (req, res) => {
    res.json({ message: 'Institutional API is reachable via index.js', url: req.url });
});

// Get User Profile (Self)
app.get('/profile', authenticateToken, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            include: {
                profile: true,
                institutionalProfile: true
            }
        });
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (error) {
        console.error('Profile Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get User Profile by ID (Public/Internal)
app.get('/profile/:id', async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.params.id },
            include: {
                profile: true,
                institutionalProfile: true
            }
        });
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Return safe user data
        const { passwordHash, ...safeUser } = user;
        res.json(safeUser);
    } catch (error) {
        console.error('Profile by ID Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Follow User
app.post('/:id/follow', authenticateToken, async (req, res) => {
    const followerId = req.user.userId;
    const followingId = req.params.id;

    if (followerId === followingId) return res.status(400).json({ error: 'Cannot follow self' });

    try {
        const follow = await prisma.follow.create({
            data: {
                followerId,
                followingId
            }
        });

        // Create Notification
        // Check if notification already exists (optional, but good for idempotency if repeated follow/unfollow)
        // Here we just create it.
        try {
            await prisma.notification.create({
                data: {
                    userId: followingId, // Recipient
                    type: 'follow',
                    actorId: followerId,
                    read: false
                }
            });
        } catch (notifError) {
            console.error('Failed to create follow notification:', notifError);
            // Don't fail the request if notification fails
        }

        res.json(follow);
    } catch (error) {
        console.error('Follow Error:', error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Already following' });
        }
        res.status(500).json({ error: 'Failed to follow user' });
    }
});

// Unfollow User
app.delete('/:id/follow', authenticateToken, async (req, res) => {
    const followerId = req.user.userId;
    const followingId = req.params.id;

    try {
        await prisma.follow.deleteMany({
            where: {
                followerId,
                followingId
            }
        });
        res.json({ success: true });
    } catch (error) {
        console.error('Unfollow Error:', error);
        res.status(500).json({ error: 'Failed to unfollow user' });
    }
});

// Get Followers
app.get('/:id/followers', async (req, res) => {
    const { id } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    try {
        const followers = await prisma.follow.findMany({
            where: { followingId: id },
            include: {
                follower: {
                    include: { profile: true }
                }
            },
            take: parseInt(limit),
            skip: parseInt(offset),
            orderBy: { createdAt: 'desc' }
        });

        const users = followers.map(f => {
            const { passwordHash, ...safeUser } = f.follower;
            return safeUser;
        });

        res.json(users);
    } catch (error) {
        console.error('Get Followers Error:', error);
        res.status(500).json({ error: 'Failed to get followers' });
    }
});

// Get Following
app.get('/:id/following', async (req, res) => {
    const { id } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    try {
        const following = await prisma.follow.findMany({
            where: { followerId: id },
            include: {
                following: {
                    include: { profile: true }
                }
            },
            take: parseInt(limit),
            skip: parseInt(offset),
            orderBy: { createdAt: 'desc' }
        });

        const users = following.map(f => {
            const { passwordHash, ...safeUser } = f.following;
            return safeUser;
        });

        res.json(users);
    } catch (error) {
        console.error('Get Following Error:', error);
        res.status(500).json({ error: 'Failed to get following' });
    }
});

// Get User Suggestions (Who to follow)
app.get('/suggestions', async (req, res) => {
    const { limit = 3 } = req.query;

    // Optional Auth: If token provided, exclude followed users
    let currentUserId = null;
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            currentUserId = decoded.sub || decoded.id || decoded.userId;
        } catch (e) {
            // Ignore invalid token for suggestions
        }
    }

    try {
        let excludeIds = [];
        if (currentUserId) {
            excludeIds.push(currentUserId);

            // Get already followed users
            const following = await prisma.follow.findMany({
                where: { followerId: currentUserId },
                select: { followingId: true }
            });
            excludeIds.push(...following.map(f => f.followingId));
        }

        const users = await prisma.user.findMany({
            where: {
                id: { notIn: excludeIds }
            },
            take: parseInt(limit),
            orderBy: { createdAt: 'desc' },
            include: { profile: true }
        });

        const safeUsers = users.map(user => {
            const { passwordHash, ...safe } = user;
            return safe;
        });

        res.json(safeUsers);
    } catch (error) {
        console.error('Suggestions Error:', error);
        res.status(500).json({ error: 'Failed to fetch suggestions' });
    }
});

// Search Users
app.get('/search', async (req, res) => {
    const { q, limit = 20 } = req.query;

    if (!q || q.trim().length === 0) {
        return res.json([]);
    }

    try {
        const users = await prisma.user.findMany({
            where: {
                profile: {
                    OR: [
                        { name: { contains: q, mode: 'insensitive' } },
                        { handle: { contains: q, mode: 'insensitive' } }
                    ]
                }
            },
            include: { profile: true },
            take: parseInt(limit)
        });

        const safeUsers = users.map(user => {
            const { passwordHash, ...safe } = user;
            return safe;
        });

        res.json(safeUsers);
    } catch (error) {
        console.error('Search Users Error:', error);
        res.status(500).json({ error: 'Failed to search users' });
    }
});

// Get Multiple Users (Bulk Fetch)
app.get('/', async (req, res) => {
    const { ids } = req.query;
    if (!ids) return res.status(400).json({ error: 'Missing ids parameter' });

    const userIds = ids.split(',').filter(id => id.trim() !== '');

    try {
        const users = await prisma.user.findMany({
            where: {
                id: { in: userIds }
            },
            include: {
                profile: true
            }
        });

        // Sanitize
        const safeUsers = users.map(user => {
            const { passwordHash, ...safe } = user;
            return safe;
        });

        res.json(safeUsers);
    } catch (error) {
        console.error('Bulk Fetch Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get User by ID
app.get('/:id', async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.params.id },
            include: {
                profile: true,
                _count: {
                    select: { followers: true, following: true, posts: true }
                }
            }
        });

        if (!user) return res.status(404).json({ error: 'User not found' });

        // Sanitize
        const { passwordHash, ...safeUser } = user;
        res.json(safeUser);
    } catch (error) {
        console.error('Get User Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update User Profile
app.put('/:id', authenticateToken, async (req, res) => {
    console.log(`Update Profile Request: params.id=${req.params.id}, user.userId=${req.user.userId}`);

    // Ensure user can only update their own profile
    if (req.user.userId !== req.params.id) {
        console.warn('Update Profile: ID mismatch. Forbidden.');
        return res.status(403).json({ error: 'Forbidden' });
    }

    const { name, bio, location, website, avatar, banner, preferredLanguage } = req.body;

    try {
        if (preferredLanguage) {
            await prisma.user.update({
                where: { id: req.params.id },
                data: { preferredLanguage }
            });
        }

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (bio !== undefined) updateData.bio = bio;
        if (location !== undefined) updateData.location = location;
        if (website !== undefined) updateData.website = website;
        if (avatar !== undefined) updateData.avatar = avatar;
        if (banner !== undefined) updateData.banner = banner;

        const updatedProfile = await prisma.profile.upsert({
            where: { userId: req.params.id },
            update: updateData,
            create: {
                userId: req.params.id,
                handle: req.user.email.split('@')[0], // Fallback handle
                name: name || 'User',
                ...updateData
            }
        });

        res.json({ ...updatedProfile, preferredLanguage });
    } catch (error) {
        console.error('Update Profile Error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

app.use((req, res) => {
    console.log(`[User Service] 404 Catch-all: ${req.method} ${req.url}`);
    res.status(404).json({
        error: 'Not Found in User Service',
        method: req.method,
        url: req.url,
        stack: 'User Service Catch-all'
    });
});

app.listen(PORT, () => {
    console.log(`User Service running on port ${PORT}`);
});
