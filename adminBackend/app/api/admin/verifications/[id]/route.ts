import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    console.error('[Admin Verifications PATCH] START');
    try {
        const { id } = await params;
        const body = await req.json();
        const { status, notes, badgeType } = body;

        console.error(`[Admin Verifications PATCH] ID: ${id}, Status: ${status}`);

        // Try the simplest possible update first
        try {
            const res = await prisma.$executeRawUnsafe(
                `UPDATE "VerificationRequest" SET "status" = $1, "notes" = $2 WHERE "id" = $3::uuid`,
                status,
                notes || null,
                id
            );
            console.error('[Admin Verifications PATCH] Result rows:', res);
        } catch (rawErr: any) {
            console.error('[Admin Verifications PATCH] SQL FAILED:', rawErr.message);
            throw rawErr;
        }

        // Fetch back
        const reqs: any[] = await prisma.$queryRawUnsafe(
            'SELECT * FROM "VerificationRequest" WHERE "id" = $1::uuid',
            id
        );
        const request = reqs[0];

        if (!request) {
            return apiError('Request not found after update', 404);
        }

        if (status.toUpperCase() === 'APPROVED') {
            const uid = request.userId;
            const bid = request.businessId;
            const type = request.type;

            if (type === 'BUSINESS' && bid) {
                await prisma.$executeRawUnsafe(
                   `UPDATE "BusinessProfile" SET "isVerified" = true, "status" = 'approved' WHERE "id" = $1::uuid`,
                   bid
                );
            } else if (type === 'INSTITUTION') {
                await prisma.$executeRawUnsafe(
                    `UPDATE "InstitutionalProfile" SET "isVerified" = true, "status" = 'approved', "badgeType" = $1 WHERE "userId" = $2::uuid`,
                    badgeType || 'official',
                    uid
                );
            } else {
                await prisma.$executeRawUnsafe(
                    `UPDATE "Profile" SET "verified" = true WHERE "userId" = $1::uuid`,
                    uid
                );
            }
        }

        return apiSuccess(request, `Request processed`);
    } catch (error: any) {
        console.error('[Admin Verifications PATCH] FATAL:', error.message);
        return apiError('Failed to review request', 500, { details: error.message });
    }
}
