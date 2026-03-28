const { PrismaClient } = require('@prisma/client');
const { broadcastEvent } = require('../websocket');
const { alertQueue } = require('./enterpriseQueue');
const { redisClient } = require('./enterpriseCache');

const prisma = new PrismaClient();

// Calculate impact score based on conditions
function computeImpactScore({ severity, leaderPriority, category, historicalMarketReaction, keywordIntensity }) {
    const categoryWeights = {
        'Markets': 30,
        'Economy': 25,
        'Conflict': 20,
        'Health': 15
    };
    
    let baseScore = (severity * 20) + (leaderPriority * 15);
    const catWeight = categoryWeights[category] || 10;
    
    // Normalize to 0-100
    let impactScore = baseScore + catWeight + historicalMarketReaction + keywordIntensity;
    return Math.min(100, Math.max(0, impactScore));
}

async function processNewAnnouncement(announcement) {
    // 1. Extract values
    const severity = announcement.severityLevel || 1;
    const leaderPriority = announcement.leaderPriorityScore || 0;
    const category = announcement.category || 'General';
    const region = announcement.regions && announcement.regions.length > 0 ? announcement.regions[0] : 'Global';

    // Placeholder values for ML-based inputs
    const historicalMarketReaction = Math.floor(Math.random() * 10);
    const keywordIntensity = Math.floor(Math.random() * 10);

    const impactScore = computeImpactScore({
        severity,
        leaderPriority,
        category,
        historicalMarketReaction,
        keywordIntensity
    });

    // 2. Create Signal
    const signal = await prisma.marketSignal.create({
        data: {
            announcementId: announcement.id,
            institutionId: announcement.institutionId,
            category,
            region,
            severity,
            impactScore,
            confidenceScore: 0.9 + (Math.random() * 0.1),
            detectedKeywords: {},
            volatilityIndex: Math.random() * 5
        }
    });

    // Cache invalidate metrics
    await redisClient.del('enterprise_metrics');

    // Emit event
    broadcastEvent('NEW_SIGNAL', {
        signal_id: signal.id,
        category: signal.category,
        region: signal.region,
        impact_score: signal.impactScore,
        timestamp: signal.createdAt
    });

    if (signal.impactScore > 80) {
        broadcastEvent('HIGH_IMPACT', {
            signal_id: signal.id,
            category: signal.category,
            region: signal.region,
            impact_score: signal.impactScore,
            timestamp: signal.createdAt
        });
    }

    // Process alerts
    await matchAlertRules(signal);

    return signal;
}

async function matchAlertRules(signal) {
    const activeRules = await prisma.enterpriseAlertRule.findMany({
        where: {
            severityThreshold: { lte: signal.severity },
            impactThreshold: { lte: signal.impactScore }
        }
    });

    // Additional JS-level matching
    for (const rule of activeRules) {
        // Match category
        if (rule.categories && Array.isArray(rule.categories) && rule.categories.length > 0) {
            if (!rule.categories.includes(signal.category)) continue;
        }

        // Match region
        if (rule.regions && Array.isArray(rule.regions) && rule.regions.length > 0) {
            if (!rule.regions.includes(signal.region)) continue;
        }

        // Add to queue
        await alertQueue.add('processAlert', {
            ruleId: rule.id,
            signalId: signal.id,
            rule,
            signal
        });

        broadcastEvent('ALERT_TRIGGERED', {
            rule_id: rule.id,
            signal_id: signal.id,
            user_id: rule.userId,
            delivery_method: rule.deliveryMethod
        });
    }
}

module.exports = {
    computeImpactScore,
    processNewAnnouncement
};
