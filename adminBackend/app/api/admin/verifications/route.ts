import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';

export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const type = url.searchParams.get('type') || '';
        const status = url.searchParams.get('status') || 'PENDING';

        console.log(`[Verifications GET] type: ${type}, status: ${status}`);

        // Use raw SQL to avoid Prisma schema mismatch with includes
        let requests: any[] = [];

        if (type) {
            requests = await prisma.$queryRaw`
                SELECT 
                    vr.*,
                    u.email as "user_email",
                    p.handle as "user_handle",
                    p.name as "user_name",
                    p.avatar as "user_avatar",
                    bp."companyName" as "business_name"
                FROM "VerificationRequest" vr
                JOIN "User" u ON vr."userId" = u.id
                LEFT JOIN "Profile" p ON vr."userId" = p."userId"
                LEFT JOIN "BusinessProfile" bp ON vr."businessId" = bp.id
                WHERE vr.status = ${status}
                AND vr.type = ${type}
                ORDER BY vr."createdAt" DESC
            `;
        } else {
            requests = await prisma.$queryRaw`
                SELECT 
                    vr.*,
                    u.email as "user_email",
                    p.handle as "user_handle",
                    p.name as "user_name",
                    p.avatar as "user_avatar",
                    bp."companyName" as "business_name"
                FROM "VerificationRequest" vr
                JOIN "User" u ON vr."userId" = u.id
                LEFT JOIN "Profile" p ON vr."userId" = p."userId"
                LEFT JOIN "BusinessProfile" bp ON vr."businessId" = bp.id
                WHERE vr.status = ${status}
                ORDER BY vr."createdAt" DESC
            `;
        }

        // Map raw result to a shape expected by the admin frontend
        const mapped = requests.map((r: any) => ({
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
                }
            }
        }));

        console.log(`[Verifications GET] Returning ${mapped.length} requests`);

        return apiSuccess(mapped, 'Verification requests fetched successfully');
    } catch (error: any) {
        console.error('[Admin Verifications] Error:', error);
        return apiError('Failed to fetch verification requests', 500, { details: error.message });
    }
}
