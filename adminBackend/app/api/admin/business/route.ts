import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';

export async function GET(req: NextRequest) {
    try {
        const profiles = await prisma.businessProfile.findMany({
            include: {
                user: {
                    include: { profile: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        return apiSuccess(profiles, 'Business profiles fetched successfully');
    } catch (error) {
        return apiError('Failed to fetch profiles', 500);
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const { id, status } = await req.json();
        const profile = await prisma.businessProfile.update({
            where: { id },
            data: { status }
        });
        return apiSuccess(profile, 'Profile updated successfully');
    } catch (error) {
        return apiError('Failed to update profile', 500);
    }
}
