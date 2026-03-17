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

        // Find business where user is owner OR member
        const business = await prisma.businessProfile.findFirst({
            where: {
                OR: [
                    { userId: userId },
                    { members: { some: { userId: userId } } }
                ]
            },
            include: {
                members: {
                    include: {
                        user: {
                            include: { profile: { select: require('../constants').PROFILE_SELECT } }
                        }
                    }
                }
            }
        });

        if (!business) return res.status(404).json({ error: 'Business profile not found' });
        res.json(business.members);
    } catch (error) {
        console.error('Error fetching team:', error);
        res.status(500).json({ error: 'Failed to fetch team' });
    }
});

// POST /team: Add a team member
router.post('/team', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { identifier, role } = req.body; // identifier can be email or handle

        const business = await prisma.businessProfile.findUnique({ where: { userId } });
        if (!business) return res.status(404).json({ error: 'Only owners can add members' });

        // Find user by email or handle
        const targetUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: identifier },
                    { profile: { handle: identifier.startsWith('@') ? identifier.substring(1) : identifier } }
                ]
            }
        });

        if (!targetUser) return res.status(404).json({ error: 'User not found' });

        const member = await prisma.businessMember.create({
            data: {
                businessId: business.id,
                userId: targetUser.id,
                role: role || 'member'
            }
        });

        res.status(201).json(member);
    } catch (error) {
        if (error.code === 'P2002') return res.status(400).json({ error: 'User is already a member' });
        console.error('Error adding team member:', error);
        res.status(500).json({ error: 'Failed to add member' });
    }
});

// PATCH /team/:memberId: Update team member role
router.patch('/team/:memberId', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { memberId } = req.params;
        const { role } = req.body;

        const business = await prisma.businessProfile.findUnique({ where: { userId } });
        if (!business) return res.status(404).json({ error: 'Only owners can update member roles' });

        const member = await prisma.businessMember.update({
            where: {
                businessId_userId: {
                    businessId: business.id,
                    userId: memberId
                }
            },
            data: { role }
        });

        res.json(member);
    } catch (error) {
        console.error('Error updating team member role:', error);
        res.status(500).json({ error: 'Failed to update role' });
    }
});

// DELETE /team/:memberId: Remove a team member
router.delete('/team/:memberId', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { memberId } = req.params;

        // Check if user is the owner
        const business = await prisma.businessProfile.findUnique({ where: { userId } });
        if (!business) return res.status(404).json({ error: 'Only owners can remove members' });

        try {
            await prisma.businessMember.delete({
                where: {
                    businessId_userId: {
                        businessId: business.id,
                        userId: memberId
                    }
                }
            });
        } catch (delError) {
            if (delError.code === 'P2025') {
                return res.status(404).json({ error: 'Team member not found' });
            }
            throw delError;
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error removing team member:', error);
        res.status(500).json({ error: 'Failed to remove member' });
    }
});

// GET /stats: Fetch business stats (user-specific)
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        const business = await prisma.businessProfile.findFirst({
            where: {
                OR: [
                    { userId: userId },
                    { members: { some: { userId: userId } } }
                ]
            }
        });

        const targetUserId = business ? business.userId : userId;

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [followersCount, newFollowers30, userPosts] = await Promise.all([
            prisma.follow.count({ where: { followingId: targetUserId } }),
            prisma.follow.count({ where: { followingId: targetUserId, createdAt: { gte: thirtyDaysAgo } } }),
            prisma.post.findMany({
                where: { userId: targetUserId, replyToId: null },
                include: {
                    _count: { select: { likes: true, retweets: true, replies: true } },
                    media: { take: 1 }
                },
                orderBy: { createdAt: 'desc' },
                take: 50
            })
        ]);

        let totalEngagement = 0;
        userPosts.forEach(post => {
            totalEngagement += (post._count.likes + post._count.retweets + post._count.replies);
        });

        const postCount = userPosts.length;
        const prevFollowers = Math.max(followersCount - newFollowers30, 0);
        const followersGrowth = prevFollowers > 0 ? ((newFollowers30 / prevFollowers) * 100).toFixed(1) : (followersCount > 0 ? '100' : '0');
        const impressions = business?.totalImpressions ? parseInt(business.totalImpressions, 10) : Math.max(totalEngagement * 20, followersCount * 5);
        const prevImpressions = Math.max(Math.floor(impressions * 0.92), 1);
        const impressionsGrowth = (((impressions - prevImpressions) / prevImpressions) * 100).toFixed(1);
        const engagementRate = postCount > 0 && followersCount > 0
            ? ((totalEngagement / (postCount * followersCount)) * 100).toFixed(1)
            : '0';
        const profileVisits = Math.max(Math.floor(followersCount * 0.25), Math.floor(impressions / 15));
        const profileVisitsGrowth = followersCount > 0 ? followersGrowth : '0';

        const formatNumber = (num) => {
            const n = typeof num === 'number' ? num : parseFloat(num);
            if (isNaN(n)) return '0';
            if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
            if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
            return Math.round(n).toString();
        };

        const topPosts = userPosts
            .map(p => ({
                id: p.id,
                content: p.content,
                createdAt: p.createdAt,
                engagement: p._count.likes + p._count.retweets + p._count.replies,
                reach: (p._count.likes + p._count.retweets) * 10 + followersCount,
                mediaUrl: p.media?.[0]?.mediaUrl
            }))
            .sort((a, b) => b.engagement - a.engagement)
            .slice(0, 5);

        res.json({
            followers: formatNumber(followersCount),
            totalFollowers: followersCount,
            followersGrowth,
            impressions: formatNumber(impressions),
            impressionsGrowth,
            engagement: formatNumber(totalEngagement),
            engagementRate,
            engagementTrend: parseFloat(engagementRate) >= 2 ? 'up' : 'down',
            profileVisits: formatNumber(profileVisits),
            profileVisitsGrowth,
            spent: business?.totalSpent || '0',
            topPosts
        });
    } catch (error) {
        console.error('Error fetching business stats:', error);
        res.status(500).json({ error: 'Failed to fetch business stats' });
    }
});

// POST /verify-domain: Domain verification (mock or real)
router.post('/verify-domain', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { domain } = req.body || {};
        // In a real scenario: validate domain ownership (e.g. DNS TXT, file, or email)
        const profile = await prisma.businessProfile.findUnique({ where: { userId } });
        if (!profile) {
            return res.status(404).json({ status: false, message: 'Business profile not found', data: null });
        }
        // Mock: accept verification; real impl would check domain
        res.status(200).json({ status: true, message: 'Domain verified successfully', data: { domain: domain || profile.website, verified: true } });
    } catch (error) {
        console.error('Error verifying domain:', error);
        res.status(500).json({ status: false, message: error.message || 'Failed to verify domain', data: null });
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
