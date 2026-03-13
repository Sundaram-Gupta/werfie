import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';

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
            return apiError('Invalid status. Use ACTIVE or SUSPENDED', 400);
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: { status }
        });

        console.log(`[AUDIT] Admin ${adminId} updated status of ${id} to ${status}`);

        return apiSuccess(
            { user: { id: updatedUser.id, status: updatedUser.status } },
            `User status updated to ${status}`
        );

    } catch (error: any) {
        console.error('Update Status Error:', error);
        return apiError('Failed to update user status', 500);
    }
}
