const express = require('express');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const router = express.Router();

const authenticateToken = require('../middleware/auth');

// GET /pinned: lists pinned by owner (List.isPinned) OR pinned as a follower (ListFollower.isPinned)
router.get('/pinned', authenticateToken, async (req, res) => {
    try {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        const userId = String(req.user.userId || req.user.id);
        const includeBlock = {
            owner: { include: { profile: true } },
            _count: { select: { members: true } }
        };
        const [ownedPinned, followedPinned] = await Promise.all([
            prisma.list.findMany({
                where: { ownerId: userId, isPinned: true },
                include: includeBlock
            }),
            prisma.list.findMany({
                where: {
                    followers: { some: { userId, isPinned: true } }
                },
                include: includeBlock
            })
        ]);
        const seen = new Set();
        const merged = [];
        for (const list of ownedPinned) {
            if (!seen.has(list.id)) {
                seen.add(list.id);
                merged.push(list);
            }
        }
        for (const list of followedPinned) {
            if (!seen.has(list.id)) {
                seen.add(list.id);
                merged.push(list);
            }
        }

        const formatted = merged.map(list => {
            const mc = list._count?.members ?? 0;
            return {
                id: list.id,
                name: list.name,
                memberCount: mc,
                members: `${mc} member${mc !== 1 ? 's' : ''}`,
                avatar: list.avatar || list.banner || "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=2428&auto=format&fit=crop",
                banner: list.banner
            };
        });

        res.json(formatted);
    } catch (error) {
        console.error('Error fetching pinned lists:', error);
        res.status(500).json({ error: 'Failed to fetch pinned lists' });
    }
});

// GET /discover: Fetch discoverable lists (public - no auth required)
router.get('/discover', async (req, res) => {
    try {
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 5));
        const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);

        // Optional Auth: If token provided, check if user follows the lists
        let currentUserId = null;
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (token) {
            try {
                const decoded = require('jsonwebtoken').decode(token);
                const raw = decoded?.sub || decoded?.id || decoded?.userId;
                currentUserId = raw != null ? String(raw) : null;
            } catch (e) {}
        }

        // Same scope as GET /yours: owned, following, or on the list as a member — hide from discover.
        // Also exclude legacy auto-generated template lists so discover shows real user-created lists.
        const discoverAndFilters = [
            {
                NOT: {
                    OR: [
                        { name: { startsWith: 'Important News for @' } },
                        { name: { startsWith: 'Favorite Accounts of @' } },
                        { name: { startsWith: 'Top Trends by @' } }
                    ]
                }
            }
        ];
        if (currentUserId) {
            discoverAndFilters.push({
                NOT: {
                    OR: [
                        { ownerId: currentUserId },
                        { followers: { some: { userId: currentUserId } } },
                        { members: { some: { userId: currentUserId } } }
                    ]
                }
            });
        }
        const discoverWhere = {
            isPrivate: false,
            AND: discoverAndFilters
        };

        const discover = await prisma.list.findMany({
            where: discoverWhere,
            take: limit,
            skip: offset,
            orderBy: [
                { followers: { _count: 'desc' } }, // Show popular first
                { createdAt: 'desc' }             // Then newest
            ],
            include: {
                owner: { include: { profile: true } },
                _count: { select: { members: true, followers: true } },
                followers: currentUserId ? { where: { userId: currentUserId } } : undefined
            }
        });

        const formatted = discover.map(list => {
            const p = list.owner?.profile;
            const handle = p?.handle || list.owner?.email?.split('@')[0] || 'user';
            const mc = list._count?.members ?? 0;
            const fc = list._count?.followers ?? 0;
            return {
                id: list.id,
                name: list.name,
                owner: `@${handle}`,
                ownerHandle: handle,
                memberCount: mc,
                followerCount: fc,
                members: `${mc} member${mc !== 1 ? 's' : ''}`,
                avatar: list.avatar,
                banner: list.banner,
                isFollowing: currentUserId ? list.followers.length > 0 : false
            };
        });

        res.json(formatted);
    } catch (error) {
        console.error('Error fetching discover lists:', error);
        res.status(500).json({ error: 'Failed to fetch discover lists' });
    }
});

// GET /yours: Fetch user's lists (owned, followed, or you're a member of)
router.get('/yours', authenticateToken, async (req, res) => {
    try {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        const userId = String(req.user.userId || req.user.id);
        const yourLists = await prisma.list.findMany({
            where: {
                OR: [
                    { ownerId: userId },
                    { followers: { some: { userId } } },
                    { members: { some: { userId } } }
                ]
            },
            orderBy: { createdAt: 'desc' },
            include: {
                owner: { include: { profile: true } },
                _count: { select: { members: true, followers: true } },
                followers: {
                    where: { userId },
                    select: { userId: true, isPinned: true }
                },
                members: {
                    where: { userId },
                    select: { userId: true }
                }
            }
        });

        res.json(yourLists.map(list => formatListWithOwner(list, userId)));
    } catch (error) {
        console.error('Error fetching your lists:', error);
        res.status(500).json({ error: 'Failed to fetch your lists' });
    }
});

// Helper: format list with owner + counts
// viewerUserId: when set, isPinned = List.isPinned if viewer owns the list, else ListFollower.isPinned for that user
function formatListWithOwner(list, viewerUserId = null) {
    const owner = list.owner || {};
    const profile = owner.profile || {};
    const ownerName = profile.name || owner.email?.split('@')[0] || 'User';
    const ownerHandle = profile.handle || owner.email?.split('@')[0] || 'user';
    const mc = list._count?.members ?? (Array.isArray(list.members) ? list.members.length : 0);
    const fc = list._count?.followers ?? (Array.isArray(list.followers) ? list.followers.length : 0);

    const viewerRowsFollowers = Array.isArray(list.followers)
        ? list.followers.filter((f) => String(f.userId) === String(viewerUserId))
        : [];
    const viewerRowsMembers = Array.isArray(list.members)
        ? list.members.filter((m) => String(m.userId) === String(viewerUserId))
        : [];

    let isPinned = !!list.isPinned;
    if (viewerUserId) {
        if (String(list.ownerId) === String(viewerUserId)) {
            isPinned = !!list.isPinned;
        } else {
            const mine = viewerRowsFollowers[0] ?? null;
            isPinned = !!(mine && mine.isPinned);
        }
    }

    let isFollowing = false;
    if (viewerUserId) {
        isFollowing = viewerRowsFollowers.length > 0 || viewerRowsMembers.length > 0;
    }

    return {
        id: list.id,
        name: list.name,
        description: list.description,
        isPrivate: list.isPrivate,
        banner: list.banner,
        avatar: list.avatar,
        createdAt: list.createdAt,
        updatedAt: list.updatedAt,
        ownerId: list.ownerId,
        ownerName,
        ownerHandle,
        memberCount: mc,
        followerCount: fc,
        members: `${mc} member${mc !== 1 ? 's' : ''}`,
        isPinned,
        isFollowing,
        owner: { id: owner.id, name: ownerName, handle: ownerHandle, profile },
        ...(Array.isArray(list.members) && list.members.length > 0 ? { membersData: list.members } : {})
    };
}


// GET /:id/followers
router.get('/:id/followers', async (req, res) => {
    try {
        const listId = String(req.params.id);
        const followers = await prisma.listFollower.findMany({
            where: { listId },
            include: {
                user: { include: { profile: true } }
            }
        });
        
        const data = followers
            .filter(f => f.user)
            .map(f => {
                const u = f.user;
                const p = u.profile || {};
                return {
                    id: u.id,
                    name: p.name || u.email?.split('@')[0] || 'User',
                    handle: p.handle || u.email?.split('@')[0] || 'user',
                    avatarUrl: p.avatar || null,
                    user: { id: u.id, profile: p }
                };
            });
        res.status(200).json({ status: true, message: 'OK', data });
    } catch (error) {
        console.error('Error fetching list followers:', error);
        res.status(500).json({ status: false, message: error.message || 'Failed to fetch followers', data: [] });
    }
});


// GET /:id/members
router.get('/:id/members', async (req, res) => {
    try {
        const listId = String(req.params.id);
        const members = await prisma.listMember.findMany({
            where: { listId },
            include: {
                user: { include: { profile: true } }
            }
        });

        const data = members
            .filter(m => m.user)
            .map(m => {
                const u = m.user;
                const p = u.profile || {};
                return {
                    id: u.id,
                    name: p.name || u.email?.split('@')[0] || 'User',
                    handle: p.handle || u.email?.split('@')[0] || 'user',
                    avatarUrl: p.avatar || null,
                    user: { id: u.id, profile: p }
                };
            });
        res.status(200).json({ status: true, message: 'OK', data });
    } catch (error) {
        console.error('Error fetching list members:', error);
        res.status(500).json({ status: false, message: error.message || 'Failed to fetch members', data: [] });
    }
});


// GET /:id/posts - must be before /:id
router.get('/:id/posts', async (req, res) => {
    try {
        const listId = req.params.id;
        const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
        const list = await prisma.list.findUnique({
            where: { id: listId },
            include: { members: { select: { userId: true } } }
        });
        if (!list) {
            return res.status(404).json({ status: false, message: 'List not found', data: [] });
        }
        const memberIds = list.members.map(m => m.userId);
        if (memberIds.length === 0) {
            return res.status(200).json({ status: true, message: 'OK', data: [] });
        }
        const posts = await prisma.post.findMany({
            where: {
                userId: { in: memberIds },
                OR: [
                    { scheduledAt: null },
                    { scheduledAt: { lte: new Date() } }
                ]
            },
            include: {
                user: { include: { profile: true } },
                media: true,
                _count: { select: { likes: true, retweets: true, replies: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: limit
        });
        const shufflePosts = (posts) => {
            const shuffled = [];
            let lastUserId = null;
            const remaining = [...posts];

            while (remaining.length > 0) {
                let index = remaining.findIndex(p => p.userId !== lastUserId);
                if (index === -1) index = 0; // Fallback if only one user left
                const [picked] = remaining.splice(index, 1);
                shuffled.push(picked);
                lastUserId = picked.userId;
            }
            return shuffled;
        };

        const safePosts = shufflePosts(posts).map(post => {
            if (post.user) {
                const { passwordHash, ...safeUser } = post.user;
                return { ...post, user: safeUser };
            }
            return post;
        });

        res.status(200).json({ status: true, message: 'OK', data: safePosts });
    } catch (error) {
        console.error('Error fetching list posts:', error);
        res.status(500).json({ status: false, message: error.message || 'Failed to fetch posts', data: [] });
    }
});

// GET /:id: Fetch a single list by id
router.get('/:id', async (req, res) => {
    try {
        let viewerId = null;
        const authHeader = req.headers['authorization'];
        if (authHeader) {
            const token = authHeader.split(' ')[1];
            try {
                const decoded = require('jsonwebtoken').decode(token);
                const raw = decoded?.sub || decoded?.id || decoded?.userId;
                viewerId = raw != null ? String(raw) : null;
            } catch (e) {}
        }

        const list = await prisma.list.findUnique({
            where: { id: req.params.id },
            include: {
                owner: { include: { profile: true } },
                _count: { select: { members: true, followers: true } },
                followers: viewerId ? { where: { userId: viewerId }, select: { userId: true, isPinned: true } } : undefined,
                members: viewerId ? { where: { userId: viewerId }, select: { userId: true } } : undefined
            }
        });
        if (!list) {
            return res.status(404).json({ status: false, message: 'List not found', data: null });
        }
        const data = formatListWithOwner(list, viewerId);
        res.status(200).json({ status: true, message: 'List fetched successfully', data });
    } catch (error) {

        console.error('Error fetching list:', error);
        res.status(500).json({ status: false, message: error.message || 'Failed to fetch list', data: null });
    }
});

// POST /: Create a list (with optional banner, avatar)
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { name, description, isPrivate, banner, avatar } = req.body;
        const list = await prisma.list.create({
            data: {
                ownerId: req.user.id,
                name: name || 'Untitled List',
                description: description || null,
                isPrivate: !!isPrivate,
                banner: banner || null,
                avatar: avatar || null
            }
        });
        const uid = req.user.id;
        const full = await prisma.list.findUnique({
            where: { id: list.id },
            include: {
                owner: { include: { profile: true } },
                _count: { select: { members: true, followers: true } },
                followers: { where: { userId: uid }, select: { userId: true, isPinned: true } }
            }
        });
        const data = formatListWithOwner(full, uid);
        res.status(201).json({ status: true, message: 'List created', data });
    } catch (error) {
        console.error('Error creating list:', error);
        res.status(500).json({ status: false, message: 'Failed to create list', data: null });
    }
});

// PATCH /:id/pin: Pin for owner (List.isPinned) or for a follower (ListFollower.isPinned)
router.patch('/:id/pin', authenticateToken, async (req, res) => {
    try {
        const listId = String(req.params.id);
        const userId = String(req.user.userId || req.user.id);
        const list = await prisma.list.findUnique({ where: { id: listId } });
        if (!list) {
            return res.status(404).json({ status: false, message: 'List not found', data: null });
        }
        const { pinned } = req.body;
        const pinVal = !!pinned;

        if (String(list.ownerId) === String(userId)) {
            await prisma.list.update({
                where: { id: listId },
                data: { isPinned: pinVal }
            });
        } else {
            const upd = await prisma.listFollower.updateMany({
                where: { listId, userId },
                data: { isPinned: pinVal }
            });
            if (upd.count === 0) {
                const asMember = await prisma.listMember.findFirst({
                    where: { listId, userId }
                });
                if (asMember) {
                    await prisma.listFollower.upsert({
                        where: { listId_userId: { listId, userId } },
                        create: { listId, userId, isPinned: pinVal },
                        update: { isPinned: pinVal }
                    });
                } else {
                    return res.status(403).json({
                        status: false,
                        message: 'Follow this list before you can pin it to your profile',
                        data: null
                    });
                }
            }
        }

        const full = await prisma.list.findUnique({
            where: { id: listId },
            include: {
                owner: { include: { profile: true } },
                _count: { select: { members: true, followers: true } },
                followers: {
                    where: { userId },
                    select: { userId: true, isPinned: true }
                }
            }
        });
        const data = formatListWithOwner(full, userId);
        res.status(200).json({ status: true, message: `List ${pinned ? 'pinned' : 'unpinned'} successfully`, data });
    } catch (error) {
        console.error('Error toggling list pin:', error);
        res.status(500).json({ status: false, message: 'Failed to toggle pin', data: null });
    }
});

// PATCH /:id: Edit a list (owner only)
router.patch('/:id', authenticateToken, async (req, res) => {
    try {
        const listId = req.params.id;
        const list = await prisma.list.findUnique({ where: { id: listId } });
        if (!list || list.ownerId !== req.user.id) {
            return res.status(403).json({ status: false, message: 'Not authorized to edit this list', data: null });
        }
        const { name, description, isPrivate, banner, avatar } = req.body;
        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (isPrivate !== undefined) updateData.isPrivate = !!isPrivate;
        if (banner !== undefined) updateData.banner = banner || null;
        if (avatar !== undefined) updateData.avatar = avatar || null;
        const uid = req.user.id;
        const updated = await prisma.list.update({
            where: { id: listId },
            data: updateData,
            include: {
                owner: { include: { profile: true } },
                _count: { select: { members: true, followers: true } },
                followers: { where: { userId: uid }, select: { userId: true, isPinned: true } }
            }
        });
        const data = formatListWithOwner(updated, uid);
        res.status(200).json({ status: true, message: 'List updated', data });
    } catch (error) {
        console.error('Error editing list:', error);
        res.status(500).json({ status: false, message: 'Failed to update list', data: null });
    }
});

// DELETE /:id: Delete a list (owner only)
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const listId = req.params.id;
        const list = await prisma.list.findUnique({ where: { id: listId } });
        if (!list || list.ownerId !== req.user.id) {
            return res.status(403).json({ status: false, message: 'Not authorized to delete this list', data: null });
        }
        await prisma.list.delete({ where: { id: listId } });
        res.status(200).json({ status: true, message: 'List deleted successfully', data: null });
    } catch (error) {
        console.error('Error deleting list:', error);
        res.status(500).json({ status: false, message: 'Failed to delete list', data: null });
    }
});

// POST /:id/members: Add a user to a list
router.post('/:id/members', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.body;
        const listId = req.params.id;

        // Verify ownership
        const list = await prisma.list.findUnique({
            where: { id: listId }
        });

        if (!list || list.ownerId !== req.user.id) {
            return res.status(403).json({ status: false, message: 'Not authorized or list not found', data: null });
        }

        await prisma.listMember.create({
            data: {
                listId,
                userId
            }
        });

        // Return updated list with memberCount
        const uid = req.user.id;
        const updated = await prisma.list.findUnique({
            where: { id: listId },
            include: {
                owner: { include: { profile: true } },
                _count: { select: { members: true, followers: true } },
                followers: { where: { userId: uid }, select: { userId: true, isPinned: true } }
            }
        });
        const data = formatListWithOwner(updated, uid);
        res.status(201).json({ status: true, message: 'Member added', data });
    } catch (error) {
        console.error('Error adding member to list:', error);
        if (error.code === 'P2002') {
            return res.status(400).json({ status: false, message: 'User already in list', data: null });
        }
        res.status(500).json({ status: false, message: 'Failed to add member', data: null });
    }
});

// DELETE /:id/members: Remove current user from list (leave list)
router.delete('/:id/members', authenticateToken, async (req, res) => {
    try {
        const listId = req.params.id;
        const userId = req.user.userId || req.user.id;
        const list = await prisma.list.findUnique({ where: { id: listId } });
        if (!list) {
            return res.status(404).json({ status: false, message: 'List not found', data: null });
        }
        await prisma.listMember.delete({
            where: {
                listId_userId: { listId, userId }
            }
        });
        res.status(200).json({ status: true, message: 'Left list successfully', data: null });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ status: false, message: 'Not a member of this list', data: null });
        }
        console.error('Error leaving list:', error);
        res.status(500).json({ status: false, message: error.message || 'Failed to leave list', data: null });
    }
});

// DELETE /:id/members/:userId: Remove a user from a list (owner only)
router.delete('/:id/members/:userId', authenticateToken, async (req, res) => {
    try {
        const { id: listId, userId } = req.params;

        // Verify ownership
        const list = await prisma.list.findUnique({
            where: { id: listId }
        });

        if (!list || list.ownerId !== req.user.id) {
            return res.status(403).json({ status: false, message: 'Not authorized', data: null });
        }

        await prisma.listMember.delete({
            where: {
                listId_userId: {
                    listId,
                    userId
                }
            }
        });

        res.status(200).json({ status: true, message: 'Member removed successfully', data: null });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ status: false, message: 'Member not found in list', data: null });
        }
        console.error('Error removing member from list:', error);
        res.status(500).json({ status: false, message: error.message || 'Failed to remove member', data: null });
    }
});

// POST /:id/follow: Follow a list
router.post('/:id/follow', authenticateToken, async (req, res) => {
    try {
        const listId = req.params.id;
        const userId = req.user.id;
        
        await prisma.listFollower.upsert({
            where: { listId_userId: { listId, userId } },
            create: { listId, userId },
            update: {}
        });

        res.json({ status: true, message: 'Followed list' });
    } catch (error) {
        console.error('Error following list:', error);
        res.status(500).json({ status: false, message: 'Failed to follow list' });
    }
});

// DELETE /:id/follow: Unfollow a list
router.delete('/:id/follow', authenticateToken, async (req, res) => {
    try {
        const listId = req.params.id;
        const userId = req.user.id;

        await prisma.listFollower.deleteMany({
            where: { listId, userId }
        });

        res.json({ status: true, message: 'Unfollowed list' });
    } catch (error) {
        console.error('Error unfollowing list:', error);
        res.status(500).json({ status: false, message: 'Failed to unfollow list' });
    }
});

// GET /membership/:userId: Check membership status
router.get('/membership/:userId', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;
        const yourLists = await prisma.list.findMany({
            where: { ownerId: req.user.id },
            include: {
                members: { where: { userId } },
                _count: { select: { members: true } }
            }
        });

        const status = yourLists.map(list => ({
            id: list.id,
            name: list.name,
            memberCount: list._count?.members ?? 0,
            isMember: list.members.length > 0
        }));

        res.json(status);
    } catch (error) {
        console.error('Error checking membership status:', error);
        res.status(500).json({ status: false, message: 'Failed to check membership', data: [] });
    }
});

module.exports = router;
