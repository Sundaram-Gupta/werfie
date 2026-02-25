const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

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
                aiSummary: data.status === 'published' ? await this.generateAISummary(data.content) : null
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
        const fieldsToTrack = ['title', 'content', 'category', 'severityLevel', 'regions', 'status'];
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
