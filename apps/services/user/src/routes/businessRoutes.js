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
                            include: { profile: true }
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

// GET /stats: Fetch business stats
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        // Find business user belongs to (owner or member)
        const business = await prisma.businessProfile.findFirst({
            where: {
                OR: [
                    { userId: userId },
                    { members: { some: { userId: userId } } }
                ]
            }
        });

        // Use business owner ID if found, otherwise fallback to current user
        const targetUserId = business ? business.userId : userId;

        // 1. Get Followers Count
        const followersCount = await prisma.follow.count({
            where: { followingId: targetUserId }
        });

        // 2. Get Engagement (Likes + Retweets + Replies on target user's posts)
        const userPosts = await prisma.post.findMany({
            where: { userId: targetUserId },
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

        // 3. Get Ads Stats from the business profile if it exists
        const totalSpent = business?.totalSpent || "0";
        const totalImpressionsVal = business?.totalImpressions || (totalEngagement * 20).toString();

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
            impressions: formatNumber(totalImpressionsVal),
            spent: totalSpent
        };

        res.json(stats);
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
