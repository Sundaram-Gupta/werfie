import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

        // 2. Daily Active Users (DAU) - Using lastActiveAt
        const dau = await prisma.user.count({
            where: {
                lastActiveAt: { gte: twentyFourHoursAgo }
            }
        });
        const dauLastMonth = await prisma.user.count({
            where: {
                lastActiveAt: {
                    gte: new Date(lastMonth.getTime() - 24 * 60 * 60 * 1000),
                    lt: lastMonth
                }
            }
        });
        const dauGrowthPercent = dauLastMonth > 0
            ? ((dau - dauLastMonth) / dauLastMonth * 100).toFixed(1)
            : "0";

        // 3. Pending Verification Requests
        const pendingVerifications = await prisma.verificationRequest.count({
            where: { status: 'pending' }
        });
        const verificationsLastMonth = await prisma.verificationRequest.count({
            where: {
                status: 'pending',
                createdAt: { lt: lastMonth }
            }
        });
        const verificationsGrowth = pendingVerifications - verificationsLastMonth;

        // 4. Reports Count
        const reportsCount = await prisma.report.count({
            where: { status: 'pending' }
        });
        const reportsLastMonth = await prisma.report.count({
            where: {
                status: 'pending',
                createdAt: { lt: lastMonth }
            }
        });
        const reportsGrowthPercent = reportsLastMonth > 0
            ? ((reportsCount - reportsLastMonth) / reportsLastMonth * 100).toFixed(1)
            : "0";

        return NextResponse.json({
            success: true,
            data: {
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
            }
        });
    } catch (error: any) {
        console.error('Dashboard Stats API Error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal Server Error' },
            { status: 500 }
        );
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
