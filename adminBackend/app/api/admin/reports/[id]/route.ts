import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAdminAction } from '@/lib/audit';
import { apiSuccess, apiError } from '@/lib/api-response';

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: reportId } = await params;
        const body = await req.json();
        const { status } = body;
        const adminId = req.headers.get('x-admin-id') || 'system';

        const updatedReport = await prisma.report.update({
            where: { id: reportId },
            data: { status }
        });

        // Audit the action
        await logAdminAction(
            adminId,
            `REVIEWED_REPORT`,
            'REPORT',
            reportId,
            { status }
        );

        return apiSuccess({ report: updatedReport }, 'Report updated successfully');
    } catch (error: any) {
        console.error('Update Report Error:', error);
        if (error?.code === 'P2025') return apiError('Report not found', 404);
        return apiError('Failed to update report', 500);
    }
}
