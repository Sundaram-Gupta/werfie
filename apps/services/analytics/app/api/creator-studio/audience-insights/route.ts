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

function extractCountry(location: string | null | undefined): string | null {
    if (!location || typeof location !== 'string') return null;
    const trimmed = location.trim();
    if (!trimmed) return null;
    const parts = trimmed.split(',').map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) return parts[parts.length - 1];
    return trimmed;
}

function getAgeGroup(birthdate: string | Date | null | undefined): string | null {
    if (!birthdate) return null;
    try {
        const d = typeof birthdate === 'string' ? new Date(birthdate) : birthdate;
        if (isNaN(d.getTime())) return null;
        const now = new Date();
        let age = now.getFullYear() - d.getFullYear();
        const m = now.getMonth() - d.getMonth();
        if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
        if (age < 13) return '13-17';
        if (age < 18) return '13-17';
        if (age < 25) return '18-24';
        if (age < 35) return '25-34';
        if (age < 45) return '35-44';
        return '45+';
    } catch {
        return null;
    }
}

function extractHashtags(content: string): string[] {
    if (!content || typeof content !== 'string') return [];
    const matches = content.match(/#[a-zA-Z0-9_]+/g) || [];
    return matches.map((m) => m.slice(1).toLowerCase());
}

export async function GET(request: Request) {
    const h = await headers();
    let userId = h.get('x-user-id');
    const authHeader = h.get('authorization');
    if (!userId && authHeader) {
        userId = getUserIdFromToken(authHeader);
    }
    if (!userId && request) {
        try {
            const { searchParams } = new URL(request.url);
            userId = searchParams.get('userId');
        } catch {}
    }

    const contentHeaders: Record<string, string> = { 'x-user-id': userId || '' };
    if (authHeader) contentHeaders['Authorization'] = authHeader;

    const emptyResponse = {
        topInterests: [] as { label: string; value: number }[],
        gender: { male: 0, female: 0, other: 0 },
        topLocations: [] as { country: string; pct: number }[],
        ageGroups: {} as Record<string, number>,
        followerGrowth: { newFollowers: 0, unfollows: 0, netGrowth: 0 },
        activeTime: { bestHour: 20, bestDay: 'Friday' },
        engagementRate: 0,
        deviceUsage: { mobile: 0, desktop: 0, tablet: 0 },
        languages: [] as { lang: string; pct: number }[],
    };

    if (!userId) {
        return NextResponse.json({
            status: true,
            message: 'Audience insights',
            data: emptyResponse,
        }, { status: 200 });
    }

    try {
        const [followersRes, postsRes, growthRes] = await Promise.all([
            fetch(`http://127.0.0.1:3002/api/users/${userId}/followers?limit=500`, {
                headers: authHeader ? { Authorization: authHeader } : {},
            }),
            fetch('http://127.0.0.1:3003/api/posts/for-audience-insights', { headers: contentHeaders }),
            fetch(`http://127.0.0.1:3002/api/users/${userId}/follower-growth`),
        ]);

        const followersRaw = followersRes.ok ? (await followersRes.json()) : null;
        let followers: Array<{ profile?: { location?: string; birthdate?: string }; lastActiveAt?: string }> = [];
        if (Array.isArray(followersRaw)) {
            followers = followersRaw;
        } else if (followersRaw?.data && Array.isArray(followersRaw.data)) {
            followers = followersRaw.data;
        } else if (followersRaw && typeof followersRaw === 'object' && !Array.isArray(followersRaw)) {
            followers = (followersRaw as { users?: unknown[] }).users ?? [];
            if (!Array.isArray(followers)) followers = [];
        }

        const growthRaw = growthRes.ok ? await growthRes.json() : null;
        const growthData = growthRaw?.data ?? growthRaw ?? { total: 0, newLast30: 0, netGrowth: 0 };

        const postsRaw = postsRes.ok ? await postsRes.json() : null;
        const postsData = postsRaw?.data ?? postsRaw ?? { posts: [] };
        const postsRaw2 = postsData?.posts ?? postsData ?? [];
        const posts = Array.isArray(postsRaw2) ? postsRaw2 : [];

        const totalFollowers = followers.length;

        // Top Locations - from follower profiles
        const locationCounts: Record<string, number> = {};
        for (const f of followers) {
            const country = extractCountry(f.profile?.location);
            if (country) {
                locationCounts[country] = (locationCounts[country] || 0) + 1;
            }
        }
        const totalWithLocation = Object.values(locationCounts).reduce((a, b) => a + b, 0);
        const topLocations = Object.entries(locationCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([country, count]) => ({
                country,
                pct: totalWithLocation > 0 ? Math.round((count / totalWithLocation) * 100) : 0,
            }));

        // Age groups - from follower birthdates
        const ageCounts: Record<string, number> = {};
        for (const f of followers) {
            const group = getAgeGroup(f.profile?.birthdate);
            if (group) {
                ageCounts[group] = (ageCounts[group] || 0) + 1;
            }
        }

        // Top Interests - from creator's posts hashtags weighted by engagement
        const hashtagScores: Record<string, number> = {};
        for (const p of posts) {
            const engagement = (p._count?.likes || 0) + (p._count?.retweets || 0) * 2 + (p._count?.replies || 0);
            const tags = extractHashtags(p.content);
            const weight = engagement > 0 ? engagement + 1 : 1;
            for (const tag of tags) {
                hashtagScores[tag] = (hashtagScores[tag] || 0) + weight;
            }
        }
        const maxScore = Math.max(...Object.values(hashtagScores), 1);
        const topInterests = Object.entries(hashtagScores)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([label, score]) => ({
                label: label.charAt(0).toUpperCase() + label.slice(1),
                value: Math.min(100, Math.round((score / maxScore) * 100)),
            }));

        // Active time from followers' lastActiveAt (hour + day of week)
        const hourCounts: Record<number, number> = {};
        const dayCounts: Record<number, number> = {};
        for (const f of followers) {
            const la = (f as { lastActiveAt?: string }).lastActiveAt;
            if (la) {
                try {
                    const d = new Date(la);
                    if (!isNaN(d.getTime())) {
                        hourCounts[d.getHours()] = (hourCounts[d.getHours()] || 0) + 1;
                        dayCounts[d.getDay()] = (dayCounts[d.getDay()] || 0) + 1;
                    }
                } catch {}
            }
        }
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const bestHour = Object.keys(hourCounts).length > 0
            ? Number(Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0][0])
            : 14;
        const bestDayNum = Object.keys(dayCounts).length > 0
            ? Number(Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0][0])
            : 4;
        const bestDay = dayNames[bestDayNum] ?? 'Thursday';

        // Gender - not in schema; no real data, return zeros (frontend shows empty state)
        const gender = { male: 0, female: 0, other: 0 };

        // Engagement rate - totalEngagements / (postCount * followers) * 100, or eng-per-post based fallback
        let engagementRate = 0;
        try {
            const engRes = await fetch('http://127.0.0.1:3003/api/posts/engagement-stats', { headers: contentHeaders });
            const countRes = await fetch('http://127.0.0.1:3003/api/posts/count', { headers: contentHeaders });
            if (engRes.ok && countRes.ok) {
                const engRaw = await engRes.json();
                const countRaw = await countRes.json();
                const totalEng = engRaw?.data?.totalEngagements ?? engRaw?.totalEngagements ?? engRaw?.totalEngagement ?? 0;
                const postCount = Math.max(countRaw?.data?.count ?? countRaw?.count ?? 1, 1);
                const followers = Math.max(growthData.total ?? totalFollowers, 1);
                if (totalEng > 0 && postCount > 0) {
                    engagementRate = Math.min(100, Math.round((totalEng / (postCount * followers)) * 100));
                    if (engagementRate === 0 && totalEng > 0) engagementRate = Math.min(100, Math.round((totalEng / postCount) * 2));
                }
            }
        } catch {
            // ignore
        }

        // Device usage - not in schema; no real data (return zeros)
        const deviceUsage = { mobile: 0, desktop: 0, tablet: 0 };

        // Languages - real data from followers' preferredLanguage
        const langCounts: Record<string, number> = {};
        const langNames: Record<string, string> = {
            en: 'English', es: 'Spanish', hi: 'Hindi', fr: 'French', de: 'German',
            zh: 'Chinese', ja: 'Japanese', pt: 'Portuguese', ar: 'Arabic', bn: 'Bengali',
        };
        for (const f of followers) {
            const lang = (f as { preferredLanguage?: string }).preferredLanguage;
            const code = (lang || 'en').toLowerCase().slice(0, 2);
            const name = langNames[code] || code.toUpperCase();
            langCounts[name] = (langCounts[name] || 0) + 1;
        }
        const totalWithLang = Object.values(langCounts).reduce((a, b) => a + b, 0);
        const languages = totalWithLang > 0
            ? Object.entries(langCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 6)
                .map(([lang, count]) => ({
                    lang,
                    pct: Math.round((count / totalWithLang) * 100),
                }))
            : [];

        const data = {
            topInterests,
            gender,
            topLocations,
            ageGroups: ageCounts,
            followerGrowth: {
                newFollowers: growthData.newLast30 ?? 0,
                unfollows: 0,
                netGrowth: growthData.netGrowth ?? growthData.newLast30 ?? 0,
            },
            totalFollowers: growthData.total ?? totalFollowers,
            activeTime: { bestHour, bestDay },
            engagementRate,
            deviceUsage,
            languages,
        };

        return NextResponse.json({
            status: true,
            message: 'Audience insights fetched successfully',
            data,
        }, { status: 200 });
    } catch (err) {
        console.error('[Analytics] Audience insights error:', err);
        return NextResponse.json({
            status: false,
            message: 'Failed to fetch audience insights',
            data: emptyResponse,
        }, { status: 500 });
    }
}
