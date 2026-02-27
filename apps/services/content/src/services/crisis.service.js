const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const websocketService = require('./websocket.service');

class CrisisService {
    async createCrisis(data, userId) {
        const crisis = await prisma.crisisEvent.create({
            data: {
                ...data,
                createdBy: userId,
                status: 'active'
            }
        });

        // 🧠 Business Logic for Severity >= 4
        if (crisis.severity >= 4) {
            // Trigger crisis alert broadcast
            websocketService.broadcastCrisisEvent(crisis, 'crisis.alert');
        } else {
            websocketService.broadcastCrisisEvent(crisis, 'crisis.created');
        }

        return crisis;
    }

    async updateCrisis(id, data, userId) {
        const crisis = await prisma.crisisEvent.update({
            where: { id },
            data: {
                ...data,
                lastUpdateTime: new Date()
            }
        });

        const type = crisis.status === 'resolved' ? 'crisis.resolved' : 'crisis.updated';
        websocketService.broadcastCrisisEvent(crisis, type);

        return crisis;
    }

    async deleteCrisis(id) {
        return prisma.crisisEvent.delete({ where: { id } });
    }

    async getCrisis(id) {
        return prisma.crisisEvent.findUnique({
            where: { id },
            include: {
                updates: { orderBy: { timestamp: 'desc' } },
                streams: { where: { isLive: true } }
            }
        });
    }

    async listCrises(filters = {}) {
        const { region, severity, status } = filters;
        const where = {};
        if (region) where.region = region;
        if (severity) where.severity = parseInt(severity);
        if (status) where.status = status;

        return prisma.crisisEvent.findMany({
            where,
            orderBy: { lastUpdateTime: 'desc' }
        });
    }

    async addUpdate(crisisId, updateText, userId, announcementId = null) {
        const update = await prisma.crisisUpdate.create({
            data: {
                crisisId,
                updateText,
                createdBy: userId,
                announcementId: announcementId || undefined
            }
        });

        // Update crisis lastUpdateTime
        await prisma.crisisEvent.update({
            where: { id: crisisId },
            data: { lastUpdateTime: new Date() }
        });

        websocketService.broadcastCrisisEvent({ crisisId, update }, 'crisis.updated'); // Broadcast update to crisis
        return update;
    }

    async addStream(crisisId, streamUrl, platform) {
        const stream = await prisma.crisisStream.create({
            data: {
                crisisId,
                streamUrl,
                platform,
                isLive: true
            }
        });

        websocketService.broadcastCrisisEvent({ crisisId, stream }, 'crisis.stream_started');
        return stream;
    }

    async autoLinkAnnouncement(announcement) {
        // Trigger logic: When a linked announcement is published, attach it to crisis timeline.
        // This expects the announcement object to have relevant tags or explicit crisisId.
        // For simplicity, if announcement has a metadata field 'crisisId':
        if (announcement.crisisId) {
            const crisis = await prisma.crisisEvent.findUnique({ where: { id: announcement.crisisId } });
            if (crisis) {
                const linkedIds = [...crisis.linkedAnnouncementIds, announcement.id];
                await prisma.crisisEvent.update({
                    where: { id: crisis.id },
                    data: { linkedAnnouncementIds: linkedIds }
                });

                // Also add a crisis update automatically
                await this.addUpdate(crisis.id, `New Announcement: ${announcement.title}`, announcement.createdBy, announcement.id);
            }
        }
    }
}

module.exports = new CrisisService();
