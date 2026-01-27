const express = require('express');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const router = express.Router();

const authenticateToken = require('../middleware/auth');

// GET /stats: Fetch business stats
// For now, we return mock stats or calculate real ones if data exists
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

        // 3. Estimate Impressions (Engagement * 20 for MVP simulation)
        // Since we don't track views/impressions in DB yet
        const estimatedImpressions = totalEngagement > 0 ? totalEngagement * 20 : followersCount * 5;

        // Helper to format numbers (e.g. 1500 -> 1.5K)
        const formatNumber = (num) => {
            if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
            if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
            return num.toString();
        };

        const stats = {
            followers: formatNumber(followersCount),
            engagement: formatNumber(totalEngagement),
            impressions: formatNumber(estimatedImpressions)
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
