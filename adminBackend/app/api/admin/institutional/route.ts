import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        const profiles = await prisma.institutionalProfile.findMany({
            where: status ? { status } : {},
            include: {
                user: {
                    include: {
                        profile: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return apiSuccess(profiles, 'Institutional profiles fetched successfully');
    } catch (error: any) {
        console.error('[Institutional List] Error:', error);
        return apiError('Internal server error', 500, { details: error.message });
    }
}
