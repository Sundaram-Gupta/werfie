const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const websocketService = require('./websocket.service');
const redisService = require('./redis.service');

class CrisisService {
    constructor() {
        this.activeCrisesCache = new Map();
        this.cacheTTL = 15 * 1000;
    }

    normalizePagination(query = {}) {
        const page = Math.max(parseInt(query.page, 10) || 1, 1);
        const limit = Math.min(Math.max(parseInt(query.limit, 10) || 20, 1), 100);
        return { page, limit, skip: (page - 1) * limit };
    }

    async writeAudit({ action, userId, entityId, entityType, details = null, ipAddress = null }) {
        return prisma.auditLog.create({
            data: {
                adminId: userId,
                action,
                targetId: entityId || null,
                targetType: entityType || null,
                details: details ? JSON.stringify(details) : null,
                ipAddress
            }
        });
    }

    async invalidateCrisisCaches() {
        this.activeCrisesCache.clear();
        await redisService.deleteByPrefix('crisis:active:');
    }

    async createCrisis(data, userId) {
        const crisis = await prisma.crisisEvent.create({
            data: { ...data, createdBy: userId, status: data.status || 'active' }
        });
        await this.invalidateCrisisCaches();
        await this.writeAudit({
            action: 'CREATE_CRISIS',
            userId,
            entityId: crisis.id,
            entityType: 'CrisisEvent',
            details: { title: crisis.title, severity: crisis.severity }
        });
        websocketService.broadcastCrisisEvent(crisis, crisis.severity >= 4 ? 'crisis.alert' : 'crisis.created');
        return crisis;
    }

    async updateCrisis(id, data, userId) {
        const prev = await prisma.crisisEvent.findUnique({ where: { id } });
        const crisis = await prisma.crisisEvent.update({
            where: { id },
            data: { ...data, lastUpdateTime: new Date() }
        });
        await this.invalidateCrisisCaches();
        if (userId) {
            await this.writeAudit({
                action: 'UPDATE_CRISIS',
                userId,
                entityId: crisis.id,
                entityType: 'CrisisEvent',
                details: {
                    before: { status: prev?.status, severity: prev?.severity },
                    after: { status: crisis.status, severity: crisis.severity }
                }
            });
        }
        const type = crisis.status === 'resolved' ? 'crisis.resolved' : 'crisis.updated';
        websocketService.broadcastCrisisEvent(crisis, type);
        return crisis;
    }

    async deleteCrisis(id, userId) {
        const deleted = await prisma.crisisEvent.delete({ where: { id } });
        await this.invalidateCrisisCaches();
        if (userId) {
            await this.writeAudit({
                action: 'DELETE_CRISIS',
                userId,
                entityId: id,
                entityType: 'CrisisEvent',
                details: { title: deleted.title }
            });
        }
        websocketService.broadcastCrisisEvent({ id }, 'crisis.deleted');
        return deleted;
    }

    async getCrisis(id) {
        return prisma.crisisEvent.findUnique({
            where: { id },
            include: {
                updates: { orderBy: { timestamp: 'desc' } },
                streams: true
            }
        });
    }

    async listCrises(filters = {}) {
        const { region, severity, status, q } = filters;
        const where = {};
        if (region) where.region = region;
        if (severity) where.severity = parseInt(severity, 10);
        if (status) where.status = status;
        if (q) {
            where.OR = [
                { title: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
                { country: { contains: q, mode: 'insensitive' } }
            ];
        }
        if (status === 'active') {
            const key = JSON.stringify(where);
            const redisKey = `crisis:active:${Buffer.from(key).toString('base64')}`;
            const redisCached = await redisService.getJSON(redisKey);
            if (redisCached) return redisCached;
            const cached = this.activeCrisesCache.get(key);
            if (cached && Date.now() - cached.ts < this.cacheTTL) return cached.data;
            const rows = await prisma.crisisEvent.findMany({ where, orderBy: { lastUpdateTime: 'desc' } });
            this.activeCrisesCache.set(key, { ts: Date.now(), data: rows });
            await redisService.setJSON(redisKey, rows, 15);
            return rows;
        }
        return prisma.crisisEvent.findMany({ where, orderBy: { lastUpdateTime: 'desc' } });
    }

    async listCrisesAdmin(filters = {}) {
        const { page, limit, skip } = this.normalizePagination(filters);
        const where = {};
        if (filters.status) where.status = filters.status;
        if (filters.region) where.region = filters.region;
        if (filters.severity) where.severity = parseInt(filters.severity, 10);
        if (filters.q) {
            where.OR = [
                { title: { contains: filters.q, mode: 'insensitive' } },
                { description: { contains: filters.q, mode: 'insensitive' } },
                { country: { contains: filters.q, mode: 'insensitive' } }
            ];
        }
        const [rows, total] = await Promise.all([
            prisma.crisisEvent.findMany({ where, orderBy: { lastUpdateTime: 'desc' }, skip, take: limit }),
            prisma.crisisEvent.count({ where })
        ]);
        return { data: rows, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
    }

    async addUpdate(crisisId, updateText, userId, announcementId = null) {
        const update = await prisma.crisisUpdate.create({
            data: { crisisId, updateText, createdBy: userId, announcementId: announcementId || undefined }
        });
        await prisma.crisisEvent.update({ where: { id: crisisId }, data: { lastUpdateTime: new Date() } });
        await this.invalidateCrisisCaches();
        websocketService.broadcastCrisisEvent({ crisisId, update }, 'crisis.updated');
        return update;
    }

    async addStream(crisisId, streamUrl, platform, userId) {
        const stream = await prisma.crisisStream.create({
            data: { crisisId, streamUrl, platform, isLive: true }
        });
        if (userId) {
            await this.writeAudit({
                action: 'ADD_STREAM',
                userId,
                entityId: stream.id,
                entityType: 'CrisisStream',
                details: { crisisId, platform }
            });
        }
        await this.invalidateCrisisCaches();
        websocketService.broadcastCrisisEvent({ crisisId, stream }, 'crisis.stream_started');
        return stream;
    }

    async toggleStream(streamId, isLive, userId) {
        const stream = await prisma.crisisStream.update({ where: { id: streamId }, data: { isLive } });
        await this.writeAudit({
            action: isLive ? 'STREAM_STARTED' : 'STREAM_STOPPED',
            userId,
            entityId: stream.id,
            entityType: 'CrisisStream',
            details: { crisisId: stream.crisisId }
        });
        await this.invalidateCrisisCaches();
        websocketService.broadcastCrisisEvent(stream, 'crisis.stream_toggled');
        return stream;
    }

    async markResolved(id, userId) {
        const crisis = await this.updateCrisis(id, { status: 'resolved' }, userId);
        await this.writeAudit({ action: 'MARK_RESOLVED', userId, entityId: id, entityType: 'CrisisEvent' });
        return crisis;
    }

    async increaseSeverity(id, userId) {
        const existing = await prisma.crisisEvent.findUnique({ where: { id } });
        if (!existing) throw new Error('Crisis not found');
        const next = Math.min((existing.severity || 1) + 1, 5);
        const updated = await this.updateCrisis(id, { severity: next }, userId);
        await this.writeAudit({
            action: 'INCREASE_SEVERITY',
            userId,
            entityId: id,
            entityType: 'CrisisEvent',
            details: { from: existing.severity, to: next }
        });
        if (next >= 4) websocketService.broadcastCrisisEvent(updated, 'crisis.alert');
        return updated;
    }

    async linkAnnouncements(id, announcementIds, userId) {
        const crisis = await prisma.crisisEvent.update({ where: { id }, data: { linkedAnnouncementIds: announcementIds } });
        await prisma.announcement.updateMany({ where: { id: { in: announcementIds } }, data: { crisisId: id } });
        await this.invalidateCrisisCaches();
        await this.writeAudit({
            action: 'LINK_ANNOUNCEMENTS',
            userId,
            entityId: id,
            entityType: 'CrisisEvent',
            details: { announcementIds }
        });
        websocketService.broadcastCrisisEvent(crisis, 'crisis.updated');
        return crisis;
    }

    async getDashboardStats() {
        const [totalActiveCrises, highSeverityCount, activeStreams, recentAlerts] = await Promise.all([
            prisma.crisisEvent.count({ where: { status: { in: ['active', 'monitoring'] } } }),
            prisma.crisisEvent.count({ where: { severity: { gte: 4 }, status: { not: 'resolved' } } }),
            prisma.crisisStream.count({ where: { isLive: true } }),
            prisma.crisisEvent.findMany({ where: { severity: { gte: 4 } }, orderBy: { lastUpdateTime: 'desc' }, take: 10 })
        ]);
        return { totalActiveCrises, highSeverityCount, activeStreams, recentAlerts };
    }

    async listAuditLogs(query = {}) {
        const { page, limit, skip } = this.normalizePagination(query);
        const where = {};
        if (query.action) where.action = query.action;
        if (query.entityType) where.targetType = query.entityType;
        const [rows, total] = await Promise.all([
            prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
            prisma.auditLog.count({ where })
        ]);
        return {
            data: rows.map((row) => ({
                id: row.id,
                userId: row.adminId,
                action: row.action,
                entityId: row.targetId,
                entityType: row.targetType,
                timestamp: row.createdAt,
                details: row.details
            })),
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        };
    }

    async listUsers(query = {}) {
        const { page, limit, skip } = this.normalizePagination(query);
        const where = {};
        if (query.q) {
            where.OR = [
                { email: { contains: query.q, mode: 'insensitive' } },
                { profile: { is: { name: { contains: query.q, mode: 'insensitive' } } } }
            ];
        }
        const [rows, total] = await Promise.all([
            prisma.user.findMany({
                where,
                select: {
                    id: true,
                    email: true,
                    role: true,
                    status: true,
                    createdAt: true,
                    profile: { select: { name: true, handle: true } }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.user.count({ where })
        ]);
        return {
            data: rows.map((u) => ({
                id: u.id,
                email: u.email,
                role: u.role,
                status: u.status,
                createdAt: u.createdAt,
                name: u.profile?.name || null,
                handle: u.profile?.handle || null
            })),
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        };
    }

    async updateUserRole(userId, role, actorId) {
        const user = await prisma.user.update({ where: { id: userId }, data: { role } });
        await this.writeAudit({
            action: 'UPDATE_USER_ROLE',
            userId: actorId,
            entityId: user.id,
            entityType: 'User',
            details: { role }
        });
        return user;
    }

    async disableUser(userId, actorId, disabled) {
        const user = await prisma.user.update({
            where: { id: userId },
            data: { status: disabled ? 'SUSPENDED' : 'ACTIVE' }
        });
        await this.writeAudit({
            action: disabled ? 'DISABLE_USER' : 'ENABLE_USER',
            userId: actorId,
            entityId: user.id,
            entityType: 'User'
        });
        return user;
    }

    async listModerationReports(query = {}) {
        const { page, limit, skip } = this.normalizePagination(query);
        const where = {};
        if (query.status) where.status = query.status;
        const [rows, total] = await Promise.all([
            prisma.report.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
            prisma.report.count({ where })
        ]);
        return { data: rows, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
    }

    async autoLinkAnnouncement(announcement) {
        if (announcement.crisisId) {
            const crisis = await prisma.crisisEvent.findUnique({ where: { id: announcement.crisisId } });
            if (crisis) {
                const linkedIds = [...crisis.linkedAnnouncementIds, announcement.id];
                await prisma.crisisEvent.update({ where: { id: crisis.id }, data: { linkedAnnouncementIds: linkedIds } });
                await this.addUpdate(crisis.id, `New Announcement: ${announcement.title}`, announcement.createdBy, announcement.id);
            }
        }
    }
}

module.exports = new CrisisService();
