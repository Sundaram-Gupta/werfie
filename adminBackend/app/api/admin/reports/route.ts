import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';

export async function GET(req: NextRequest) {
    try {
        let reports: any[];
        try {
            reports = await prisma.report.findMany({
                include: {
                    reporter: {
                        include: {
                            profile: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });
        } catch (profileErr: any) {
            if (profileErr?.code === 'P2022') {
                reports = await prisma.report.findMany({
                    include: { reporter: true },
                    orderBy: { createdAt: 'desc' }
                });
                reports = reports.map((r: any) => ({ ...r, reporter: { ...r.reporter, profile: null } }));
            } else {
                throw profileErr;
            }
        }

        const mappedReports = reports.map(report => ({
            id: report.id,
            type: report.type,
            targetId: report.targetId,
            targetType: report.targetType,
            reporter: `@${report.reporter?.profile?.handle || report.reporter?.id?.slice?.(0, 8) || 'unknown'}`,
            status: report.status,
            date: report.createdAt.toISOString().split('T')[0],
            reason: report.reason
        }));

        return apiSuccess(mappedReports, 'Reports fetched successfully');

    } catch (error: any) {
        console.error('Fetch Reports Error:', error);
        if (error?.code === 'P2021') {
            return apiSuccess([], 'Reports (tables not migrated)');
        }
        return apiError('Failed to fetch reports', 500);
    }
}
