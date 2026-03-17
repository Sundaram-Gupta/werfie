import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        // Use raw query to ensure all columns (even those not in Prisma schema) are fetched
        // if the client generation failed.
        let profiles;
        if (status) {
            profiles = await prisma.$queryRaw`
                SELECT 
                    ip.*,
                    u.email as "user_email",
                    p.handle as "user_handle",
                    p.name as "user_name"
                FROM "InstitutionalProfile" ip
                JOIN "User" u ON ip."userId" = u.id
                JOIN "Profile" p ON ip."userId" = p."userId"
                WHERE ip.status = ${status}
                ORDER BY ip."createdAt" DESC
            `;
        } else {
            profiles = await prisma.$queryRaw`
                SELECT 
                    ip.*,
                    u.email as "user_email",
                    p.handle as "user_handle",
                    p.name as "user_name"
                FROM "InstitutionalProfile" ip
                JOIN "User" u ON ip."userId" = u.id
                JOIN "Profile" p ON ip."userId" = p."userId"
                ORDER BY ip."createdAt" DESC
            `;
        }

        // Format the raw output to match what the frontend expects (camelCase etc might vary)
        // Note: PostgreSQL returns row names as they are in DB. Prisma usually handles mapping.
        // We'll return it as is and adjust frontend if needed, but PostgreSQL usually returns what we selected.

        return apiSuccess(profiles, 'Institutional profiles fetched successfully');
    } catch (error: any) {
        console.error('[Institutional List] Error:', error);
        if (error?.code === 'P2021' || error?.code === 'P2022') {
            return apiSuccess([], 'Institutional profiles (tables not migrated)');
        }
        return apiError('Internal server error', 500, { details: error?.message });
    }
}
