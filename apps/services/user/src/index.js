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
const adminRoutes = require('./routes/adminRoutes');
const enterpriseRoutes = require('./routes/enterpriseRoutes');

app.use(cors({
    origin: true,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-verified-gateway', 'x-user-id', 'x-user-email', 'x-api-version']
}));
app.use(express.json());
app.use(require('./middleware/api-response'));

// Debug Middleware - MOVED TO TOP
app.use((req, res, next) => {
    console.log(`[User Service] ${new Date().toISOString()} ${req.method} ${req.url}`);
    next();
});

const { PROFILE_SELECT } = require('./constants');

const DEFAULT_SETTINGS = {
    theme: 'system',
    language: 'en',
    notifications: { email: true, push: true, sms: false, mutedFilters: {} },
    privacy: {
        protectPosts: false,
        protectVideos: false,
        photoTaggingEnabled: true,
        taggingPermission: 'anyone',
    },
    display: { darkMode: true },
};

/**
 * Normalizes user object to ensure it has name and handle
 */
function normalizeUserRecord(user) {
    if (!user) return null;
    const { passwordHash, ...safeUser } = user;

    const inst = safeUser.institutionalProfile;
    const defaultHandle = safeUser.email ? safeUser.email.split('@')[0] : 'user';
    const isAutoFallbackHandle = (h) => /^user_[0-9a-f]{8}_[0-9a-f]{4}$/i.test(String(h || ''));

    // If institutional, prioritize institutional name
    let fallbackName = defaultHandle.charAt(0).toUpperCase() + defaultHandle.slice(1);
    if (inst) {
        fallbackName = inst.publicDisplayName || inst.institutionName || fallbackName;
    }

    if (!safeUser.profile) {
        safeUser.profile = {
            name: fallbackName,
            handle: defaultHandle,
            bio: inst ? (inst.publicBio || inst.description) : null,
            avatar: inst ? inst.logoUrl : null,
            banner: inst ? inst.bannerUrl : null,
            location: inst ? (inst.headquarters || inst.country) : null,
            website: inst ? inst.website : null,
            birthdate: null,
            gender: null,
            verified: inst ? inst.isVerified : false
        };
    } else {
        // Ensure all expected fields exist on profile
        const handleFromDb = safeUser.profile.handle || defaultHandle;
        // If handle in DB is the auto-generated fallback (`user_<first8>_<last4>`),
        // show a more meaningful handle (usually the email local-part) instead.
        // This fixes cases where Profile was never created during register.
        const handle =
            isAutoFallbackHandle(handleFromDb) && defaultHandle && !isAutoFallbackHandle(defaultHandle)
                ? defaultHandle
                : handleFromDb;
        const currentName = safeUser.profile.name;

        // If profile name is default/missing, try institutional name first
        let name = currentName;
        const isDefaultName = !currentName || currentName.trim() === '' || currentName === 'User';

        if (isDefaultName || handle !== handleFromDb) {
            if (inst) {
                name = inst.publicDisplayName || inst.institutionName;
            } else {
                name = handle.charAt(0).toUpperCase() + handle.slice(1);
            }
        }

        safeUser.profile = {
            ...safeUser.profile,
            name: name,
            handle: handle,
            verified: safeUser.profile.verified ?? (inst ? inst.isVerified : false),
            avatar: safeUser.profile.avatar || (inst ? inst.logoUrl : null),
            banner: safeUser.profile.banner || (inst ? inst.bannerUrl : null),
            bio: safeUser.profile.bio || (inst ? (inst.publicBio || inst.description) : null)
        };
    }

    // Virtual fields for backward compatibility at root level
    safeUser.name = safeUser.profile.name;
    safeUser.handle = safeUser.profile.handle;
    safeUser.avatar = safeUser.profile.avatar;
    safeUser.verified = safeUser.profile.verified;

    return safeUser;
}

// Settings - DB-backed per-user, requires x-user-id from gateway
app.get('/api/settings', async (req, res) => {
    const userId = req.headers['x-user-id'];
    if (!userId) {
        return res.status(401).json({ status: false, message: 'Unauthorized', data: null });
    }
    try {
        const row = await prisma.userSettings.findUnique({ where: { userId } });
        const data = row?.settings ? { ...DEFAULT_SETTINGS, ...JSON.parse(row.settings) } : { ...DEFAULT_SETTINGS };
        res.json({ status: true, message: 'Settings fetched', data });
    } catch (err) {
        console.error('[User Service] GET /api/settings error:', err);
        res.status(500).json({ status: false, message: 'Failed to fetch settings', data: null });
    }
});

app.put('/api/settings', async (req, res) => {
    const userId = req.headers['x-user-id'];
    if (!userId) {
        return res.status(401).json({ status: false, message: 'Unauthorized', data: null });
    }
    try {
        const body = req.body || {};
        const row = await prisma.userSettings.findUnique({ where: { userId } });
        const existing = row?.settings ? JSON.parse(row.settings) : {};
        const merged = { ...DEFAULT_SETTINGS, ...existing };
        if (body.theme !== undefined) merged.theme = body.theme;
        if (body.language !== undefined) merged.language = body.language;
        if (body.notifications) {
            merged.notifications = {
                ...merged.notifications,
                ...(body.notifications.email !== undefined && { email: body.notifications.email }),
                ...(body.notifications.push !== undefined && { push: body.notifications.push }),
                ...(body.notifications.sms !== undefined && { sms: body.notifications.sms }),
                ...(body.notifications.mutedFilters !== undefined && { mutedFilters: body.notifications.mutedFilters }),
            };
        }
        if (body.display) {
            merged.display = { ...merged.display, ...body.display };
        }
        if (body.privacy) {
            merged.privacy = {
                ...merged.privacy,
                ...(body.privacy.protectPosts !== undefined && { protectPosts: body.privacy.protectPosts }),
                ...(body.privacy.protectVideos !== undefined && { protectVideos: body.privacy.protectVideos }),
                ...(body.privacy.photoTaggingEnabled !== undefined && { photoTaggingEnabled: body.privacy.photoTaggingEnabled }),
                ...(body.privacy.taggingPermission !== undefined && { taggingPermission: body.privacy.taggingPermission }),
            };
        }
        await prisma.userSettings.upsert({
            where: { userId },
            create: { userId, settings: JSON.stringify(merged) },
            update: { settings: JSON.stringify(merged) },
        });
        res.json({ status: true, message: 'Settings updated', data: merged });
    } catch (err) {
        console.error('[User Service] PUT /api/settings error:', err);
        res.status(500).json({ status: false, message: 'Failed to update settings', data: null });
    }
});

// Suggestions - paginated (page, limit 50). Match BEFORE :id routes so /api/users/suggestions is not treated as :id=suggestions
app.get('/api/users/suggestions', async (req, res) => {
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const skip = (page - 1) * limit;
    let currentUserId = null;
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            currentUserId = decoded.sub || decoded.id || decoded.userId;
        } catch (e) { }
    }
    try {
        let excludeIds = [];
        if (currentUserId) {
            excludeIds.push(currentUserId);
            const following = await prisma.follow.findMany({
                where: { followerId: currentUserId },
                select: { followingId: true }
            });
            excludeIds.push(...following.map(f => f.followingId));
        }
        const where = excludeIds.length > 0 ? { id: { notIn: excludeIds } } : {};
        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: { profile: { select: PROFILE_SELECT } }
            }),
            prisma.user.count({ where })
        ]);
        const safeUsers = users.map(normalizeUserRecord);
        const totalPages = Math.ceil(total / limit);
        res.json({
            users: safeUsers,
            pagination: { total, page, totalPages, limit }
        });
    } catch (error) {
        console.error('Suggestions Error:', error);
        res.status(500).json({ error: 'Failed to fetch suggestions' });
    }
});

// Creator Studio / Analytics routes - match BEFORE rewrite so direct fetches from analytics work
app.get('/api/users/:id/follower-growth', async (req, res) => {
    const { id } = req.params;
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const [total, newLast30] = await Promise.all([
            prisma.follow.count({ where: { followingId: id } }),
            prisma.follow.count({ where: { followingId: id, createdAt: { gte: thirtyDaysAgo } } })
        ]);
        res.json({ total, newLast30, netGrowth: newLast30 });
    } catch (error) {
        console.error('Follower growth error:', error);
        res.status(500).json({ total: 0, newLast30: 0, netGrowth: 0 });
    }
});

app.get('/api/users/:id/followers', async (req, res) => {
    const { id } = req.params;
    const { limit = 20, offset = 0 } = req.query;
    try {
        let followers;
        try {
            followers = await prisma.follow.findMany({
                where: { followingId: id },
                include: {
                    follower: {
                        include: { profile: { select: PROFILE_SELECT } }
                    }
                },
                take: parseInt(limit) || 500,
                skip: parseInt(offset) || 0,
                orderBy: { createdAt: 'desc' }
            });
        } catch (err) {
            if (err?.code === 'P2022') {
                followers = await prisma.follow.findMany({
                    where: { followingId: id },
                    include: { follower: { include: { profile: true } } },
                    take: parseInt(limit) || 500,
                    skip: parseInt(offset) || 0,
                    orderBy: { createdAt: 'desc' }
                });
            } else throw err;
        }
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

// 2. Admin Routes
app.use('/api/admin', adminRoutes);
app.use('/admin', adminRoutes);

// 3. Other Routes
app.use('/api/business', businessRoutes);
app.use('/business', businessRoutes);
app.use('/api/leaders', worldLeaderRoutes);
app.use('/leaders', worldLeaderRoutes);

// 4. Enterprise Routes
app.use('/api/enterprise', enterpriseRoutes);
app.use('/enterprise', enterpriseRoutes);

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
                profile: { select: PROFILE_SELECT },
                institutionalProfile: true,
                businessProfile: true
            }
        });
        res.json(normalizeUserRecord(user));
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
                profile: { select: PROFILE_SELECT },
                institutionalProfile: true,
                businessProfile: true
            }
        });
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(normalizeUserRecord(user));
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

// Get Followers Count (Creator Studio stats)
app.get('/:id/followers-count', async (req, res) => {
    const { id } = req.params;
    try {
        const count = await prisma.follow.count({
            where: { followingId: id }
        });
        res.json({ count });
    } catch (error) {
        console.error('Followers count error:', error);
        res.status(500).json({ error: 'Failed to get count', count: 0 });
    }
});

// Get follower growth stats (Creator Studio / Audience Insights)
app.get('/:id/follower-growth', async (req, res) => {
    const { id } = req.params;
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const [total, newLast30] = await Promise.all([
            prisma.follow.count({ where: { followingId: id } }),
            prisma.follow.count({ where: { followingId: id, createdAt: { gte: thirtyDaysAgo } } })
        ]);
        res.json({ total, newLast30, netGrowth: newLast30 });
    } catch (error) {
        console.error('Follower growth error:', error);
        res.status(500).json({ total: 0, newLast30: 0, netGrowth: 0 });
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
                    include: { profile: { select: PROFILE_SELECT } }
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
                    include: { profile: { select: PROFILE_SELECT } }
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

        let users = [];
        try {
            users = await prisma.user.findMany({
                where: {
                    id: { notIn: excludeIds }
                },
                take: parseInt(limit),
                orderBy: { createdAt: 'desc' },
                include: { profile: { select: PROFILE_SELECT } }
            });
        } catch (err) {
            // Handle schema mismatch gracefully (e.g. Profile.gender missing)
            if (err && err.code === 'P2022') {
                users = await prisma.user.findMany({
                    where: {
                        id: { notIn: excludeIds }
                    },
                    take: parseInt(limit),
                    orderBy: { createdAt: 'desc' }
                });
            } else {
                throw err;
            }
        }

        const safeUsers = users.map(normalizeUserRecord);

        res.json(safeUsers);
    } catch (error) {
        console.error('Suggestions Error:', error);
        res.status(500).json({ error: 'Failed to fetch suggestions' });
    }
});

// Search Users
// NOTE: /api/users/* is rewritten earlier to /*, so search must be mounted on /search.
app.get('/search', async (req, res) => {
    const { q, limit = 20 } = req.query;

    if (!q || q.trim().length === 0) {
        return res.json([]);
    }

    // Split query into individual terms for multi-keyword search (e.g. "Bob User" -> ["Bob", "User"])
    const terms = q.trim().split(/\s+/).filter(t => t.length > 0);

    // Search with AND of ORs across multiple fields
    const andConditions = terms.map(term => ({
        OR: [
            { profile: { name: { contains: term, mode: 'insensitive' } } },
            { profile: { handle: { contains: term, mode: 'insensitive' } } },
            { email: { contains: term, mode: 'insensitive' } },
            { institutionalProfile: { institutionName: { contains: term, mode: 'insensitive' } } },
            { institutionalProfile: { publicDisplayName: { contains: term, mode: 'insensitive' } } }
        ]
    }));

    try {
        let users = [];
        try {
            users = await prisma.user.findMany({
                where: {
                    AND: andConditions
                },
                include: {
                    profile: { select: PROFILE_SELECT },
                    institutionalProfile: true
                },
                take: parseInt(limit)
            });
        } catch (err) {
            // Fallback for schema mismatch (e.g. missing profile relation or fields)
            if (err && err.code === 'P2022') {
                const emailConditions = terms.map(term => ({
                    email: { contains: term, mode: 'insensitive' }
                }));
                users = await prisma.user.findMany({
                    where: { AND: emailConditions },
                    include: {
                        profile: { select: PROFILE_SELECT },
                        institutionalProfile: true
                    },
                    take: parseInt(limit)
                });
            } else {
                throw err;
            }
        }

        const safeUsers = users.map(normalizeUserRecord);

        res.json(safeUsers);
    } catch (error) {
        console.error('Search Users Error:', error);
        res.status(500).json({ error: 'Failed to search users' });
    }
});

// UUID v4 regex for validation
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Get Multiple Users (Bulk Fetch)
app.get('/', async (req, res) => {
    const { ids } = req.query;
    if (!ids || typeof ids !== 'string') return res.status(400).json({ error: 'Missing ids parameter' });

    const userIds = ids.split(',')
        .map(id => (id || '').trim())
        .filter(id => id && UUID_REGEX.test(id));

    if (userIds.length === 0) {
        return res.json([]);
    }

    try {
        let users = [];
        try {
            users = await prisma.user.findMany({
                where: {
                    id: { in: userIds }
                },
                include: {
                    profile: { select: PROFILE_SELECT }
                }
            });
        } catch (err) {
            // Handle schema mismatch gracefully (e.g. Profile.gender missing in older DB)
            if (err && err.code === 'P2022') {
                users = await prisma.user.findMany({
                    where: {
                        id: { in: userIds }
                    }
                });
            } else {
                throw err;
            }
        }

        res.json(users.map(normalizeUserRecord));
    } catch (error) {
        console.error('Bulk Fetch Error:', error?.message || error, error?.stack);
        res.status(500).json({
            error: 'Server error',
            details: process.env.NODE_ENV !== 'production' ? (error?.message || String(error)) : undefined
        });
    }
});

// Get User by ID
app.get('/:id', async (req, res) => {
    try {
        let user = null;
        try {
            user = await prisma.user.findUnique({
                where: { id: req.params.id },
                include: {
                    profile: { select: PROFILE_SELECT },
                    _count: {
                        select: { followers: true, following: true, posts: true }
                    }
                }
            });
        } catch (err) {
            // Handle schema mismatch gracefully (e.g. Profile.gender missing)
            if (err && err.code === 'P2022') {
                user = await prisma.user.findUnique({
                    where: { id: req.params.id },
                    include: {
                        _count: {
                            select: { followers: true, following: true, posts: true }
                        }
                    }
                });
            } else {
                throw err;
            }
        }

        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(normalizeUserRecord(user));
    } catch (error) {
        console.error('Get User Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update User Profile
async function updateProfileByUserId(targetUserId, req, res) {
    const body = req.body || {};
    const {
        name,
        handle,
        bio,
        location,
        website,
        avatar,
        avatarUrl,
        banner,
        bannerUrl,
        preferredLanguage,
        gender,
        birthdate,
        profile
    } = body;

    // Flutter may send `profile: { bio: "..." }`
    const effectiveBio = bio !== undefined ? bio : (profile?.bio !== undefined ? profile.bio : undefined);
    const sanitizeUrl = (u) => typeof u === 'string' ? u.replace(/`/g, '').trim() : u;
    const sanitizeHandle = (h) => typeof h === 'string' ? h.replace(/^@+/g, '').replace(/`/g, '').trim() : h;
    const avatarValue = avatar !== undefined ? sanitizeUrl(avatar) : sanitizeUrl(avatarUrl);
    const bannerValue = banner !== undefined ? sanitizeUrl(banner) : sanitizeUrl(bannerUrl);
    const effectiveHandle = handle !== undefined ? sanitizeHandle(handle) : undefined;

    try {
        if (preferredLanguage) {
            await prisma.user.update({
                where: { id: targetUserId },
                data: { preferredLanguage }
            });
        }

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (effectiveHandle !== undefined) updateData.handle = effectiveHandle;
        if (effectiveBio !== undefined) updateData.bio = effectiveBio;
        if (location !== undefined) updateData.location = location;
        if (website !== undefined) updateData.website = website;
        if (avatarValue !== undefined) updateData.avatar = avatarValue;
        if (bannerValue !== undefined) updateData.banner = bannerValue;
        if (gender !== undefined) updateData.gender = gender || null;
        if (birthdate !== undefined) updateData.birthdate = birthdate ? new Date(birthdate) : null;

        // Use a stable, near-unique fallback handle for profile creation.
        // This prevents P2002 (`handle` unique constraint) when the profile row doesn't exist yet.
        const fallbackHandle = `user_${String(targetUserId).slice(0, 8)}_${String(targetUserId).slice(-4)}`;

        const baseHandle = effectiveHandle || fallbackHandle;
        const baseCreate = {
            userId: targetUserId,
            handle: baseHandle,
            name: name || 'User',
        };

        const PROFILE_SAFE_SELECT = {
            id: true,
            userId: true,
            name: true,
            handle: true,
            bio: true,
            avatar: true,
            banner: true,
            location: true,
            website: true,
            birthdate: true,
            createdAt: true,
            updatedAt: true,
            verified: true,
        };

        let updatedProfile;
        try {
            updatedProfile = await prisma.profile.upsert({
                where: { userId: targetUserId },
                update: updateData,
                create: { ...baseCreate, ...updateData },
                select: PROFILE_SAFE_SELECT
            });
        } catch (err) {
            // Backward-compat: some DBs don't have Profile.gender yet.
            const errMsg = String(err?.message || '');
            const errColumn = String(err?.meta?.column || '');
            if (
                err?.code === 'P2022' &&
                (errMsg.includes('gender') || errMsg.includes('Profile.gender') || errColumn === 'gender')
            ) {
                const { gender: _omit, ...noGender } = updateData;
                updatedProfile = await prisma.profile.upsert({
                    where: { userId: targetUserId },
                    update: noGender,
                    create: { ...baseCreate, ...noGender },
                    select: PROFILE_SAFE_SELECT
                });
            } else if (err?.code === 'P2002') {
                // handle unique constraint etc.
                return res.status(409).json({
                    error: 'Update rejected (profile handle conflict). Try again.',
                    details: err?.meta || null
                });
            } else {
                throw err;
            }
        }

        return res.json({ ...updatedProfile, preferredLanguage });
    } catch (error) {
        console.error('Update Profile Error:', error);
        return res.status(500).json({ error: 'Failed to update profile' });
    }
}

// Update current user's profile
app.put('/profile', authenticateToken, async (req, res) => {
    const targetUserId = String(req.user?.userId ?? '').trim();
    if (!targetUserId) return res.status(401).json({ error: 'Unauthorized' });
    return updateProfileByUserId(targetUserId, req, res);
});

// Update User Profile by ID
app.put('/:id', authenticateToken, async (req, res) => {
    console.log(`Update Profile Request: params.id=${req.params.id}, user.userId=${req.user.userId}`);

    // Ensure user can only update their own profile
    const reqUserId = String(req.user?.userId ?? '').trim();
    const paramId = String(req.params?.id ?? '').trim();
    if (!reqUserId || reqUserId !== paramId) {
        console.warn('Update Profile: ID mismatch. Forbidden.');
        return res.status(403).json({ error: 'Forbidden' });
    }

    return updateProfileByUserId(paramId, req, res);
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

const bindHost = process.env.BIND_HOST || '0.0.0.0';
async function ensureBusinessSchemaCompatibility() {
    // Self-heal for rolling deployments where code updates can arrive before DB migration.
    await prisma.$executeRawUnsafe(`
        ALTER TABLE "BusinessProfile"
        ADD COLUMN IF NOT EXISTS "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false
    `);
}

const http = require('http');
const server = http.createServer(app);
const { initWebSocketServer } = require('./websocket');

ensureBusinessSchemaCompatibility()
    .then(() => {
        initWebSocketServer(server);
        server.listen(PORT, bindHost, () => {
            console.log(`User Service running on http://${bindHost}:${PORT} (LAN: use this machine's IP)`);
        });
    })
    .catch((err) => {
        console.error('Failed to ensure schema compatibility on startup:', err);
        process.exit(1);
    });
