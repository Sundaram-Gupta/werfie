const { PrismaClient } = require('@prisma/client');
const { getCached, setCached } = require('../services/enterpriseCache');
const { processNewAnnouncement } = require('../services/enterpriseSignalEngine');

const prisma = new PrismaClient();

// Get signals with pagination and filters
async function getSignals(req, res) {
    try {
        const { category, region, impact_score, start_date, end_date, page = 1, limit = 20 } = req.query;
        let where = {};
        if (category) where.category = category;
        if (region) where.region = region;
        if (impact_score) where.impactScore = { gte: parseInt(impact_score) };
        if (start_date && end_date) {
            where.createdAt = { gte: new Date(start_date), lte: new Date(end_date) };
        }

        const signals = await prisma.marketSignal.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * parseInt(limit),
            take: parseInt(limit),
            include: { announcement: true }
        });

        res.json({ success: true, count: signals.length, data: signals });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
}

async function getSignalById(req, res) {
    try {
        const { id } = req.params;
        const signal = await prisma.marketSignal.findUnique({ where: { id }, include: { announcement: true } });
        if (!signal) return res.status(404).json({ success: false, error: 'Not Found' });
        res.json({ success: true, data: signal });
    } catch (e) {
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
}

async function getSignalsHistory(req, res) {
    // Placeholder aggregation (could be complex based on queries)
    try {
        const history = await prisma.marketSignal.groupBy({
            by: ['category'],
            _count: { id: true },
            _avg: { impactScore: true }
        });
        res.json({ success: true, data: history });
    } catch (e) {
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
}

// Alert rules
async function createAlertRule(req, res) {
    try {
        const userId = req.user?.userId || req.body.userId;
        const { categories, regions, severityThreshold, impactThreshold, keywords, deliveryMethod } = req.body;

        const rule = await prisma.enterpriseAlertRule.create({
            data: {
                userId,
                categories,
                regions,
                severityThreshold,
                impactThreshold,
                keywords,
                deliveryMethod
            }
        });
        res.json({ success: true, data: rule });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
}

async function updateAlertRule(req, res) {
    try {
        const { id } = req.params;
        const rule = await prisma.enterpriseAlertRule.update({
            where: { id },
            data: req.body
        });
        res.json({ success: true, data: rule });
    } catch (e) {
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
}

async function listAlertRules(req, res) {
    try {
        const userId = req.user?.userId;
        const rules = await prisma.enterpriseAlertRule.findMany({ where: { userId: String(userId) } });
        res.json({ success: true, data: rules });
    } catch (e) {
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
}

async function deleteAlertRule(req, res) {
    try {
        const { id } = req.params;
        await prisma.enterpriseAlertRule.delete({ where: { id } });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
}

// Metrics
async function getMetricsOverview(req, res) {
    try {
        const cacheKey = 'enterprise_metrics';
        let metrics = await getCached(cacheKey);

        if (!metrics) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const [highImpactToday, avgSeverityRaw, topRegionsRaw, activeAlerts] = await Promise.all([
                prisma.marketSignal.count({
                    where: { createdAt: { gte: today }, impactScore: { gte: 80 } }
                }),
                prisma.marketSignal.aggregate({
                    _avg: { severity: true }
                }),
                prisma.marketSignal.groupBy({
                    by: ['region'],
                    _count: { id: true },
                    orderBy: { _count: { id: 'desc' } },
                    take: 5
                }),
                prisma.enterpriseAlertRule.count()
            ]);

            metrics = {
                highImpactToday,
                avgSeverity: avgSeverityRaw._avg.severity || 0,
                topRegions: topRegionsRaw.map(r => ({ name: r.region, count: r._count.id })),
                activeAlerts
            };

            await setCached(cacheKey, metrics, 60 * 5); // 5 min cache
        }

        res.json({ success: true, data: metrics });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
}

// Exports
async function exportCsv(req, res) {
    try {
        // Simple manual csv export for now
        const signals = await prisma.marketSignal.findMany({
            take: 1000,
            orderBy: { createdAt: 'desc' }
        });
        let csv = 'id,category,region,severity,impactScore,createdAt\n';
        signals.forEach(s => {
            csv += `${s.id},${s.category},${s.region},${s.severity},${s.impactScore},${s.createdAt}\n`;
        });
        res.header('Content-Type', 'text/csv');
        res.attachment('signals.csv');
        return res.send(csv);
    } catch (e) {
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
}

async function exportJson(req, res) {
    try {
        const signals = await prisma.marketSignal.findMany({
            take: 1000,
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, data: signals });
    } catch (e) {
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
}

// Fake endpoint to simulate pushing a new announcement to test signal engine
async function triggerMockAnnouncement(req, res) {
    try {
        let announcement = await prisma.announcement.findFirst({
            include: { institution: true }
        });

        if (!announcement) {
            const profile = await prisma.institutionalProfile.findFirst();
            if (!profile) {
                return res.status(404).json({ success: false, error: 'No InstitutionalProfile in DB to create announcement for.' });
            }

            const randId = 'ANN_' + Math.random().toString(36).substr(2, 6);
            announcement = await prisma.announcement.create({
                data: {
                    id: randId,
                    institutionId: profile.id,
                    title: 'Strategic Market Movement Policy',
                    content: 'A new policy for market movements and signal generation has been issued.',
                    category: 'Markets',
                    severityLevel: 3,
                    regions: ['Global'],
                    attachments: [],
                    createdBy: profile.userId,
                    updatedAt: new Date(),
                    immutableHash: 'HASH_' + randId
                },
                include: { institution: true }
            });
        }

        // Use body values if provided, otherwise randomize
        announcement.category = req.body.category || 'Markets';
        announcement.regions = req.body.regions || ['North America', 'Europe', 'Asia-Pacific'];
        announcement.severityLevel = req.body.severity ? parseInt(req.body.severity) : (Math.floor(Math.random() * 5) + 1);
        announcement.leaderPriorityScore = req.body.leaderPriority ? parseInt(req.body.leaderPriority) : Math.floor(Math.random() * 10);

        const signal = await processNewAnnouncement(announcement);
        res.json({ success: true, data: signal });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
}

module.exports = {
    getSignals,
    getSignalById,
    getSignalsHistory,
    createAlertRule,
    updateAlertRule,
    listAlertRules,
    deleteAlertRule,
    getMetricsOverview,
    exportCsv,
    exportJson,
    triggerMockAnnouncement
};
