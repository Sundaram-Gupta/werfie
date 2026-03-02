const express = require('express');
const router = express.Router();
const AnnouncementService = require('../services/announcement.service');
const authenticateToken = require('../middleware/auth');

// Create Announcement
router.post('/create', authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?.id;
        const announcement = await AnnouncementService.createAnnouncement(req.body, userId);
        res.status(201).json(announcement);
    } catch (error) {
        console.error('Create Announcement Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update Announcement
router.put('/update/:id', authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?.id;
        const updated = await AnnouncementService.updateAnnouncement(req.params.id, req.body, userId);
        res.json(updated);
    } catch (error) {
        console.error('Update Announcement Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get Announcement Feed
router.get('/feed', async (req, res) => {
    try {
        const feed = await AnnouncementService.getFeed(req.query);
        res.json(feed);
    } catch (error) {
        console.error('Get Feed Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get Single Announcement
router.get('/:id', async (req, res) => {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    try {
        const announcement = await prisma.announcement.findUnique({
            where: { id: req.params.id },
            include: { revisions: { orderBy: { version: 'desc' } } }
        });
        if (!announcement) return res.status(404).json({ error: 'Announcement not found' });
        res.json(announcement);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Generate AI Summary
router.post('/generate-summary', authenticateToken, async (req, res) => {
    try {
        const { content } = req.body;
        if (!content) return res.status(400).json({ error: 'Content required' });
        const summary = await AnnouncementService.generateAISummary(content);
        res.json({ summary });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
