import { prisma } from '@/lib/prisma';
import { validateAdmin, unauthorizedResponse } from '@/lib/auth-guard';
import { apiSuccess, apiError } from '@/lib/api-response';
import { z } from 'zod';

const roleSchema = z.object({
    role: z.enum(['USER', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN'])
});

export async function PATCH(request, { params }) {
    const adminUser = await validateAdmin(request);
    if (!adminUser) {
        return unauthorizedResponse();
    }

    const { id: userId } = await params;

    try {
        const body = await request.json();
        const { role } = roleSchema.parse(body);

        // Prevent admin from changing their own role (optional safety)
        if (userId === adminUser.id) {
            return apiError('Cannot update your own role', 400, null);
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { role },
            select: { id: true, role: true }
        });

        console.log(`Admin update: User ${userId} role changed to ${role} by ${adminUser.email}`);

        return apiSuccess(updatedUser, 'User role updated successfully');
    } catch (error) {
        if (error instanceof z.ZodError) {
            return apiError('Validation error', 400, { details: error.issues });
        }
        console.error('Error updating user role:', error);
        return apiError('Internal server error', 500, null);
    }
}
