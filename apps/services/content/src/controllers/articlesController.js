const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function isMissingArticleTable(err) {
    return err?.code === 'P2021' && String(err?.meta?.table || '').includes('Article');
}

/**
 * Create a new article for the authenticated user
 */
exports.createArticle = async (req, res) => {
    const { title, content, coverImage, isPublished } = req.body;
    const userId = req.user?.userId || req.user?.id;

    if (!userId) {
        return res.status(401).json({ status: false, message: 'Unauthorized', data: null });
    }
    if (!title || !content) {
        return res.status(400).json({ status: false, message: 'Title and content are required', data: null });
    }

    try {
        const article = await prisma.article.create({
            data: {
                userId,
                title,
                content,
                coverImage,
                isPublished: !!isPublished
            }
        });
        res.json({ status: true, message: 'Article created successfully', data: article });
    } catch (err) {
        if (isMissingArticleTable(err)) {
            return res.status(503).json({
                status: false,
                message: 'Articles are temporarily unavailable while content tables are syncing',
                data: null
            });
        }
        console.error('[Articles] create error:', err);
        res.status(500).json({ status: false, message: 'Failed to create article', data: null });
    }
};

/**
 * Get all articles for a specific user
 */
exports.getArticles = async (req, res) => {
    const { userId } = req.params;
    const { publishedOnly } = req.query;

    if (!userId) {
        return res.status(400).json({ status: false, message: 'User ID is required', data: null });
    }

    try {
        const where = { userId };
        if (publishedOnly === 'true') {
            where.isPublished = true;
        }

        const articles = await prisma.article.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: { user: { include: { profile: true } } }
        });
        res.json({ status: true, message: 'Articles fetched', data: articles });
    } catch (err) {
        if (isMissingArticleTable(err)) {
            // Graceful fallback for environments where Article table is not yet migrated.
            return res.json({ status: true, message: 'Articles fetched', data: [] });
        }
        console.error('[Articles] get all error:', err);
        res.status(500).json({ status: false, message: 'Failed to fetch articles', data: null });
    }
};

/**
 * Get a single article by ID
 */
exports.getArticle = async (req, res) => {
    const { id } = req.params;

    try {
        const article = await prisma.article.findUnique({
            where: { id },
            include: { user: { include: { profile: true } } }
        });

        if (!article) {
            return res.status(404).json({ status: false, message: 'Article not found', data: null });
        }
        res.json({ status: true, message: 'Article fetched', data: article });
    } catch (err) {
        if (isMissingArticleTable(err)) {
            // Return 200 + null so preview UI doesn't crash on environments missing this table.
            return res.json({ status: false, message: 'Article not found', data: null });
        }
        console.error('[Articles] get one error:', err);
        res.status(500).json({ status: false, message: 'Failed to fetch article', data: null });
    }
};

/**
 * Update an existing article
 */
exports.updateArticle = async (req, res) => {
    const { id } = req.params;
    const { title, content, coverImage, isPublished } = req.body;
    const userId = req.user?.userId || req.user?.id;

    if (!userId) {
        return res.status(401).json({ status: false, message: 'Unauthorized', data: null });
    }

    try {
        const article = await prisma.article.findUnique({ where: { id } });
        if (!article) {
            return res.status(404).json({ status: false, message: 'Article not found', data: null });
        }
        if (article.userId !== userId) {
            return res.status(403).json({ status: false, message: 'Forbidden', data: null });
        }

        const updated = await prisma.article.update({
            where: { id },
            data: {
                title: title !== undefined ? title : article.title,
                content: content !== undefined ? content : article.content,
                coverImage: coverImage !== undefined ? coverImage : article.coverImage,
                isPublished: isPublished !== undefined ? !!isPublished : article.isPublished
            }
        });
        res.json({ status: true, message: 'Article updated', data: updated });
    } catch (err) {
        if (isMissingArticleTable(err)) {
            return res.status(503).json({
                status: false,
                message: 'Articles are temporarily unavailable while content tables are syncing',
                data: null
            });
        }
        console.error('[Articles] update error:', err);
        res.status(500).json({ status: false, message: 'Failed to update article', data: null });
    }
};

/**
 * Delete an article
 */
exports.deleteArticle = async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.userId || req.user?.id;

    if (!userId) {
        return res.status(401).json({ status: false, message: 'Unauthorized', data: null });
    }

    try {
        const article = await prisma.article.findUnique({ where: { id } });
        if (!article) {
            return res.status(404).json({ status: false, message: 'Article not found', data: null });
        }
        if (article.userId !== userId) {
            return res.status(403).json({ status: false, message: 'Forbidden', data: null });
        }

        await prisma.article.delete({ where: { id } });
        res.json({ status: true, message: 'Article deleted', data: null });
    } catch (err) {
        if (isMissingArticleTable(err)) {
            return res.status(503).json({
                status: false,
                message: 'Articles are temporarily unavailable while content tables are syncing',
                data: null
            });
        }
        console.error('[Articles] delete error:', err);
        res.status(500).json({ status: false, message: 'Failed to delete article', data: null });
    }
};
