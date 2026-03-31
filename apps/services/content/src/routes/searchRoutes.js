const express = require('express');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const router = express.Router();
const optionalAuthenticateToken = require('../middleware/auth').optionalAuthenticateToken || require('../middleware/auth');

/**
 * Basic normalization helper for user records to ensure consistent field names (name, handle, etc)
 */
function normalizeUser(u) {
    if (!u) return null;
    const defaultHandle = u.email ? u.email.split('@')[0] : 'user';
    const profile = u.profile || {};
    
    // Fallback handle if profile is missing or handle is invalid
    const handle = profile.handle || defaultHandle;
    // Fallback name if profile is missing
    const name = profile.name || (handle.charAt(0).toUpperCase() + handle.slice(1));
    
    return {
        id: u.id,
        name: name,
        handle: handle,
        avatar: profile.avatar || null,
        verified: profile.verified || false,
        bio: profile.bio || null
    };
}

// Explicit selects prevent Prisma from reading Post scalar fields that may
// not exist in the current DB (schema/DB drift). This avoids 500s.
const userSelect = {
    id: true,
    email: true,
    profile: {
        select: {
            name: true,
            handle: true,
            avatar: true,
            verified: true,
            bio: true
        }
    }
};

const postMediaSelect = {
    select: {
        id: true,
        mediaType: true,
        mediaUrl: true,
        thumbnailUrl: true,
        width: true,
        height: true,
        duration: true,
        size: true,
        createdAt: true
    }
};

const postSelect = {
    select: {
        id: true,
        userId: true,
        content: true,
        createdAt: true,
        mediaUrls: true,
        user: { select: userSelect },
        media: postMediaSelect,
        _count: { select: { likes: true, replies: true, retweets: true } }
    }
};

// 1. Dedicated User Search (/search/users)
router.get('/users', optionalAuthenticateToken, async (req, res) => {
    try {
        const q = req.query.q;
        const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);

        if (!q || !q.trim()) {
            return res.json([]);
        }

        const term = q.trim();

        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { email: { contains: term, mode: 'insensitive' } },
                    { profile: { name: { contains: term, mode: 'insensitive' } } },
                    { profile: { handle: { contains: term, mode: 'insensitive' } } }
                ]
            },
            select: userSelect,
            take: limit
        });

        res.json(users.map(normalizeUser));
    } catch (err) {
        console.error('[SearchRoutes] User search error:', err);
        res.status(500).json({ error: 'User search failed' });
    }
});

// 2. Dedicated Post Search (/search/posts)
router.get('/posts', optionalAuthenticateToken, async (req, res) => {
    try {
        const q = req.query.q;
        const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);

        if (!q || !q.trim()) {
            return res.json([]);
        }

        const term = q.trim();

        const posts = await prisma.post.findMany({
            where: {
                AND: [
                    { content: { contains: term, mode: 'insensitive' } },
                    { scheduledAt: null },
                    { replyToId: null }
                ]
            },
            ...postSelect,
            orderBy: { createdAt: 'desc' },
            take: limit
        });

        res.json(posts);
    } catch (err) {
        console.error('[SearchRoutes] Post search error:', err);
        res.status(500).json({ error: 'Post search failed' });
    }
});

// 3. Unified Search (/search/)
router.get('/', optionalAuthenticateToken, async (req, res) => {
    try {
        const q = req.query.q;
        if (!q || !q.trim()) {
            return res.json({ users: [], posts: [], media: [] });
        }

        const term = q.trim();

        // Optimized parallel execution
        const [users, posts, mediaPosts] = await Promise.all([
            // 1. Find Users (more inclusive search)
            prisma.user.findMany({
                where: {
                    OR: [
                        { email: { contains: term, mode: 'insensitive' } },
                        { profile: { name: { contains: term, mode: 'insensitive' } } },
                        { profile: { handle: { contains: term, mode: 'insensitive' } } }
                    ]
                },
                select: userSelect,
                take: 6
            }),

            // 2. Find Posts
            prisma.post.findMany({
                where: {
                    AND: [
                        { content: { contains: term, mode: 'insensitive' } },
                        { scheduledAt: null },
                        { replyToId: null }
                    ]
                },
                ...postSelect,
                orderBy: { createdAt: 'desc' },
                take: 10
            }),

            // 3. Find Media
            prisma.post.findMany({
                where: {
                    AND: [
                        { content: { contains: term, mode: 'insensitive' } },
                        {
                            OR: [
                                { media: { some: {} } },
                                { mediaUrls: { not: null, not: '[]' } }
                            ]
                        },
                        { scheduledAt: null }
                    ]
                },
                ...postSelect,
                orderBy: { createdAt: 'desc' },
                take: 6
            })
        ]);

        res.json({
            users: users.map(normalizeUser),
            posts: posts,
            media: mediaPosts
        });
    } catch (err) {
        console.error('[SearchRoutes] Unified search error:', err);
        res.status(500).json({ error: 'Search failed', users: [], posts: [], media: [] });
    }
});

module.exports = router;
