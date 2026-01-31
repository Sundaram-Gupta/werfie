import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        const reports = await prisma.report.findMany({
            include: {
                reporter: {
                    include: {
                        profile: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const mappedReports = reports.map(report => ({
            id: report.id,
            type: report.type,
            targetId: report.targetId,
            targetType: report.targetType,
            reporter: `@${report.reporter.profile?.handle || report.reporter.id.slice(0, 8)}`,
            status: report.status,
            date: report.createdAt.toISOString().split('T')[0],
            reason: report.reason
        }));

        return NextResponse.json(mappedReports);

    } catch (error: any) {
        console.error('Fetch Reports Error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch reports' },
            { status: 500 }
        );
    }
}
