import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';

/** GET /api/admin/posts/count - returns real total post count (uncapped, for display e.g. 103.5K) */
export async function GET(req: NextRequest) {
    try {
        const total = await prisma.post.count();
        const totalPosts = Number(total);
        return apiSuccess({ totalPosts: totalPosts, total: totalPosts }, 'Count fetched');
    } catch (error: any) {
        console.error('Posts count error:', error);
        if (error?.code === 'P2021') {
            return apiSuccess({ totalPosts: 0, total: 0 }, 'Count (tables not migrated)');
        }
        return apiError('Failed to fetch posts count', 500);
    }
}
