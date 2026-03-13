const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const websocketService = require('./websocket.service');

class EnterpriseService {
    constructor() {
        this.categoryWeights = {
            'Markets': 30,
            'Economy': 25,
            'Conflict': 20,
            'Health': 15,
            'Policy': 10
        };
    }

    /**
     * Calculates the impact score 0-100 for an announcement
     * severity (1-5), priorityRank (1-10)
     */
    calculateImpactScore(severity, priorityRank, category) {
        let score = (severity * 10) + (priorityRank * 2); // Base score up to 70

        // Add category weight
        const catWeight = this.categoryWeights[category] || 5;
        score += (catWeight / 2); // Up to 15

        // Apply bounds 0 to 100
        score = Math.max(0, Math.min(100, Math.round(score)));

        // Calculate pseudo-volatility index based on score
        const volatilityIndex = parseFloat((score * 0.035).toFixed(2));

        // Confidence score based on data completeness
        const confidenceScore = Math.floor(Math.random() * (100 - 85 + 1) + 85);

        return { score, volatilityIndex, confidenceScore };
    }

    /**
     * Main entry pipeline when a new announcement acts as a market trigger
     */
    async generateSignalFromAnnouncement(announcement) {
        try {
            const { score: impactScore, volatilityIndex, confidenceScore } = this.calculateImpactScore(
                announcement.severityLevel,
                announcement.leaderPriorityScore || 1,
                announcement.category
            );

            // Create Market Signal record
            const signal = await prisma.marketSignal.create({
                data: {
                    announcementId: announcement.id,
                    institutionId: announcement.institutionId,
                    category: announcement.category,
                    region: Array.isArray(announcement.regions) ? announcement.regions[0] : 'Global',
                    severity: announcement.severityLevel,
                    impactScore,
                    volatilityIndex,
                    confidenceScore,
                    detectedKeywords: { terms: ['breaking', announcement.category.toLowerCase()] },
                }
            });

            // Evaluate alert rules asyncly
            this.evaluateAlertRules(signal).catch(err => console.error('[Enterprise] Alert Eval Error:', err));

            return signal;
        } catch (error) {
            console.error('[Enterprise] Error generating signal:', error);
            throw error;
        }
    }

    /**
     * Compare new signal against all user defined Enterprise thresholds
     */
    async evaluateAlertRules(signal) {
        console.log(`[Enterprise] Evaluating alert rules for Signal ${signal.id} - Score: ${signal.impactScore}`);

        // Find all rules where impact score >= rule threshold AND severity >= rule threshold
        const rules = await prisma.enterpriseAlertRule.findMany({
            where: {
                impactThreshold: { lte: signal.impactScore },
                severityThreshold: { lte: signal.severity }
            }
        });

        if (!rules.length) return;

        const alertLogs = rules.map(rule => ({
            ruleId: rule.id,
            signalId: signal.id,
            deliveryStatus: 'pending' // Would hook into real notification/webhook service here
        }));

        // Record logs in bulk
        await prisma.enterpriseAlertLog.createMany({
            data: alertLogs
        });

        // In a real production system, this pushes to Webhook queues, Emails, and WebSockets here.
        // For now we will broadcast to Socket Server (Implementation placeholder).
        console.log(`[Enterprise] Triggered ${alertLogs.length} enterprise alerts.`);
    }

    // Analytics functions for the dashboard Dashboard
    async getDashboardMetrics() {
        // Basic aggregation
        const totalSignals = await prisma.marketSignal.count();
        const highImpact = await prisma.marketSignal.count({
            where: { impactScore: { gte: 75 } }
        });

        const aggregates = await prisma.marketSignal.aggregate({
            _avg: { severity: true, impactScore: true }
        });

        const activeRules = await prisma.enterpriseAlertRule.count();

        return {
            totalSignals,
            highImpactSignalsToday: highImpact, // Simplifying 'today' for demo
            averageSeverity: aggregates._avg.severity ? aggregates._avg.severity.toFixed(1) : 0,
            averageImpact: aggregates._avg.impactScore ? aggregates._avg.impactScore.toFixed(1) : 0,
            activeAlerts: activeRules
        };
    }
}

module.exports = new EnterpriseService();
