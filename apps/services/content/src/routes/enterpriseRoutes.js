const express = require('express');
const router = express.Router();
const enterpriseService = require('../services/enterprise.service');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get Dashboard Metrics
router.get('/metrics/overview', async (req, res) => {
    try {
        const metrics = await enterpriseService.getDashboardMetrics();
        res.json(metrics);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// List all Market Signals
router.get('/signals', async (req, res) => {
    try {
        const signals = await prisma.marketSignal.findMany({
            orderBy: { createdAt: 'desc' },
            take: 100, // Limiting for dashboard demo
            include: {
                announcement: {
                    select: { title: true, institutionId: true, isWorldLeaderPost: true }
                }
            }
        });
        res.json({ signals });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Configure a new Alert Rule
router.post('/alerts/create', async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        if (!userId) return res.status(401).json({ error: 'Unauthorized: authentication required' });

        const { categories, regions, severityThreshold, impactThreshold, keywords, deliveryMethod } = req.body;

        const rule = await prisma.enterpriseAlertRule.create({
            data: {
                userId,
                categories: categories || [],
                regions: regions || [],
                severityThreshold: severityThreshold || 0,
                impactThreshold: impactThreshold || 50,
                keywords: keywords || [],
                deliveryMethod: deliveryMethod || 'web'
            }
        });

        res.json({ message: 'Alert rule configured successfully', rule });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// List Rules for the current User
router.get('/alerts/list', async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        if (!userId) return res.status(401).json({ error: 'Unauthorized: authentication required' });

        const rules = await prisma.enterpriseAlertRule.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ rules });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Mock CSV Export Generation (In reality uses fast-csv or similar stream processing)
router.get('/export/csv', async (req, res) => {
    try {
        const signals = await prisma.marketSignal.findMany({ take: 50, orderBy: { createdAt: 'desc' } });
        let csv = "ID,Announcement ID,Institution ID,Category,Region,Severity,Impact Score,Volatility Index,Confidence,Created At\n";

        signals.forEach(s => {
            csv += `"${s.id}","${s.announcementId}","${s.institutionId}","${s.category}","${s.region}","${s.severity}","${s.impactScore}","${s.volatilityIndex || ''}","${s.confidenceScore}","${s.createdAt}"\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="market_signals.csv"');
        res.send(csv);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// JSON Export Generation
router.get('/export/json', async (req, res) => {
    try {
        const signals = await prisma.marketSignal.findMany({ take: 50, orderBy: { createdAt: 'desc' } });
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename="market_signals.json"');
        res.send(JSON.stringify(signals, null, 2));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
