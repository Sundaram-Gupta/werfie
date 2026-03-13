import { prisma } from '@/lib/prisma';
import { validateAdmin, unauthorizedResponse } from '@/lib/auth-guard';
import { apiSuccess, apiError } from '@/lib/api-response';

export async function GET(request) {
    const adminUser = await validateAdmin(request);
    if (!adminUser) {
        return unauthorizedResponse();
    }

    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                email: true,
                role: true,
                status: true,
                isVerified: true,
                createdAt: true,
                profile: {
                    select: {
                        name: true,
                        handle: true,
                        avatar: true
                    }
                }
            }
        });

        // Format the response
        const formattedUsers = users.map(user => ({
            id: user.id,
            name: user.profile?.name || 'N/A',
            email: user.email,
            role: user.role,
            status: user.status,
            isVerified: user.isVerified,
            signupDate: user.createdAt,
            // Extra info likely useful
            handle: user.profile?.handle,
            avatar: user.profile?.avatar
        }));

        return apiSuccess(formattedUsers, 'Users fetched successfully');
    } catch (error) {
        console.error('Error fetching users:', error);
        return apiError('Internal server error', 500, null);
    }
}
