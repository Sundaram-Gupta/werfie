const express = require('express');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const router = express.Router();

const authenticateToken = require('../middleware/auth');

// GET /pinned: Fetch pinned lists
router.get('/pinned', authenticateToken, async (req, res) => {
    try {
        // MVP: Return random lists or specific pinned logic
        // For now, fetch top 2 public lists
        const pinned = await prisma.list.findMany({
            where: { isPrivate: false },
            take: 2,
            include: { owner: true } // Need owner details for UI
        });

        // Transform to match frontend props (if needed)
        const formatted = pinned.map(list => ({
            id: list.id,
            name: list.name,
            members: "10K members", // Mock members count for now or query relations
            avatar: list.banner || "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=2428&auto=format&fit=crop"
        }));

        res.json(formatted);
    } catch (error) {
        console.error('Error fetching pinned lists:', error);
        res.status(500).json({ error: 'Failed to fetch pinned lists' });
    }
});

// GET /discover: Fetch discoverable lists
router.get('/discover', authenticateToken, async (req, res) => {
    try {
        const discover = await prisma.list.findMany({
            where: { isPrivate: false },
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: { owner: true }
        });

        const formatted = discover.map(list => ({
            id: list.id,
            name: list.name,
            owner: list.owner ? `@${list.owner.email.split('@')[0]}` : "@user",
            members: "5.2K members"
        }));

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
            orderBy: { createdAt: 'desc' }
        });

        res.json(yourLists.map(list => ({
            ...list,
            members: "1 member" // Just owner for now
        })));
    } catch (error) {
        console.error('Error fetching your lists:', error);
        res.status(500).json({ error: 'Failed to fetch your lists' });
    }
});

// POST /: Create a list
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { name, description, isPrivate } = req.body;
        const list = await prisma.list.create({
            data: {
                ownerId: req.user.id,
                name,
                description,
                isPrivate: isPrivate || false
            }
        });
        res.status(201).json(list);
    } catch (error) {
        console.error('Error creating list:', error);
        res.status(500).json({ error: 'Failed to create list' });
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
            return res.status(403).json({ error: 'Not authorized or list not found' });
        }

        const member = await prisma.listMember.create({
            data: {
                listId,
                userId
            }
        });

        res.status(201).json(member);
    } catch (error) {
        console.error('Error adding member to list:', error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'User already in list' });
        }
        res.status(500).json({ error: 'Failed to add member' });
    }
});

// DELETE /:id/members/:userId: Remove a user from a list
router.delete('/:id/members/:userId', authenticateToken, async (req, res) => {
    try {
        const { id: listId, userId } = req.params;

        // Verify ownership
        const list = await prisma.list.findUnique({
            where: { id: listId }
        });

        if (!list || list.ownerId !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        await prisma.listMember.delete({
            where: {
                listId_userId: {
                    listId,
                    userId
                }
            }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error removing member from list:', error);
        res.status(500).json({ error: 'Failed to remove member' });
    }
});

// GET /membership/:userId: Check membership status
router.get('/membership/:userId', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;
        const yourLists = await prisma.list.findMany({
            where: { ownerId: req.user.id },
            include: {
                members: {
                    where: { userId }
                }
            }
        });

        const status = yourLists.map(list => ({
            id: list.id,
            name: list.name,
            isMember: list.members.length > 0
        }));

        res.json(status);
    } catch (error) {
        console.error('Error checking membership status:', error);
        res.status(500).json({ error: 'Failed to check membership' });
    }
});

module.exports = router;
