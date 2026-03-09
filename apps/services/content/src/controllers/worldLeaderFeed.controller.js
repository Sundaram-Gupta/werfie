const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const AnnouncementService = require('../services/announcement.service');

exports.getWorldLeadersFeed = async (req, res) => {
    try {
        const { region, country, category, severity, limit = 20, page = 1 } = req.query;

        let where = {
            isWorldLeaderPost: true,
            status: 'published'
        };

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
