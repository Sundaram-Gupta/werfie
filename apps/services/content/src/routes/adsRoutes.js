const express = require('express');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const router = express.Router();

const authenticateToken = require('../middleware/auth');
console.log('Ads Routes Module Loaded');

// GET /: Fetch all campaigns for user
router.get('/', authenticateToken, async (req, res) => {

    try {
        console.log('Fetching ads for user:', req.user.id);
        const campaigns = await prisma.adCampaign.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' }
        });
        res.json(campaigns);
    } catch (error) {
        console.error('Error fetching campaigns:', error);
        res.status(500).json({ error: 'Failed to fetch campaigns' });
    }
});

// POST /: Create new campaign
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { name, budget, goal } = req.body;
        const campaign = await prisma.adCampaign.create({
            data: {
                userId: req.user.id,
                name,
                budget,
                goal,
                status: 'Active',
                impressions: '0',
                clicks: '0'
            }
        });
        res.status(201).json(campaign);
    } catch (error) {
        console.error('Error creating campaign:', error);
        res.status(500).json({ error: 'Failed to create campaign' });
    }
});

// GET /performance: Fetch performance stats (Mock/Aggregated)
router.get('/performance', authenticateToken, async (req, res) => {
    try {
        // In a real app, query database aggregation
        // For now, return the structure the frontend expects
        res.json({
            reach: "125.4K",
            engagement: "14.2%",
            cpc: "$1.24"
        });
    } catch (error) {
        console.error('Error fetching performance:', error);
        res.status(500).json({ error: 'Failed to fetch performance' });
    }
});

module.exports = router;
