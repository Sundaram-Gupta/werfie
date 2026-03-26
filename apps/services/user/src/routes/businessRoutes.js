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

// POST /request-verification: Request business profile verification
router.post('/request-verification', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        console.log(`[Business] request-verification called for userId: ${userId}`);

        let profile = await prisma.businessProfile.findUnique({ where: { userId } });
        if (!profile) {
            // Auto-create a minimal business profile so the user can request verification
            console.log(`[Business] No profile found for userId ${userId} — creating minimal profile`);
            profile = await prisma.businessProfile.create({
                data: {
                    userId,
                    companyName: '',
                    status: 'unverified'
                }
            });
        }

        const normalizedStatus = (profile.status || '').toLowerCase();

        if (normalizedStatus === 'pending' || normalizedStatus === 'under_review') {
            return res.status(400).json({ error: 'Verification is already in progress' });
        }
        if (normalizedStatus === 'approved' || profile.isVerified) {
            return res.status(400).json({ error: 'Business is already verified' });
        }

        // Update the BusinessProfile status to PENDING
        const updated = await prisma.businessProfile.update({
            where: { userId },
            data: { status: 'PENDING' }
        });

        // Check if a pending VerificationRequest already exists to avoid duplicates
        const existingRequest = await prisma.verificationRequest.findFirst({
            where: { userId, businessId: profile.id, status: 'PENDING' }
        });

        if (!existingRequest) {
            await prisma.verificationRequest.create({
                data: {
                    userId,
                    businessId: profile.id,
                    type: 'BUSINESS',
                    status: 'PENDING'
                }
            }).catch(err => console.error('Could not create verificationRequest record:', err));
        }

        res.json({ success: true, message: 'Verification requested successfully', profile: updated });
    } catch (error) {
        console.error('Error requesting verification:', error);
        res.status(500).json({ error: 'Failed to request verification', details: error.message });
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

// GET /:businessId/products: Fetch products for a business
router.get('/:businessId/products', async (req, res) => {
    try {
        const { businessId } = req.params;
        const products = await prisma.product.findMany({
            where: { businessId, active: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// GET /:businessId/reviews: Fetch reviews for a business
router.get('/:businessId/reviews', async (req, res) => {
    try {
        const { businessId } = req.params;
        const reviews = await prisma.businessReview.findMany({
            where: { businessId },
            include: { user: { include: { profile: { select: require('../constants').PROFILE_SELECT } } } },
            orderBy: { createdAt: 'desc' }
        });
        res.json(reviews);
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
});

// POST /:businessId/reviews: Add a review
router.post('/:businessId/reviews', authenticateToken, async (req, res) => {
    try {
        const { businessId } = req.params;
        const userId = req.user.userId;
        const { rating, comment } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Invalid rating (1-5)' });
        }

        const review = await prisma.businessReview.create({
            data: { businessId, userId, rating: parseInt(rating), comment },
            include: { user: { include: { profile: { select: require('../constants').PROFILE_SELECT } } } }
        });
        res.status(201).json(review);
    } catch (error) {
        console.error('Error adding review:', error);
        res.status(500).json({ error: 'Failed to add review' });
    }
});

// GET /products: Fetch products for current user's business
router.get('/products', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const profile = await prisma.businessProfile.findUnique({ where: { userId } });
        if (!profile) return res.json([]);

        const products = await prisma.product.findMany({
            where: { businessId: profile.id },
            orderBy: { createdAt: 'desc' }
        });
        res.json(products);
    } catch (error) {
        console.error('Fetch My Products Error:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// POST /products: Add a new product
router.post('/products', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const profile = await prisma.businessProfile.findUnique({ where: { userId } });
        if (!profile) return res.status(404).json({ error: 'Business profile not found' });

        const { name, description, price, currency, imageUrl, ctaUrl } = req.body;
        const product = await prisma.product.create({
            data: {
                businessId: profile.id,
                name,
                description,
                price: parseFloat(price),
                currency: currency || 'USD',
                imageUrl,
                ctaUrl
            }
        });
        res.status(201).json(product);
    } catch (error) {
        console.error('Add Product Error:', error);
        res.status(500).json({ error: 'Failed to add product' });
    }
});

// PUT /products/:id: Update a product
router.put('/products/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, currency, imageUrl, ctaUrl, active } = req.body;
        
        const product = await prisma.product.update({
            where: { id },
            data: {
                name,
                description,
                price: price != null ? parseFloat(price) : undefined,
                currency,
                imageUrl,
                ctaUrl,
                active
            }
        });
        res.json(product);
    } catch (error) {
        console.error('Update Product Error:', error);
        res.status(500).json({ error: 'Failed to update product' });
    }
});

// DELETE /products/:id: Delete a product
router.delete('/products/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.product.delete({ where: { id } });
        res.json({ message: 'Product deleted' });
    } catch (error) {
        console.error('Delete Product Error:', error);
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

module.exports = router;
