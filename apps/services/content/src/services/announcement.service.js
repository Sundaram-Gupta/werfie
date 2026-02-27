const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const axios = require('axios');
const websocketService = require('./websocket.service');
const enterpriseService = require('./enterprise.service');
const crisisService = require('./crisis.service');

const prisma = new PrismaClient();

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005';

class AnnouncementService {
    /**
     * Generate an immutable hash for the announcement content.
     */
    static generateHash(data) {
        const payload = `${data.title}|${data.content}|${data.institutionId}|${data.effectiveDate}`;
        return crypto.createHash('sha256').update(payload).digest('hex');
    }

    /**
     * Generate an AI summary for the announcement.
     * Mock implementation simulating an AI service.
     */
    static async generateAISummary(content) {
        // Simulating AI processing delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Mock logic: extracts first few sentences and formats as bullets
        const lines = content.split(/[.!?]/).filter(s => s.trim().length > 10).slice(0, 5);
        if (lines.length === 0) return "Executive Summary: No substantial content provided for summarization.";

        return lines.map(l => `• ${l.trim()}`).join('\n');
    }

    /**
     * Create a new announcement.
     */
    static async createAnnouncement(data, userId) {
        let institutionId = data.institutionId;

        // Auto-resolve institutionId if missing but userId is provided
        if (!institutionId && userId) {
            console.log('[AnnouncementService] institutionId missing, attempting to resolve from userId:', userId);
            const userProfile = await prisma.$queryRawUnsafe(
                'SELECT id FROM "InstitutionalProfile" WHERE "userId" = $1 LIMIT 1',
                userId
            );
            if (userProfile && userProfile[0]) {
                institutionId = userProfile[0].id;
                console.log('[AnnouncementService] Resolved institutionId:', institutionId);
            } else {
                // Fallback to userId if no institutional profile exists (for compatibility)
                institutionId = userId;
                console.log('[AnnouncementService] No InstitutionalProfile found, falling back to userId');
            }
        }

        if (!institutionId) {
            throw new Error('Argument institutionId is missing and could not be resolved');
        }

        const enrichedData = { ...data, institutionId };
        const hash = this.generateHash(enrichedData);

        // Resolve leader priority score if World Leader Post
        let priorityScore = data.leaderPriorityScore || 0;
        let leader = null;
        if (data.isWorldLeaderPost && data.leaderId) {
            try {
                // Fetch leader rank directly to enforce backend logic
                const reqLeader = await axios.get(`${USER_SERVICE_URL}/api/users/leaders/${data.leaderId}`);
                if (reqLeader.data) {
                    leader = reqLeader.data;
                    const rank = leader.priorityRank || 0;
                    const severity = parseInt(data.severityLevel) || 1;
                    priorityScore = (rank * 3) + (severity * 5); // Add recency weight in actual sort queue
                    console.log(`[AnnouncementService] Assigned Dynamic Priority Score: ${priorityScore} (Rank ${rank}, Severity ${severity})`);
                }
            } catch (err) {
                console.error('[AnnouncementService] Failed to dynamically calculate priority score. Using default/provided.', err.message);
            }
        }

        const announcement = await prisma.announcement.create({
            data: {
                institutionId,
                title: data.title,
                content: data.content,
                category: data.category,
                severityLevel: parseInt(data.severityLevel) || 1,
                regions: data.regions || [],
                attachments: data.attachments || [],
                livestreamUrl: data.livestreamUrl,
                effectiveDate: data.effectiveDate ? new Date(data.effectiveDate) : new Date(),
                expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
                lockDurationMinutes: parseInt(data.lockDurationMinutes) || 0,
                immutableHash: hash,
                status: data.status || 'draft',
                createdBy: userId,
                aiSummary: data.status === 'published' ? await this.generateAISummary(data.content) : null,

                // World Leaders fields
                isWorldLeaderPost: data.isWorldLeaderPost || false,
                leaderId: data.leaderId || null,
                leaderPriorityScore: priorityScore,
                isLive: data.isLive || false,
                transcriptUrl: data.transcriptUrl || null,
                speechVideoUrl: data.speechVideoUrl || null,
                importanceScore: data.importanceScore ? parseFloat(data.importanceScore) : null,
                crisisId: data.crisisId || null
            }
        });

        // Version 1 revision
        if (announcement.status === 'published') {
            await prisma.announcementRevision.create({
                data: {
                    announcementId: announcement.id,
                    version: 1,
                    editedBy: userId,
                    changes: { action: 'initial_publish', data: announcement },
                    timestamp: new Date()
                }
            });

            // Trigger Enterprise Signal Generation (Async)
            enterpriseService.generateSignalFromAnnouncement(announcement)
                .catch(err => console.error('[Enterprise] Failed to gen signal:', err));

            // Auto-link to Crisis Timeline if applicable
            crisisService.autoLinkAnnouncement(announcement)
                .catch(err => console.error('[Crisis] Failed to auto-link:', err));
        }

        // World Leaders specific side effects (Notifications, WebSockets, Translations)
        if (announcement.isWorldLeaderPost && announcement.status === 'published') {

            // 1. Broadcasts
            websocketService.broadcastNewPost(announcement);
            if (announcement.isLive) {
                websocketService.broadcastLiveStatus(announcement);
            }

            // 2. Queue Multi-Lingual Translations (English, Spanish, French, Arabic, Hindi)
            const languages = ['en', 'es', 'fr', 'ar', 'hi'];
            const translations = languages.map(lang => ({
                announcementId: announcement.id,
                languageCode: lang,
                title: announcement.title,
                content: announcement.content,
                status: 'pending' // Actual async worker would process these
            }));
            await prisma.announcementTranslation.createMany({ data: translations });

            // 3. Trigger High Priority Push Notification
            if (leader) {
                const severityLevel = announcement.severityLevel;
                if (severityLevel >= 4 || leader.autoPushEnabled || announcement.isLive) {
                    try {
                        await axios.post(`${NOTIFICATION_SERVICE_URL}/api/notifications/broadcast-external`, {
                            target: { regions: announcement.regions, roles: ['USER'] }, // Push globally or region
                            payload: {
                                title: `Official Update: ${leader.leaderName}`,
                                body: announcement.title,
                                metadata: {
                                    type: 'world_leader',
                                    isLive: announcement.isLive,
                                    severity: severityLevel,
                                    country: leader.country
                                }
                            }
                        });
                        console.log(`[AnnouncementService] Initiated global Push Notification for ${leader.leaderName}`);
                    } catch (pushErr) {
                        console.error('[AnnouncementService] Failed to initiate Push Notification', pushErr.message);
                    }
                }
            }
        }

        return announcement;
    }

    /**
     * Update an announcement and create a new revision.
     */
    static async updateAnnouncement(id, data, userId) {
        const current = await prisma.announcement.findUnique({
            where: { id },
            include: { revisions: { orderBy: { version: 'desc' }, take: 1 } }
        });

        if (!current) throw new Error('Announcement not found');

        const nextVersion = (current.revisions[0]?.version || 0) + 1;
        const changes = {};

        // Track changes
        const fieldsToTrack = ['title', 'content', 'category', 'severityLevel', 'regions', 'status', 'isWorldLeaderPost', 'leaderPriorityScore', 'isLive', 'transcriptUrl', 'speechVideoUrl'];
        fieldsToTrack.forEach(field => {
            if (data[field] !== undefined && JSON.stringify(data[field]) !== JSON.stringify(current[field])) {
                changes[field] = { from: current[field], to: data[field] };
            }
        });

        const updateData = { ...data };
        if (data.status === 'published' && !current.aiSummary) {
            updateData.aiSummary = await this.generateAISummary(data.content || current.content);
        }

        const updated = await prisma.announcement.update({
            where: { id },
            data: updateData
        });

        if (Object.keys(changes).length > 0) {
            await prisma.announcementRevision.create({
                data: {
                    announcementId: id,
                    version: nextVersion,
                    editedBy: userId,
                    changes,
                    timestamp: new Date()
                }
            });
        }

        if (updated.isWorldLeaderPost && updated.status === 'published') {
            if (updated.isLive && (!current.isLive || current.status !== 'published')) {
                websocketService.broadcastLiveStatus(updated);
            }

            // Auto-link to Crisis Timeline if just published
            if (current.status !== 'published') {
                crisisService.autoLinkAnnouncement(updated)
                    .catch(err => console.error('[Crisis] Failed to auto-link:', err));
            }
        }

        return updated;
    }

    /**
     * Fetch feed with filters.
     */
    static async getFeed(filters = {}) {
        const { category, severity, region, status = 'published' } = filters;
        const where = { status };

        if (category) where.category = category;
        if (severity) where.severityLevel = { gte: parseInt(severity) };
        if (region) {
            where.regions = {
                path: [],
                array_contains: region
            };
        }

        return await prisma.announcement.findMany({
            where,
            orderBy: [
                { severityLevel: 'desc' },
                { createdAt: 'desc' }
            ],
            include: {
                revisions: {
                    orderBy: { timestamp: 'desc' },
                    take: 5
                }
            }
        });
    }
}

module.exports = AnnouncementService;
