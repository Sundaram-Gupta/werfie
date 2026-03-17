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
        const { isVerified } = await req.json();
        const adminId = req.headers.get('x-admin-id');

        const updatedUser = await prisma.user.update({
            where: { id },
            data: {
                profile: {
                    update: {
                        verified: isVerified
                    }
                }
            },
            include: {
                profile: true
            }
        });

        console.log(`[AUDIT] Admin ${adminId} updated verification status of ${id} to ${isVerified}`);

        return apiSuccess(
            { user: { id: updatedUser.id, verified: updatedUser.profile?.verified } },
            `User verification status updated to ${isVerified}`
        );

    } catch (error: any) {
        console.error('Update Verification Error:', error);
        if (error?.code === 'P2025') return apiError('User not found', 404);
        if (error?.code === 'P2022') return apiError('Profile schema mismatch - verification not supported', 500);
        return apiError('Failed to update user verification status', 500);
    }
}
