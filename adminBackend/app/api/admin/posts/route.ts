import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const filter = searchParams.get('filter') || 'all';
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
        const skip = (page - 1) * limit;

        let posts: any[];
        let totalPosts: number;

        if (filter === 'reported') {
            // Get post IDs that have at least one report
            const reportedRows = await prisma.report.findMany({
                where: { targetType: 'post' },
                select: { targetId: true },
                distinct: ['targetId']
            });
            const reportedPostIds = reportedRows.map(r => r.targetId);
            totalPosts = reportedPostIds.length;

            if (reportedPostIds.length === 0) {
                posts = [];
            } else {
                try {
                    posts = await prisma.post.findMany({
                        where: { id: { in: reportedPostIds } },
                        include: {
                            user: {
                                include: { profile: true }
                            }
                        },
                        orderBy: { createdAt: 'desc' },
                        skip,
                        take: limit,
                    });
                } catch (profileErr: any) {
                    if (profileErr?.code === 'P2022') {
                        posts = await prisma.post.findMany({
                            where: { id: { in: reportedPostIds } },
                            include: { user: true },
                            orderBy: { createdAt: 'desc' },
                            skip,
                            take: limit,
                        });
                        posts = posts.map((p: any) => ({ ...p, user: { ...p.user, profile: null } }));
                    } else {
                        throw profileErr;
                    }
                }
            }
        } else {
            [posts, totalPosts] = await Promise.all([
                (async () => {
                    try {
                        return prisma.post.findMany({
                            include: {
                                user: {
                                    include: { profile: true }
                                }
                            },
                            orderBy: { createdAt: 'desc' },
                            skip,
                            take: limit,
                        });
                    } catch (profileErr: any) {
                        if (profileErr?.code === 'P2022') {
                            const p = await prisma.post.findMany({
                                include: { user: true },
                                orderBy: { createdAt: 'desc' },
                                skip,
                                take: limit,
                            });
                            return p.map((u: any) => ({ ...u, user: { ...u.user, profile: null } }));
                        }
                        throw profileErr;
                    }
                })(),
                prisma.post.count()
            ]);
        }

        // Fetch real report counts for this page
        const postIds = posts.map((p: any) => p.id);
        let reportCounts: { targetId: string; _count: { id: number } }[] = [];
        try {
            if (postIds.length > 0 && postIds.length <= 30000) {
                const grouped = await prisma.report.groupBy({
                    by: ['targetId'],
                    where: {
                        targetId: { in: postIds },
                        targetType: 'post'
                    },
                    _count: { id: true }
                });
                reportCounts = grouped as { targetId: string; _count: { id: number } }[];
            }
        } catch (err: any) {
            console.error('Fetch Posts - reportCounts error:', err?.message || err);
            if (err?.code !== 'P2035') throw err;
        }

        const reportMap = reportCounts.reduce((acc: any, curr: any) => {
            acc[curr.targetId] = curr._count.id;
            return acc;
        }, {});

        const mappedPosts = posts.map(post => {
            let image = null;
            if (post.mediaUrls) {
                try {
                    const parsed = JSON.parse(post.mediaUrls);
                    if (Array.isArray(parsed)) image = parsed[0];
                } catch {
                    image = post.mediaUrls;
                }
            }
            return {
                id: post.id,
                user: post.user?.profile?.name || post.user?.email?.split?.('@')[0] || 'Unknown',
                handle: `@${post.user?.profile?.handle || post.user?.id?.slice?.(0, 8) || 'unknown'}`,
                content: post.content,
                date: post.createdAt.toISOString().split('T')[0],
                image,
                reportCount: reportMap[post.id] || 0,
                status: 'active'
            };
        });

        const totalPages = Math.ceil(totalPosts / limit);

        return apiSuccess({
            posts: mappedPosts,
            pagination: {
                totalPosts,
                currentPage: page,
                totalPages,
                limit
            }
        }, 'Posts fetched successfully');

    } catch (error: any) {
        console.error('Fetch Posts Error:', error);
        if (error?.code === 'P2021') {
            return apiSuccess({
                posts: [],
                pagination: { totalPosts: 0, currentPage: 1, totalPages: 0, limit: 20 }
            }, 'Posts (tables not migrated)');
        }
        return apiError('Failed to fetch posts: ' + (error?.message || 'Unknown error'), 500);
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const postId = url.searchParams.get('id');

        if (!postId) {
            return apiError('Post ID is required', 400);
        }

        await prisma.post.delete({
            where: { id: postId }
        });

        return apiSuccess(null, 'Post deleted successfully');
    } catch (error) {
        return apiError('Failed to delete post', 500);
    }
}
