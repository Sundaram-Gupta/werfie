import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAdminAction } from '@/lib/audit';

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

        return NextResponse.json({ success: true, report: updatedReport });
    } catch (error) {
        console.error('Update Report Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to update report' }, { status: 500 });
    }
}
