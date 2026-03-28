import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';

/**
 * UUID path/body ids only ([0-9a-f-]).
 * Prisma binds ${uuid}-shaped parameters as pg `uuid`, which breaks WHERE text = $n against TEXT columns.
 * After this check, embedding in SQL is safe.
 */
function assertUuid(id: unknown): string {
    if (typeof id !== 'string') throw new Error('Invalid id');
    const s = id.trim();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)) {
        throw new Error('Invalid id (expected UUID)');
    }
    return s;
}

function mapVerificationRow(r: any) {
    return {
        id: r.id,
        userId: r.userId,
        businessId: r.businessId,
        type: r.type,
        status: r.status,
        notes: r.notes,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        user: {
            email: r.user_email,
            profile: {
                handle: r.user_handle,
                name: r.user_name,
                avatar: r.user_avatar,
            },
            businessProfile: {
                companyName: r.business_name,
            },
        },
    };
}

/** GET single verification request (same shape as list items). */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const raw = (await params).id;
        let id: string;
        try {
            id = assertUuid(raw);
        } catch {
            return apiError('Invalid verification id (use UUID from list `id` field)', 400);
        }
        const rows = (await prisma.$queryRawUnsafe(
            `SELECT 
                vr.*,
                u.email as "user_email",
                p.handle as "user_handle",
                p.name as "user_name",
                p.avatar as "user_avatar",
                bp."companyName" as "business_name"
            FROM "VerificationRequest" vr
            INNER JOIN "User" u ON CAST(vr."userId" AS TEXT) = CAST(u.id AS TEXT)
            LEFT JOIN "Profile" p ON CAST(vr."userId" AS TEXT) = CAST(p."userId" AS TEXT)
            LEFT JOIN "BusinessProfile" bp ON vr."businessId" IS NOT NULL AND CAST(vr."businessId" AS TEXT) = CAST(bp.id AS TEXT)
            WHERE CAST(vr.id AS TEXT) = '${id}'
            LIMIT 1`
        )) as any[];
        if (!rows || rows.length === 0) {
            return apiError('Verification request not found', 404);
        }
        return apiSuccess(mapVerificationRow(rows[0]), 'Verification request fetched');
    } catch (error: any) {
        console.error('[Admin Verifications GET id]', error);
        return apiError('Failed to fetch verification request', 500, { details: error.message });
    }
}

/**
 * PATCH approve/reject verification request.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const raw = (await params).id;
        let id: string;
        try {
            id = assertUuid(raw);
        } catch {
            return apiError('Invalid verification id (use UUID from list `id` field)', 400);
        }
        const body = await req.json();
        const { status, badgeType } = body;

        const statusStr = typeof status === 'string' ? status.trim() : '';
        if (!statusStr) {
            return apiError('status is required', 400);
        }

        const st = statusStr.toUpperCase();

        const updated = await prisma.$executeRawUnsafe(
            `UPDATE "VerificationRequest"
            SET "status" = $1, "updatedAt" = CURRENT_TIMESTAMP
            WHERE CAST("id" AS TEXT) = '${id}'`,
            statusStr
        );

        if (updated === 0) {
            return apiError('Verification request not found', 404);
        }

        const reqs = (await prisma.$queryRawUnsafe(
            `SELECT * FROM "VerificationRequest" WHERE CAST("id" AS TEXT) = '${id}' LIMIT 1`
        )) as any[];
        const request = reqs[0];

        if (!request) {
            return apiError('Request not found after update', 404);
        }

        const uid = request.userId as string;
        const typeNorm = String(request.type || '').trim().toUpperCase();

        // Business profile is loaded in the app by userId (`GET /api/business`). Updating only by
        // VerificationRequest.businessId can miss rows (stale/null id), so always key BUSINESS off userId.
        if (st === 'APPROVED') {
            if (typeNorm === 'BUSINESS') {
                const uidSafe = assertUuid(uid);
                await prisma.$executeRawUnsafe(
                    `UPDATE "BusinessProfile"
                    SET "isVerified" = true, "status" = 'approved', "updatedAt" = CURRENT_TIMESTAMP
                    WHERE CAST("userId" AS TEXT) = '${uidSafe}'`
                );
            } else if (typeNorm === 'INSTITUTION' || typeNorm === 'INSTITUTIONAL') {
                const uidSafe = assertUuid(uid);
                await prisma.$executeRawUnsafe(
                    `UPDATE "InstitutionalProfile"
                    SET "isVerified" = true,
                        "status" = 'approved',
                        "badgeType" = $1,
                        "updatedAt" = CURRENT_TIMESTAMP
                    WHERE CAST("userId" AS TEXT) = '${uidSafe}'`,
                    badgeType || 'official'
                );
            } else {
                const uidSafe = assertUuid(uid);
                await prisma.$executeRawUnsafe(
                    `UPDATE "Profile"
                    SET "verified" = true, "updatedAt" = CURRENT_TIMESTAMP
                    WHERE CAST("userId" AS TEXT) = '${uidSafe}'`
                );
            }
        } else if (st === 'REJECTED') {
            if (typeNorm === 'BUSINESS') {
                const uidSafe = assertUuid(uid);
                await prisma.$executeRawUnsafe(
                    `UPDATE "BusinessProfile"
                    SET "isVerified" = false, "status" = 'rejected', "updatedAt" = CURRENT_TIMESTAMP
                    WHERE CAST("userId" AS TEXT) = '${uidSafe}'`
                );
            } else if (typeNorm === 'INSTITUTION' || typeNorm === 'INSTITUTIONAL') {
                const uidSafe = assertUuid(uid);
                await prisma.$executeRawUnsafe(
                    `UPDATE "InstitutionalProfile"
                    SET "isVerified" = false, "status" = 'rejected', "updatedAt" = CURRENT_TIMESTAMP
                    WHERE CAST("userId" AS TEXT) = '${uidSafe}'`
                );
            }
        }

        return apiSuccess(request, 'Request processed');
    } catch (error: any) {
        console.error('[Admin Verifications PATCH]', error);
        return apiError('Failed to review request', 500, { details: error.message });
    }
}
