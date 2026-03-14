const express = require('express');
const { PrismaClient } = require('@prisma/client');
const cors = require('cors');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3014;

const authenticateToken = require('./middleware/auth');

app.use(cors());
app.use(express.json());
app.use(require('./middleware/api-response'));

// Path rewrite for Gateway (must run first so /health matches after rewrite)
app.use((req, res, next) => {
    if (req.url.startsWith('/api/monetization')) {
        req.url = req.url.replace('/api/monetization', '');
        if (!req.url.startsWith('/')) req.url = '/' + req.url;
    }
    next();
});

app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'monetization-service' });
});

// GET /profile: Get user's monetization status
app.get('/profile', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const profile = await prisma.monetizationProfile.findUnique({
            where: { userId },
            include: { tiers: true }
        });
        if (!profile) return res.status(200).json({ status: true, message: 'Monetization not enabled', data: null });
        res.json(profile);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch monetization profile' });
    }
});

// POST /apply: Apply for monetization
app.post('/apply', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const profile = await prisma.monetizationProfile.create({
            data: {
                userId,
                status: 'pending'
            }
        });
        res.status(201).json(profile);
    } catch (error) {
        res.status(500).json({ error: 'Failed to apply' });
    }
});

// GET /tiers: List creator's subscription tiers with subscriber counts
app.get('/tiers', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const profile = await prisma.monetizationProfile.findUnique({
            where: { userId },
            include: {
                tiers: { where: { isActive: true }, orderBy: { price: 'asc' } }
            }
        });
        if (!profile) return res.json([]);

        const tiersWithCounts = await Promise.all(profile.tiers.map(async (tier) => {
            const subscribers = await prisma.subscription.count({
                where: { tierId: tier.id, status: 'active' }
            });
            let perks = [];
            try {
                perks = tier.perks ? JSON.parse(tier.perks || '[]') : [];
            } catch {}
            return {
                id: tier.id,
                name: tier.name,
                price: tier.price,
                description: tier.description,
                perks,
                subscribers
            };
        }));
        res.json(tiersWithCounts);
    } catch (error) {
        console.error('Tiers error:', error);
        res.status(500).json({ error: 'Failed to fetch tiers' });
    }
});

// POST /tiers: Add subscription tier
app.post('/tiers', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { name, price, description, perks } = req.body;

        const profile = await prisma.monetizationProfile.findUnique({ where: { userId } });
        if (!profile) return res.status(404).json({ error: 'Monetization profile not found' });

        const tier = await prisma.subscriptionTier.create({
            data: {
                monetizationProfileId: profile.id,
                name,
                price: parseFloat(price),
                description,
                perks: perks ? JSON.stringify(perks) : null,
                isActive: true
            }
        });
        res.status(201).json(tier);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create tier' });
    }
});

// PUT /tiers/:id: Update subscription tier
app.put('/tiers/:id', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const { name, price, description, perks, isActive } = req.body;

        const profile = await prisma.monetizationProfile.findUnique({ where: { userId } });
        if (!profile) return res.status(404).json({ error: 'Monetization profile not found' });

        const tier = await prisma.subscriptionTier.findFirst({
            where: { id, monetizationProfileId: profile.id }
        });
        if (!tier) return res.status(404).json({ error: 'Tier not found' });

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (price !== undefined) updateData.price = parseFloat(price);
        if (description !== undefined) updateData.description = description;
        if (perks !== undefined) updateData.perks = perks ? JSON.stringify(perks) : null;
        if (isActive !== undefined) updateData.isActive = !!isActive;

        const updated = await prisma.subscriptionTier.update({
            where: { id },
            data: updateData
        });
        res.json(updated);
    } catch (error) {
        console.error('Update tier error:', error);
        res.status(500).json({ error: 'Failed to update tier' });
    }
});

// GET /stats: Fetch real revenue stats from subscriptions and transactions
app.get('/stats', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const profile = await prisma.monetizationProfile.findUnique({
            where: { userId },
            include: { tiers: true }
        });

        if (!profile) {
            return res.json({
                balance: 0,
                lifetimeEarnings: 0,
                activeSubscribers: 0,
                monthlyRevenue: 0,
                tipsReceived: 0,
                tiersWithCounts: []
            });
        }

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const [activeSubscribers, monthlyTransactions, tipsTransactions, tierCounts] = await Promise.all([
            prisma.subscription.count({
                where: {
                    tier: { monetizationProfileId: profile.id },
                    status: 'active'
                }
            }),
            prisma.transaction.aggregate({
                where: {
                    monetizationProfileId: profile.id,
                    type: 'subscription_payment',
                    status: 'completed',
                    createdAt: { gte: startOfMonth }
                },
                _sum: { amount: true }
            }),
            prisma.transaction.aggregate({
                where: {
                    monetizationProfileId: profile.id,
                    type: 'tip',
                    status: 'completed'
                },
                _sum: { amount: true }
            }),
            Promise.all((profile.tiers || []).map(async (tier) => ({
                id: tier.id,
                name: tier.name,
                price: tier.price,
                subscribers: await prisma.subscription.count({
                    where: { tierId: tier.id, status: 'active' }
                })
            })))
        ]);

        const monthlyRevenue = Number(monthlyTransactions._sum?.amount || 0);
        const tipsReceived = Number(tipsTransactions._sum?.amount || 0);

        res.json({
            balance: Number(profile.balance || 0),
            lifetimeEarnings: Number(profile.lifetimeEarnings || 0),
            activeSubscribers,
            monthlyRevenue,
            tipsReceived,
            tiersWithCounts: tierCounts
        });
    } catch (error) {
        console.error('Monetization stats error:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// POST /subscribe: Subscribe to a creator tier
app.post('/subscribe', authenticateToken, async (req, res) => {
    try {
        const subscriberId = req.user.userId;
        const { tierId } = req.body;

        const tier = await prisma.subscriptionTier.findUnique({
            where: { id: tierId },
            include: { monetizationProfile: true }
        });

        if (!tier) return res.status(404).json({ error: 'Tier not found' });

        // Create subscription
        const subscription = await prisma.subscription.create({
            data: {
                tierId,
                subscriberId,
                status: 'active',
                currentPeriodStart: new Date(),
                currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
            }
        });

        // Create transaction
        await prisma.transaction.create({
            data: {
                monetizationProfileId: tier.monetizationProfileId,
                subscriptionId: subscription.id,
                type: 'subscription_payment',
                amount: tier.price,
                status: 'completed'
            }
        });

        // Update creator balance
        await prisma.monetizationProfile.update({
            where: { id: tier.monetizationProfileId },
            data: {
                balance: { increment: tier.price },
                lifetimeEarnings: { increment: tier.price }
            }
        });

        res.status(201).json(subscription);
    } catch (error) {
        console.error('Subscription Error:', error);
        res.status(500).json({ error: 'Failed to subscribe' });
    }
});

// GET /transactions: Get user's transaction history
app.get('/transactions', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const profile = await prisma.monetizationProfile.findUnique({ where: { userId } });

        const whereClause = profile
            ? {
                OR: [
                    { monetizationProfileId: profile.id },
                    { subscription: { subscriberId: userId } }
                ]
            }
            : { subscription: { subscriberId: userId } };

        const transactions = await prisma.transaction.findMany({
            where: whereClause,
            include: {
                subscription: {
                    include: { tier: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(transactions);
    } catch (error) {
        console.error('Transactions Error:', error);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});

// PUT /payout-method: Update payout details
app.put('/payout-method', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { method, details } = req.body;

        const profile = await prisma.monetizationProfile.update({
            where: { userId },
            data: {
                payoutMethod: method,
                payoutDetails: JSON.stringify(details)
            }
        });

        res.json(profile);
    } catch (error) {
        console.error('Payout Method Error:', error);
        res.status(500).json({ error: 'Failed to update payout method' });
    }
});

app.listen(PORT, () => {
    console.log(`Monetization Service running on port ${PORT}`);
});
