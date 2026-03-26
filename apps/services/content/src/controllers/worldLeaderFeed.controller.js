const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const AnnouncementService = require('../services/announcement.service');
const axios = require('axios');

exports.getWorldLeadersFeed = async (req, res) => {
    try {
        const { region, country, category, severity, limit = 20, page = 1 } = req.query;

        let where = {
            isWorldLeaderPost: true,
            status: 'published'
        };

        // Note: we still keep announcement region filtering (if provided),
        // but we also enforce approved-only via leaderId list from user service.
        if (region) {
            where.regions = {
                path: [],
                array_contains: region
            };
        }
        if (category) where.category = category;
        if (severity) where.severityLevel = { gte: parseInt(severity) };

        // For country (since it's not strictly on announcement, we might just rely on region or leader filters in User Service later,
        // but for now we filter what's available directly on the announcement model)

        const take = parseInt(limit);
        const skip = (parseInt(page) - 1) * take;

        // Approved-only filter:
        // Fetch verified leaders from user service and restrict announcements by leaderId.
        const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';
        let verifiedLeaderIds = [];
        try {
            const leadersRes = await axios.get(`${USER_SERVICE_URL}/api/leaders`, {
                params: { verifiedStatus: 'true', limit: 100 }
            });
            const leadersPayload = leadersRes.data?.data ?? leadersRes.data ?? [];
            verifiedLeaderIds = Array.isArray(leadersPayload) ? leadersPayload.map(l => l.id).filter(Boolean) : [];
        } catch (e) {
            console.error('[WorldLeadersFeed] Failed to fetch verified leaders:', e?.message || e);
            return res.status(200).json([]);
        }

        if (verifiedLeaderIds.length === 0) return res.status(200).json([]);
        where.leaderId = { in: verifiedLeaderIds };

        let posts;
        try {
            posts = await prisma.announcement.findMany({
                where,
                orderBy: [
                    { leaderPriorityScore: 'desc' },
                    { severityLevel: 'desc' },
                    { createdAt: 'desc' }
                ],
                take,
                skip,
                include: { revisions: { take: 1, orderBy: { version: 'desc' } } }
            });
        } catch (err) {
            if (err.message && err.message.includes('crisisId')) {
                posts = await prisma.$queryRawUnsafe(
                    `SELECT * FROM "Announcement" WHERE "isWorldLeaderPost" = true AND status = 'published'
                     ORDER BY "leaderPriorityScore" DESC, "severityLevel" DESC, "createdAt" DESC LIMIT $1 OFFSET $2`,
                    take,
                    skip
                );
                posts = Array.isArray(posts) ? posts : [];
            } else {
                throw err;
            }
        }
        res.status(200).json(posts);
    } catch (error) {
        console.error('World Leaders Feed Error:', error);
        res.status(200).json([]);
    }
};

exports.getLeaderPosts = async (req, res) => {
    try {
        const { id } = req.params;
        const { limit = 20, page = 1 } = req.query;

        const take = parseInt(limit);
        const skip = (parseInt(page) - 1) * take;

        // Approved-only: ensure leader is verified in user service.
        const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';
        try {
            const leaderRes = await axios.get(`${USER_SERVICE_URL}/api/leaders/${id}`, { timeout: 5000 });
            const leaderPayload = leaderRes.data?.data ?? leaderRes.data;
            if (!leaderPayload?.verifiedStatus) return res.status(200).json([]);
        } catch (e) {
            // Fail closed: if we can't verify status, don't show posts.
            console.error('[WorldLeadersFeed] Failed to verify leader status:', e?.message || e);
            return res.status(200).json([]);
        }

        const posts = await prisma.announcement.findMany({
            where: {
                leaderId: id,
                status: 'published'
            },
            orderBy: { createdAt: 'desc' },
            take,
            skip
        });

        res.status(200).json(posts);
    } catch (error) {
        console.error('Get Leader Posts Error:', error);
        res.status(500).json({ error: 'Failed to fetch leader posts' });
    }
};
