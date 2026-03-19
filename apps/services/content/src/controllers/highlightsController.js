const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Toggle a post as a highlight for the authenticated user
 * Adds if not exists, removes if already highlighted
 */
exports.toggleHighlight = async (req, res) => {
    const { postId } = req.body;
    const userId = req.user?.userId || req.user?.id;

    if (!userId) {
        return res.status(401).json({ status: false, message: 'Unauthorized', data: null });
    }
    if (!postId) {
        return res.status(400).json({ status: false, message: 'Post ID is required', data: null });
    }

    try {
        const existing = await prisma.highlight.findUnique({
            where: { userId_postId: { userId, postId } }
        });

        if (existing) {
            await prisma.highlight.delete({
                where: { id: existing.id }
            });
            return res.json({ status: true, message: 'Removed from highlights', data: { highlighted: false } });
        } else {
            // Check if post exists and belongs to user
            const post = await prisma.post.findUnique({ where: { id: postId } });
            if (!post) {
                return res.status(404).json({ status: false, message: 'Post not found', data: null });
            }
            if (post.userId !== userId) {
                return res.status(403).json({ status: false, message: 'You can only highlight your own posts', data: null });
            }

            // Get max order index
            const maxOrder = await prisma.highlight.aggregate({
                where: { userId },
                _max: { orderIndex: true }
            });
            const nextOrder = (maxOrder._max.orderIndex || 0) + 1;

            await prisma.highlight.create({
                data: {
                    userId,
                    postId,
                    orderIndex: nextOrder
                }
            });
            return res.json({ status: true, message: 'Added to highlights', data: { highlighted: true } });
        }
    } catch (err) {
        console.error('[Highlights] toggle error:', err);
        res.status(500).json({ status: false, message: 'Failed to toggle highlight', data: null });
    }
};

/**
 * Get all highlights for a specific user
 */
exports.getHighlights = async (req, res) => {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 20;

    if (!userId) {
        return res.status(400).json({ status: false, message: 'User ID is required', data: null });
    }

    try {
        const highlights = await prisma.highlight.findMany({
            where: { userId },
            orderBy: { orderIndex: 'desc' }, // Show newest highlights first by default
            take: Math.min(limit, 100),
            include: {
                post: {
                    include: {
                        user: { include: { profile: true } },
                        media: true,
                        highlightedIn: { where: { userId }, select: { id: true } },
                        _count: { select: { likes: true, retweets: true, replies: true } }
                    }
                }
            }
        });

        const posts = highlights.map(h => h.post).filter(Boolean);
        res.json({ status: true, message: 'Highlights fetched', data: { posts } });
    } catch (err) {
        console.error('[Highlights] get error:', err);
        res.status(500).json({ status: false, message: 'Failed to fetch highlights', data: null });
    }
};
