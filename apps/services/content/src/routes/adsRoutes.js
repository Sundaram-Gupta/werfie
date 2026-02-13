const express = require('express');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const router = express.Router();

const authenticateToken = require('../middleware/auth');
console.log('Ads Routes Module Loaded');

// GET /account: Fetch or create Ad Account
router.get('/account', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        // Find business profile
        const business = await prisma.businessProfile.findUnique({
            where: { userId }
        });

        if (!business) {
            return res.status(404).json({ error: 'Business profile not found. Please create one first.' });
        }

        let adAccount = await prisma.adAccount.findFirst({
            where: { businessId: business.id }
        });

        if (!adAccount) {
            // Auto-create ad account for now (or wait for approval)
            adAccount = await prisma.adAccount.create({
                data: {
                    businessId: business.id,
                    status: 'active'
                }
            });
        }

        res.json(adAccount);
    } catch (error) {
        console.error('Error fetching ad account:', error);
        res.status(500).json({ error: 'Failed to fetch ad account' });
    }
});

// GET /campaigns: Fetch all campaigns for user
router.get('/campaigns', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const campaigns = await prisma.campaign.findMany({
            where: {
                adAccount: {
                    business: { userId }
                }
            },
            include: {
                ads: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(campaigns);
    } catch (error) {
        console.error('Error fetching campaigns:', error);
        res.status(500).json({ error: 'Failed to fetch campaigns' });
    }
});

// POST /campaigns: Create new campaign
router.post('/campaigns', authenticateToken, async (req, res) => {
    try {
        const { adAccountId, name, type, dailyBudget, startTime, endTime, targeting } = req.body;

        const budget = parseFloat(dailyBudget);
        if (isNaN(budget)) {
            return res.status(400).json({ error: 'Invalid daily budget. Please provide a valid number.' });
        }

        const campaign = await prisma.campaign.create({
            data: {
                adAccountId,
                name,
                type,
                dailyBudget: budget,
                startTime: new Date(startTime),
                endTime: endTime ? new Date(endTime) : null,
                targeting: targeting ? JSON.stringify(targeting) : null,
                status: 'active'
            }
        });
        res.status(201).json(campaign);
    } catch (error) {
        console.error('[Ads API] Error creating campaign:', error);
        res.status(500).json({ error: 'Failed to create campaign', details: error.message });
    }
});

// POST /ads: Create new ad creative
router.post('/ads', authenticateToken, async (req, res) => {
    try {
        const {
            campaign_id,
            ad_name,
            ad_type,
            primary_text,
            headline,
            media_url,
            thumbnail_url,
            cta_type,
            destination_url,
            status
        } = req.body;

        const ad = await prisma.ad.create({
            data: {
                campaignId: campaign_id,
                name: ad_name,
                adType: ad_type,
                primaryText: primary_text,
                headline,
                mediaUrl: media_url,
                thumbnailUrl: thumbnail_url,
                ctaType: cta_type,
                destinationUrl: destination_url,
                status: status || 'active'
            }
        });
        res.status(201).json(ad);
    } catch (error) {
        console.error('[Ads API] Error creating ad:', error);
        res.status(500).json({ error: 'Failed to create ad', details: error.message });
    }
});

// GET /creatives: Fetch all ads for user
router.get('/creatives', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const ads = await prisma.ad.findMany({
            where: {
                campaign: {
                    adAccount: {
                        business: { userId }
                    }
                }
            },
            include: {
                campaign: {
                    select: { name: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(ads);
    } catch (error) {
        console.error('Error fetching ads:', error);
        res.status(500).json({ error: 'Failed to fetch ads' });
    }
});

// GET /performance: Fetch performance stats
router.get('/performance', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const business = await prisma.businessProfile.findUnique({
            where: { userId },
            select: { totalSpent: true, totalImpressions: true }
        });

        // In a real app, calculate from Campaign/Ad models
        // For MVP, return stored snapshots or mock
        res.json({
            reach: business?.totalImpressions || "125.4K",
            spent: business?.totalSpent || "$0",
            activeAds: await prisma.ad.count({
                where: {
                    campaign: { adAccount: { business: { userId } } },
                    status: 'active'
                }
            })
        });
    } catch (error) {
        console.error('Error fetching performance:', error);
        res.status(500).json({ error: 'Failed to fetch performance' });
    }
});

// PUT /account/billing: Update ad account billing details
router.put('/account/billing', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { method, details } = req.body;

        const business = await prisma.businessProfile.findUnique({
            where: { userId }
        });

        if (!business) {
            return res.status(404).json({ error: 'Business profile not found' });
        }

        const adAccount = await prisma.adAccount.updateMany({
            where: { businessId: business.id },
            data: {
                paymentMethod: method,
                paymentDetails: JSON.stringify(details)
            }
        });

        res.json({ message: 'Billing details updated', adAccount });
    } catch (error) {
        console.error('Billing Update Error:', error);
        res.status(500).json({ error: 'Failed to update billing details' });
    }
});

module.exports = router;
