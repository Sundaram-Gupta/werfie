const express = require('express');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const router = express.Router();

const authenticateToken = require('../middleware/auth');

// GET /: Fetch business profile
router.get('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const profile = await prisma.businessProfile.findUnique({
            where: { userId },
            include: {
                adAccounts: true
            }
        });

        if (!profile) {
            return res.json(null);
        }

        res.json(profile);
    } catch (error) {
        console.error('Error fetching business profile:', error);
        res.status(500).json({ error: 'Failed to fetch business profile' });
    }
});

// POST /: Create or update business profile
router.post('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { companyName, industry, location, website } = req.body;

        const profile = await prisma.businessProfile.upsert({
            where: { userId },
            update: {
                companyName,
                industry,
                location,
                website
            },
            create: {
                userId,
                companyName,
                industry,
                location,
                website,
                status: 'pending' // Initial status
            }
        });

        res.json(profile);
    } catch (error) {
        console.error('Error saving business profile:', error);
        res.status(500).json({ error: 'Failed to save business profile' });
    }
});

// GET /team: Fetch all team members
router.get('/team', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const business = await prisma.businessProfile.findUnique({
            where: { userId },
            include: {
                members: {
                    include: {
                        user: {
                            include: { profile: true }
                        }
                    }
                }
            }
        });

        if (!business) return res.status(404).json({ error: 'Business profile not found' });
        res.json(business.members);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch team' });
    }
});

// POST /team: Add a team member
router.post('/team', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { memberId, role } = req.body;

        const business = await prisma.businessProfile.findUnique({ where: { userId } });
        if (!business) return res.status(404).json({ error: 'Only owners can add members' });

        const member = await prisma.businessMember.create({
            data: {
                businessId: business.id,
                userId: memberId,
                role: role || 'member'
            }
        });

        res.status(201).json(member);
    } catch (error) {
        if (error.code === 'P2002') return res.status(400).json({ error: 'User is already a member' });
        res.status(500).json({ error: 'Failed to add member' });
    }
});

// DELETE /team/:userId: Remove a team member
router.delete('/team/:memberId', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { memberId } = req.params;

        const business = await prisma.businessProfile.findUnique({ where: { userId } });
        if (!business) return res.status(404).json({ error: 'Only owners can remove members' });

        await prisma.businessMember.delete({
            where: {
                businessId_userId: {
                    businessId: business.id,
                    userId: memberId
                }
            }
        });

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to remove member' });
    }
});

// GET /stats: Fetch business stats
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. Get Followers Count
        const followersCount = await prisma.follow.count({
            where: { followingId: userId }
        });

        // 2. Get Engagement (Likes + Retweets + Replies on user's posts)
        const userPosts = await prisma.post.findMany({
            where: { userId: userId },
            include: {
                _count: {
                    select: {
                        likes: true,
                        retweets: true,
                        replies: true
                    }
                }
            }
        });

        let totalEngagement = 0;
        userPosts.forEach(post => {
            totalEngagement += (post._count.likes + post._count.retweets + post._count.replies);
        });

        // 3. Get Ads Stats if Business Profile exists
        const businessProfile = await prisma.businessProfile.findUnique({
            where: { userId },
            select: { totalSpent: true, totalImpressions: true }
        });

        // Helper to format numbers (e.g. 1500 -> 1.5K)
        const formatNumber = (num) => {
            const n = parseFloat(num);
            if (isNaN(n)) return "0";
            if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
            if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
            return n.toString();
        };

        const stats = {
            followers: formatNumber(followersCount),
            engagement: formatNumber(totalEngagement),
            impressions: formatNumber(businessProfile?.totalImpressions || (totalEngagement * 20)),
            spent: businessProfile?.totalSpent || "0"
        };

        res.json(stats);
    } catch (error) {
        console.error('Error fetching business stats:', error);
        res.status(500).json({ error: 'Failed to fetch business stats' });
    }
});

// POST /boost: Mock boost endpoint
router.post('/boost', authenticateToken, async (req, res) => {
    try {
        // Mock success
        await new Promise(resolve => setTimeout(resolve, 1000));
        res.json({ success: true, message: 'Boost activated successfully' });
    } catch (error) {
        console.error('Error boosting post:', error);
        res.status(500).json({ error: 'Failed to boost post' });
    }
});

module.exports = router;
