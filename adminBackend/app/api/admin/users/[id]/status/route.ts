import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = {
    params: Promise<{ id: string }>
}

export async function PATCH(
    req: NextRequest,
    { params }: Params
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { status } = body;
        const adminId = req.headers.get('x-admin-id');

        if (!['ACTIVE', 'SUSPENDED'].includes(status)) {
            return NextResponse.json(
                { success: false, error: 'Invalid status. Use ACTIVE or SUSPENDED' },
                { status: 400 }
            );
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: { status }
        });

        console.log(`[AUDIT] Admin ${adminId} updated status of ${id} to ${status}`);

        return NextResponse.json({
            success: true,
            message: `User status updated to ${status}`,
            user: { id: updatedUser.id, status: updatedUser.status }
        });

    } catch (error: any) {
        console.error('Update Status Error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update user status' },
            { status: 500 }
        );
    }
}
