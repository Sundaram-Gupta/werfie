import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: reportId } = await params;
        const body = await req.json();
        const { status } = body;

        const updatedReport = await prisma.report.update({
            where: { id: reportId },
            data: { status }
        });

        return NextResponse.json({ success: true, report: updatedReport });
    } catch (error) {
        console.error('Update Report Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to update report' }, { status: 500 });
    }
}
