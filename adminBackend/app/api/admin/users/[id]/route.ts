import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';

// Use generic params type that satisfies Next.js expectations
type Params = {
    params: Promise<{ id: string }>
}

export async function GET(
    req: NextRequest,
    { params }: Params
) {
    try {
        const { id } = await params;

        let user: any;
        try {
            user = await prisma.user.findUnique({
                where: { id },
                include: {
                    profile: true,
                    businessProfile: true,
                }
            });
        } catch (profileErr: any) {
            if (profileErr?.code === 'P2022') {
                user = await prisma.user.findUnique({
                    where: { id },
                    include: { businessProfile: true }
                });
                if (user) user.profile = null;
            } else {
                throw profileErr;
            }
        }

        if (!user) {
            return apiError('User not found', 404);
        }

        const { passwordHash, ...safeUser } = user;
        return apiSuccess({ user: safeUser }, 'User fetched successfully');

    } catch (error: any) {
        console.error('Get User Error:', error);
        if (error?.code === 'P2025') return apiError('User not found', 404);
        if (error?.code === 'P2021') return apiError('User table not found', 500);
        return apiError('Failed to fetch user', 500);
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: Params
) {
    try {
        const { id } = await params;
        const adminId = req.headers.get('x-admin-id');

        // Soft delete: update status to DELETED (or similar)
        // Note: Schema should support 'DELETED' in status.

        const updatedUser = await prisma.user.update({
            where: { id },
            data: {
                status: 'DELETED'
                // optionally set deletedAt if the field existed
            }
        });

        // Log action (basic console log, can be expanded to DB logging)
        console.log(`[AUDIT] Admin ${adminId} soft-deleted user ${id}`);

        return apiSuccess(
            { user: { id: updatedUser.id, status: updatedUser.status } },
            'User soft-deleted successfully'
        );

    } catch (error: any) {
        console.error('Delete User Error:', error);
        if (error?.code === 'P2025') return apiError('User not found', 404);
        return apiError('Failed to delete user', 500);
    }
}
