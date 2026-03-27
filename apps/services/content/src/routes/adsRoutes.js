const express = require('express');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const router = express.Router();

const authenticateToken = require('../middleware/auth');
console.log('Ads Routes Module Loaded');

const PERMISSIONS = {
    AD_CREATE: 'AD_CREATE',
    AD_MANAGE: 'AD_MANAGE',
    VIEW_ANALYTICS: 'VIEW_ANALYTICS',
    SETTINGS_UPDATE: 'SETTINGS_UPDATE'
};

function normalizeRole(role) {
    return String(role || 'member').toLowerCase() === 'admin' ? 'admin' : 'member';
}

function getRolePermissions(role) {
    if (normalizeRole(role) === 'admin') {
        return {
            [PERMISSIONS.AD_CREATE]: true,
            [PERMISSIONS.AD_MANAGE]: true,
            [PERMISSIONS.VIEW_ANALYTICS]: true,
            [PERMISSIONS.SETTINGS_UPDATE]: true
        };
    }
    return {
        [PERMISSIONS.AD_CREATE]: false,
        [PERMISSIONS.AD_MANAGE]: false,
        [PERMISSIONS.VIEW_ANALYTICS]: false,
        [PERMISSIONS.SETTINGS_UPDATE]: false
    };
}

async function resolveBusinessAccess(userId) {
    const owned = await prisma.businessProfile.findUnique({ where: { userId } });
    if (owned) {
        await prisma.businessMember.upsert({
            where: { businessId_userId: { businessId: owned.id, userId } },
            create: { businessId: owned.id, userId, role: 'admin' },
            update: { role: 'admin' }
        });
        return { business: owned, role: 'admin', permissions: getRolePermissions('admin') };
    }
    const membership = await prisma.businessMember.findFirst({
        where: { userId },
        include: { business: true }
    });
    if (!membership?.business) return { business: null, role: null, permissions: getRolePermissions('member') };
    const role = normalizeRole(membership.role);
    return { business: membership.business, role, permissions: getRolePermissions(role) };
}

function requirePermission(permissionKey) {
    return async (req, res, next) => {
        try {
            const userId = req.user.userId;
            const access = await resolveBusinessAccess(userId);
            req.businessAccess = access;
            if (!access.permissions?.[permissionKey]) {
                return res.status(403).json({ error: `Forbidden: ${permissionKey} required` });
            }
            return next();
        } catch (error) {
            console.error('[Ads RBAC] Permission check failed:', error);
            return res.status(500).json({ error: 'Failed to validate permissions' });
        }
    };
}

// GET /account: Fetch or create Ad Account (auto-create business + ad account if missing so campaign launch works)
router.get('/account', authenticateToken, requirePermission(PERMISSIONS.AD_MANAGE), async (req, res) => {
    try {
        let business = req.businessAccess?.business;

        if (!business) {
            business = await prisma.businessProfile.create({
                data: {
                    userId: req.user.userId,
                    companyName: 'My Business'
                }
            });
        }

        let adAccount = await prisma.adAccount.findFirst({
            where: { businessId: business.id }
        });

        if (!adAccount) {
            adAccount = await prisma.adAccount.create({
                data: {
                    businessId: business.id,
                    status: 'active'
                }
            });
        }

        res.status(200).json({ status: true, message: 'Ad account fetched successfully', data: adAccount });
    } catch (error) {
        console.error('Error fetching ad account:', error);
        res.status(500).json({ status: false, message: error.message || 'Failed to fetch ad account', data: null });
    }
});

// PUT /account: Update ad account
router.put('/account', authenticateToken, requirePermission(PERMISSIONS.SETTINGS_UPDATE), async (req, res) => {
    try {
        const business = req.businessAccess?.business;
        if (!business) {
            return res.status(404).json({ status: false, message: 'Business profile not found', data: null });
        }
        let adAccount = await prisma.adAccount.findFirst({ where: { businessId: business.id } });
        if (!adAccount) {
            adAccount = await prisma.adAccount.create({
                data: { businessId: business.id, status: 'active' }
            });
        }
        const { status: accountStatus, currency, paymentMethod, paymentDetails } = req.body || {};
        const updateData = {};
        if (accountStatus !== undefined) updateData.status = accountStatus;
        if (currency !== undefined) updateData.currency = currency;
        if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod;
        if (paymentDetails !== undefined) updateData.paymentDetails = typeof paymentDetails === 'string' ? paymentDetails : JSON.stringify(paymentDetails);
        if (Object.keys(updateData).length > 0) {
            adAccount = await prisma.adAccount.update({
                where: { id: adAccount.id },
                data: updateData
            });
        }
        res.status(200).json({ status: true, message: 'Ad account updated successfully', data: adAccount });
    } catch (error) {
        console.error('Error updating ad account:', error);
        res.status(500).json({ status: false, message: error.message || 'Failed to update ad account', data: null });
    }
});

// GET /campaigns: Fetch all campaigns for user
router.get('/campaigns', authenticateToken, requirePermission(PERMISSIONS.AD_MANAGE), async (req, res) => {
    try {
        const businessId = req.businessAccess?.business?.id;
        const campaigns = await prisma.campaign.findMany({
            where: {
                adAccount: {
                    businessId
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
router.post('/campaigns', authenticateToken, requirePermission(PERMISSIONS.AD_CREATE), async (req, res) => {
    try {
        const { adAccountId, name, type, dailyBudget, startTime, endTime, targeting } = req.body;

        const budget = parseFloat(dailyBudget);
        if (isNaN(budget)) {
            return res.status(400).json({ error: 'Invalid daily budget. Please provide a valid number.' });
        }

        const ownedAdAccount = await prisma.adAccount.findFirst({
            where: { id: adAccountId, businessId: req.businessAccess.business.id }
        });
        if (!ownedAdAccount) {
            return res.status(403).json({ error: 'Ad account does not belong to your business' });
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
router.post('/ads', authenticateToken, requirePermission(PERMISSIONS.AD_CREATE), async (req, res) => {
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

        const campaign = await prisma.campaign.findFirst({
            where: {
                id: campaign_id,
                adAccount: { businessId: req.businessAccess.business.id }
            }
        });
        if (!campaign) {
            return res.status(403).json({ error: 'Campaign does not belong to your business' });
        }

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
router.get('/creatives', authenticateToken, requirePermission(PERMISSIONS.AD_MANAGE), async (req, res) => {
    try {
        const businessId = req.businessAccess?.business?.id;
        const ads = await prisma.ad.findMany({
            where: {
                campaign: {
                    adAccount: {
                        businessId
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
router.get('/performance', authenticateToken, requirePermission(PERMISSIONS.VIEW_ANALYTICS), async (req, res) => {
    try {
        const business = req.businessAccess?.business;

        // In a real app, calculate from Campaign/Ad models
        // For MVP, return stored snapshots or mock
        res.json({
            reach: business?.totalImpressions || "125.4K",
            spent: business?.totalSpent || "$0",
            activeAds: await prisma.ad.count({
                where: {
                    campaign: { adAccount: { businessId: business?.id } },
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
router.put('/account/billing', authenticateToken, requirePermission(PERMISSIONS.SETTINGS_UPDATE), async (req, res) => {
    try {
        const { method, details } = req.body;

        const business = req.businessAccess?.business;

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
