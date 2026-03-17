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
        const { role } = body;
        const adminId = req.headers.get('x-admin-id');

        // Validate Status Logic
        const validRoles = ['USER', 'BUSINESS', 'MODERATOR', 'ADMIN'];
        if (!validRoles.includes(role)) {
            return apiError(`Invalid role. Allowed: ${validRoles.join(', ')}`, 400);
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: { role }
        });

        console.log(`[AUDIT] Admin ${adminId} updated role of ${id} to ${role}`);

        return apiSuccess(
            { user: { id: updatedUser.id, role: updatedUser.role } },
            `User role updated to ${role}`
        );

    } catch (error: any) {
        console.error('Update Role Error:', error);
        if (error?.code === 'P2025') return apiError('User not found', 404);
        return apiError('Failed to update user role', 500);
    }
}
