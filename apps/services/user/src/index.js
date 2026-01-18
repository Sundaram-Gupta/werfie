const express = require('express');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3002;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

// app.use(cors()); // Handled by Gateway
app.use(express.json());

// Auth Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        console.log('Auth Middleware: No token provided');
        return res.status(401).json({ error: 'Unauthorized' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.error('Auth Middleware: Token verification failed:', err.message);
            return res.status(403).json({ error: 'Forbidden' });
        }
        console.log('Auth Middleware: User decoded:', user);
        req.user = user;
        req.user.userId = user.sub || user.id || user.userId;
        console.log('Auth Middleware: Mapped userId:', req.user.userId);
        next();
    });
};

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'user-service' });
});

// Get User Profile (Self)
app.get('/profile', authenticateToken, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            include: { profile: true }
        });
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (error) {
        console.error('Profile Error:', error);
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
    try {
        // Simple strategy: fetch latest users (excluding current if auth headers passed, but simpler to just fetch all for now)
        const users = await prisma.user.findMany({
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

    const { name, bio, location, website, avatar, banner } = req.body;

    try {
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

        res.json(updatedProfile);
    } catch (error) {
        console.error('Update Profile Error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

app.listen(PORT, () => {
    console.log(`User Service running on port ${PORT}`);
});
