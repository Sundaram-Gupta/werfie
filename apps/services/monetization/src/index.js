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

// Path rewrite for Gateway
app.use((req, res, next) => {
    if (req.url.startsWith('/api/monetization')) {
        req.url = req.url.replace('/api/monetization', '');
        if (!req.url.startsWith('/')) req.url = '/' + req.url;
    }
    next();
});

// GET /profile: Get user's monetization status
app.get('/profile', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const profile = await prisma.monetizationProfile.findUnique({
            where: { userId },
            include: { tiers: true }
        });
        if (!profile) return res.status(404).json({ error: 'Monetization not enabled' });
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
                perks: JSON.stringify(perks),
                isActive: true
            }
        });
        res.status(201).json(tier);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create tier' });
    }
});

// GET /stats: Fetch revenue stats
app.get('/stats', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const profile = await prisma.monetizationProfile.findUnique({ where: { userId } });

        // Mock data for MVP analytics
        res.json({
            balance: profile?.balance || 0,
            lifetimeEarnings: profile?.lifetimeEarnings || 0,
            activeSubscribers: 124, // Mock
            monthlyRevenue: 1250.50 // Mock
        });
    } catch (error) {
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

        const transactions = await prisma.transaction.findMany({
            where: {
                OR: [
                    { monetizationProfileId: profile?.id },
                    { subscription: { subscriberId: userId } }
                ]
            },
            include: {
                subscription: {
                    include: { tier: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(transactions);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});

app.listen(PORT, () => {
    console.log(`Monetization Service running on port ${PORT}`);
});
