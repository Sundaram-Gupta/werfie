const express = require('express');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const router = express.Router();

const authenticateToken = require('../middleware/auth');

// GET /pinned: Fetch pinned lists
router.get('/pinned', authenticateToken, async (req, res) => {
    try {
        const pinned = await prisma.list.findMany({
            where: { 
                ownerId: req.user.id,
                isPinned: true 
            },
            include: {
                owner: { include: { profile: true } },
                _count: { select: { members: true } }
            }
        });

        const formatted = pinned.map(list => {
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
                currentUserId = decoded.sub || decoded.id || decoded.userId;
            } catch (e) {}
        }

        const discover = await prisma.list.findMany({
            where: { isPrivate: false },
            take: limit,
            skip: offset,
            orderBy: { createdAt: 'desc' },
            include: {
                owner: { include: { profile: true } },
                _count: { select: { members: true, followers: true } },
                followers: currentUserId ? { where: { userId: currentUserId } } : false
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

// GET /yours: Fetch user's lists
router.get('/yours', authenticateToken, async (req, res) => {
    try {
        const yourLists = await prisma.list.findMany({
            where: { ownerId: req.user.id },
            orderBy: { createdAt: 'desc' },
            include: {
                owner: { include: { profile: true } },
                _count: { select: { members: true, followers: true } }
            }
        });

        res.json(yourLists.map(list => formatListWithOwner(list)));
    } catch (error) {
        console.error('Error fetching your lists:', error);
        res.status(500).json({ error: 'Failed to fetch your lists' });
    }
});

// Helper: format list with owner + counts
function formatListWithOwner(list) {
    const owner = list.owner || {};
    const profile = owner.profile || {};
    const ownerName = profile.name || owner.email?.split('@')[0] || 'User';
    const ownerHandle = profile.handle || owner.email?.split('@')[0] || 'user';
    const memberCount = list._count?.members ?? (Array.isArray(list.members) ? list.members.length : 0);
    const followerCount = list._count?.followers ?? (Array.isArray(list.followers) ? list.followers.length : 0);
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
        memberCount,
        followerCount,
        isPinned: !!list.isPinned,
        owner: { id: owner.id, name: ownerName, handle: ownerHandle, profile },
        ...(Array.isArray(list.members) && list.members.length > 0 ? { members: list.members } : {})
    };
}

// GET /:id/members - must be before /:id
router.get('/:id/members', async (req, res) => {
    try {
        const listId = req.params.id;
        const list = await prisma.list.findUnique({
            where: { id: listId },
            include: {
                members: {
                    include: {
                        user: { include: { profile: true } }
                    }
                }
            }
        });
        if (!list) {
            return res.status(404).json({ status: false, message: 'List not found', data: [] });
        }
        const data = list.members.map(m => {
            const u = m.user || {};
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
        const safePosts = posts.map(post => {
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
        const list = await prisma.list.findUnique({
            where: { id: req.params.id },
            include: {
                owner: { include: { profile: true } },
                _count: { select: { members: true, followers: true } }
            }
        });
        if (!list) {
            return res.status(404).json({ status: false, message: 'List not found', data: null });
        }
        const data = formatListWithOwner(list);
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
        const full = await prisma.list.findUnique({
            where: { id: list.id },
            include: {
                owner: { include: { profile: true } },
                _count: { select: { members: true, followers: true } }
            }
        });
        const data = formatListWithOwner(full);
        res.status(201).json({ status: true, message: 'List created', data });
    } catch (error) {
        console.error('Error creating list:', error);
        res.status(500).json({ status: false, message: 'Failed to create list', data: null });
    }
});

// PATCH /:id/pin: Pin/Unpin a list (owner only)
router.patch('/:id/pin', authenticateToken, async (req, res) => {
    try {
        const listId = req.params.id;
        const list = await prisma.list.findUnique({ where: { id: listId } });
        if (!list || list.ownerId !== req.user.id) {
            return res.status(403).json({ status: false, message: 'Not authorized or list not found', data: null });
        }
        const { pinned } = req.body;
        const updated = await prisma.list.update({
            where: { id: listId },
            data: { isPinned: !!pinned },
            include: {
                owner: { include: { profile: true } },
                _count: { select: { members: true, followers: true } }
            }
        });
        const data = formatListWithOwner(updated);
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
        const updated = await prisma.list.update({
            where: { id: listId },
            data: updateData,
            include: {
                owner: { include: { profile: true } },
                _count: { select: { members: true, followers: true } }
            }
        });
        const data = formatListWithOwner(updated);
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
        const updated = await prisma.list.findUnique({
            where: { id: listId },
            include: {
                owner: { include: { profile: true } },
                _count: { select: { members: true, followers: true } }
            }
        });
        const data = formatListWithOwner(updated);
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
