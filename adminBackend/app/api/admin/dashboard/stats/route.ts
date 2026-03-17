import { prisma } from '@/lib/prisma';
import { apiSuccess } from '@/lib/api-response';

export async function GET() {
    try {
        const now = new Date();
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

        // 1. Total Users
        const totalUsers = await prisma.user.count();
        const totalUsersLastMonth = await prisma.user.count({
            where: { createdAt: { lt: lastMonth } }
        });
        const usersGrowth = totalUsers - totalUsersLastMonth;

        // 2. Daily Active Users (DAU) - Using lastActiveAt (column may not exist)
        let dau = 0;
        let dauLastMonth = 0;
        try {
            dau = await prisma.user.count({
                where: {
                    lastActiveAt: { gte: twentyFourHoursAgo }
                }
            });
            dauLastMonth = await prisma.user.count({
                where: {
                    lastActiveAt: {
                        gte: new Date(lastMonth.getTime() - 24 * 60 * 60 * 1000),
                        lt: lastMonth
                    }
                }
            });
        } catch {
            // lastActiveAt column may not exist (P2022)
        }
        const dauGrowthPercent = dauLastMonth > 0
            ? ((dau - dauLastMonth) / dauLastMonth * 100).toFixed(1)
            : "0";

        // 3. Pending Verification Requests (table may not exist yet)
        let pendingVerifications = 0;
        let verificationsGrowth = 0;
        try {
            pendingVerifications = await prisma.verificationRequest.count({
                where: { status: 'pending' }
            });
            const verificationsLastMonth = await prisma.verificationRequest.count({
                where: { status: 'pending', createdAt: { lt: lastMonth } }
            });
            verificationsGrowth = pendingVerifications - verificationsLastMonth;
        } catch {
            // VerificationRequest table may not exist
        }

        // 4. Reports Count (table may not exist yet)
        let reportsCount = 0;
        let reportsGrowthPercent = "0";
        try {
            reportsCount = await prisma.report.count({
                where: { status: 'pending' }
            });
            const reportsLastMonth = await prisma.report.count({
                where: { status: 'pending', createdAt: { lt: lastMonth } }
            });
            reportsGrowthPercent = reportsLastMonth > 0
                ? ((reportsCount - reportsLastMonth) / reportsLastMonth * 100).toFixed(1)
                : "0";
        } catch {
            // Report table may not exist
        }

        return apiSuccess({
                stats: {
                    totalUsers: {
                        value: formatNumber(totalUsers),
                        trend: usersGrowth >= 0 ? 'up' : 'down',
                        trendValue: `+${formatNumber(Math.abs(usersGrowth))}`
                    },
                    dau: {
                        value: formatNumber(dau),
                        trend: parseFloat(dauGrowthPercent) >= 0 ? 'up' : 'down',
                        trendValue: (parseFloat(dauGrowthPercent) >= 0 ? '+' : '') + dauGrowthPercent + '%'
                    },
                    verifications: {
                        value: pendingVerifications.toString(),
                        trend: verificationsGrowth >= 0 ? 'up' : 'down',
                        trendValue: (verificationsGrowth >= 0 ? '+' : '') + verificationsGrowth.toString()
                    },
                    reports: {
                        value: reportsCount.toString(),
                        trend: parseFloat(reportsGrowthPercent) >= 0 ? 'up' : 'down',
                        trendValue: (parseFloat(reportsGrowthPercent) >= 0 ? '+' : '') + reportsGrowthPercent + '%'
                    }
                }
            }, 'Stats fetched successfully');
    } catch (error: unknown) {
        console.error('Dashboard Stats API Error:', error);
        return apiSuccess({
            stats: {
                totalUsers: { value: '0', trend: 'up' as const, trendValue: '+0' },
                dau: { value: '0', trend: 'up' as const, trendValue: '+0%' },
                verifications: { value: '0', trend: 'up' as const, trendValue: '+0' },
                reports: { value: '0', trend: 'up' as const, trendValue: '+0%' }
            }
        }, 'Stats (default: DB unavailable or schema not migrated)');
    }
}

function formatNumber(num: number) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}
