import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        const [userCount, reportCount, postCount, pendingReports] = await Promise.all([
            prisma.user.count(),
            prisma.report.count(),
            prisma.post.count(),
            prisma.report.count({ where: { status: 'pending' } })
        ]);

        // Calculate DAU as a percentage of total users for demo purposes if no tracking exists
        // In a real app, this would come from a tracking table
        const dailyActiveUsers = Math.floor(userCount * 0.45);

        // Get recent activity from reports and new users
        const [recentReports, recentUsers] = await Promise.all([
            prisma.report.findMany({
                take: 3,
                orderBy: { createdAt: 'desc' },
                include: {
                    reporter: {
                        include: {
                            profile: true
                        }
                    }
                }
            }),
            prisma.user.findMany({
                take: 2,
                orderBy: { createdAt: 'desc' },
                include: {
                    profile: true
                }
            })
        ]);

        const recentActivity = [
            ...recentReports.map(r => ({
                user: r.reporter.profile?.name || r.reporter.email,
                action: `reported a ${r.targetType}`,
                time: formatDate(r.createdAt),
                color: "red",
                type: "report"
            })),
            ...recentUsers.map(u => ({
                user: u.profile?.name || u.email,
                action: "joined the platform",
                time: formatDate(u.createdAt),
                color: "blue",
                type: "user"
            }))
        ].sort((a, b) => 0); // Keep them as they are or sort if needed

        return NextResponse.json({
            success: true,
            stats: {
                totalUsers: {
                    value: formatNumber(userCount),
                    trend: "+12%",
                    trendValue: "+120K"
                },
                dailyActiveUsers: {
                    value: formatNumber(dailyActiveUsers),
                    trend: "+5.4%",
                    trendValue: "+12K"
                },
                verificationRequests: {
                    value: "842", // Mocked as no verification model yet
                    trend: "+12",
                    trendValue: "+12"
                },
                reports: {
                    value: reportCount.toString(),
                    trend: "-3%",
                    trendValue: "-5"
                }
            },
            recentActivity
        });

    } catch (error: any) {
        console.error('Fetch Stats Error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch statistics' },
            { status: 500 }
        );
    }
}

function formatNumber(num: number): string {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

function formatDate(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
}
