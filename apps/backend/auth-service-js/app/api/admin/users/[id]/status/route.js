import { prisma } from '@/lib/prisma';
import { validateAdmin, unauthorizedResponse } from '@/lib/auth-guard';
import { apiSuccess, apiError } from '@/lib/api-response';
import { z } from 'zod';

const statusSchema = z.object({
    status: z.enum(['ACTIVE', 'SUSPENDED'])
});

export async function PATCH(request, { params }) {
    const adminUser = await validateAdmin(request);
    if (!adminUser) {
        return unauthorizedResponse();
    }

    // Await params in Next.js 15+
    const { id: userId } = await params;

    try {
        const body = await request.json();
        const { status } = statusSchema.parse(body);

        // Prevent admin from suspending themselves (optional safety)
        if (userId === adminUser.id) {
            return apiError('Cannot update your own status', 400, null);
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { status },
            select: { id: true, status: true }
        });

        console.log(`Admin update: User ${userId} status changed to ${status} by ${adminUser.email}`);

        return apiSuccess(updatedUser, 'User status updated successfully');
    } catch (error) {
        if (error instanceof z.ZodError) {
            return apiError('Validation error', 400, { details: error.issues });
        }
        console.error('Error updating user status:', error);
        return apiError('Internal server error', 500, null);
    }
}
