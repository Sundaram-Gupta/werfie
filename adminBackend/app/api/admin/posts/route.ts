import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const filter = searchParams.get('filter') || 'all';
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const skip = (page - 1) * limit;

        const whereClause: any = {};
        if (filter === 'reported') {
            whereClause.reports = {
                some: {}
            };
        }

        const [posts, totalPosts] = await Promise.all([
            prisma.post.findMany({
                where: whereClause,
                skip,
                take: limit,
                include: {
                    user: {
                        include: {
                            profile: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.post.count({ where: whereClause })
        ]);

        // Fetch report counts for the current page of posts
        const postIds = posts.map((p: any) => p.id);
        const reportCounts = await prisma.report.groupBy({
            by: ['targetId'],
            where: {
                targetId: { in: postIds },
                targetType: 'post'
            },
            _count: {
                id: true
            }
        });

        const reportMap = reportCounts.reduce((acc: any, curr: any) => {
            acc[curr.targetId] = curr._count.id;
            return acc;
        }, {});

        // Map to match frontend expectations
        const mappedPosts = posts.map((post: any) => {
            let image = null;
            if (post.mediaUrls) {
                try {
                    const parsed = JSON.parse(post.mediaUrls);
                    if (Array.isArray(parsed)) {
                        image = parsed[0];
                    }
                } catch (e) {
                    image = post.mediaUrls; // Fallback if not JSON
                }
            }

            return {
                id: post.id,
                user: post.user?.profile?.name || post.user?.email.split('@')[0] || 'Unknown',
                handle: `@${post.user?.profile?.handle || post.id.slice(0, 8)}`,
                content: post.content,
                date: post.createdAt.toISOString().split('T')[0],
                image: image,
                reportCount: reportMap[post.id] || 0,
                status: 'active'
            };
        });

        return apiSuccess({
            posts: mappedPosts,
            pagination: {
                totalPosts,
                currentPage: page,
                totalPages: Math.ceil(totalPosts / limit),
                limit
            }
        }, 'Posts fetched successfully');

    } catch (error: any) {
        console.error('Fetch Posts Error:', error);
        return apiError('Failed to fetch posts: ' + error.message, 500);
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
