import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';

export async function GET(req: NextRequest) {
    try {
        const campaigns = await prisma.campaign.findMany({
            include: {
                adAccount: {
                    include: {
                        business: {
                            include: {
                                user: {
                                    include: { profile: true }
                                }
                            }
                        }
                    }
                },
                ads: true
            },
            orderBy: { createdAt: 'desc' }
        });
        return apiSuccess(campaigns, 'Campaigns fetched successfully');
    } catch (error) {
        console.error('Error fetching admin campaigns:', error);
        return apiError('Failed to fetch campaigns', 500);
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const { id, status } = await req.json();
        const campaign = await prisma.campaign.update({
            where: { id },
            data: { status }
        });
        return apiSuccess(campaign, 'Campaign updated successfully');
    } catch (error) {
        return apiError('Failed to update campaign', 500);
    }
}
