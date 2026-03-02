import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { status, adminNotes, badgeType } = await request.json();

        if (!['approved', 'rejected', 'under_review', 'pending'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        const profile = await prisma.institutionalProfile.update({
            where: { id },
            data: {
                status,
                adminNotes,
                badgeType,
                isVerified: status === 'approved'
            }
        });

        // Sync to Profile and User
        if (status === 'approved') {
            await Promise.all([
                prisma.profile.update({
                    where: { userId: profile.userId },
                    data: { verified: true }
                }),
                prisma.user.update({
                    where: { id: profile.userId },
                    data: { institutionType: profile.institutionType }
                })
            ]);
        } else if (status === 'rejected') {
            await prisma.profile.update({
                where: { userId: profile.userId },
                data: { verified: false }
            });
        }

        return NextResponse.json(profile);
    } catch (error: any) {
        console.error('[Institutional Review] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
