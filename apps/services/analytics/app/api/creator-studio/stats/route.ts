import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

function getUserIdFromToken(authHeader: string | null): string | null {
    if (!authHeader?.startsWith('Bearer ')) return null;
    try {
        const token = authHeader.slice(7).trim();
        const payload = token.split('.')[1];
        if (!payload) return null;
        const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
        const decoded = JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
        return decoded.sub ?? decoded.userId ?? decoded.id ?? null;
    } catch {
        return null;
    }
}

export async function GET() {
    const h = await headers();
    let userId = h.get('x-user-id');
    const authHeader = h.get('authorization');
    if (!userId && authHeader) {
        userId = getUserIdFromToken(authHeader);
    }

    let postCount = 0;
    let followersCount = 0;
    let totalEngagements = 0;

    const contentHeaders: Record<string, string> = { 'x-user-id': userId || '' };
    if (authHeader) contentHeaders['Authorization'] = authHeader;

    const userServiceUrl = process.env.USER_SERVICE_URL || 'http://127.0.0.1:3002';
    const contentServiceUrl = process.env.CONTENT_SERVICE_URL || 'http://127.0.0.1:3003';

    if (userId) {
        try {
            const [countRes, userRes, engagementRes] = await Promise.all([
                fetch(`${contentServiceUrl}/api/posts/count`, { headers: contentHeaders }),
                fetch(`${userServiceUrl}/api/users/${userId}/followers-count`),
                fetch(`${contentServiceUrl}/api/posts/engagement-stats`, { headers: contentHeaders })
            ]);
            if (countRes.ok) {
                const json = await countRes.json();
                postCount = json.count ?? json.data?.count ?? 0;
            }
            if (userRes.ok) {
                const json = await userRes.json();
                followersCount = json.count ?? json.data?.count ?? 0;
            }
            if (engagementRes.ok) {
                const json = await engagementRes.json();
                totalEngagements = json.totalEngagements ?? json.data?.totalEngagements ?? 0;
            }
        } catch {
            // ignore
        }
    }

    const impressions = totalEngagements;
    const engagementRate = postCount > 0 && impressions > 0
        ? Math.min(100, Number(((impressions / (postCount * 10)) * 100).toFixed(1)))
        : 0;

    const data = {
        totalPosts: { total: postCount, growth: 0 },
        followers: { total: followersCount, growth: 0 },
        views: { total: impressions, growth: 0 },
        engagement: { rate: engagementRate, growth: 0 },
        earnings: { total: 0, growth: 0 }
    };

    return NextResponse.json({
        status: true,
        message: 'Creator studio stats fetched successfully',
        data
    }, { status: 200 });
}
