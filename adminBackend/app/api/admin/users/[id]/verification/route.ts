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

        return NextResponse.json({
            success: true,
            message: `User verification status updated to ${isVerified}`,
            user: {
                id: updatedUser.id,
                verified: updatedUser.profile?.verified
            }
        });

    } catch (error: any) {
        console.error('Update Verification Error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update user verification status' },
            { status: 500 }
        );
    }
}
