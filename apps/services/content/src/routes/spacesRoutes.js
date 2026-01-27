const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authenticateToken = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

console.log('Spaces Routes Module Loaded');

// Create a new space
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { title, topics, privacy, scheduledAt } = req.body;

        console.log('Creating space:', { title, topics, privacy, scheduledAt, hostId: req.user.id });

        const space = await prisma.space.create({
            data: {
                title,
                hostId: req.user.id,
                topics: topics || [],
                privacy: privacy || 'public',
                status: scheduledAt ? 'scheduled' : 'live',
                scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
                isLive: !scheduledAt, // Set true if starting now
                startedAt: !scheduledAt ? new Date() : null
            },
            include: {
                host: {
                    select: {
                        id: true,
                        profile: {
                            select: {
                                name: true,
                                handle: true,
                                avatar: true
                            }
                        }
                    }
                }
            }
        });

        res.status(201).json(space);
    } catch (error) {
        console.error('Error creating space:', error);
        res.status(500).json({ error: 'Failed to create space' });
    }
});

// Get all spaces (active & upcoming)
router.get('/', async (req, res) => {
    try {
        const spaces = await prisma.space.findMany({
            where: {
                status: {
                    in: ['live', 'scheduled']
                }
            },
            include: {
                host: {
                    select: {
                        id: true,
                        profile: true
                    }
                }
            },
            orderBy: [
                {
                    status: 'asc', // live before scheduled (if alphabetical, actually 'live' < 'scheduled')
                },
                {
                    scheduledAt: 'asc'
                },
                {
                    createdAt: 'desc'
                }
            ]
        });

        // Transform ALL spaces (live and scheduled) to match frontend expectation
        // Frontend expects 'upcoming' array where the first item is the Live space
        const transformedSpaces = spaces.map(s => ({
            id: s.id,
            title: s.title,
            host: s.host.profile?.name || "User",
            avatar: s.host.profile?.avatar || "/websplash.png",
            time: s.status === 'live' ? 'Live' : (s.scheduledAt ? new Date(s.scheduledAt).toLocaleString() : "Scheduled"),
            topics: s.topics,
            status: s.status,
            isLive: s.status === 'live'
        }));

        res.json({
            upcoming: transformedSpaces
        });
    } catch (error) {
        console.error('Error fetching spaces:', error);
        res.status(500).json({ error: 'Failed to fetch spaces' });
    }
});

module.exports = router;
