import { prisma } from '@/lib/prisma';
import { validateAdmin, unauthorizedResponse } from '@/lib/auth-guard';
import { apiSuccess, apiError } from '@/lib/api-response';

export async function DELETE(request, { params }) {
    const adminUser = await validateAdmin(request);
    if (!adminUser) {
        return unauthorizedResponse();
    }

    const { id: userId } = await params;

    try {
        if (userId === adminUser.id) {
            return apiError('Cannot delete yourself', 400, null);
        }

        // Soft delete: Set status to DELETED
        // Note: We are using String for status, so we can use "DELETED" even if not in the status update enum
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { status: 'DELETED' },
            select: { id: true, status: true }
        });

        console.log(`Admin update: User ${userId} soft deleted by ${adminUser.email}`);

        return apiSuccess(updatedUser, 'User soft deleted successfully');
    } catch (error) {
        console.error('Error deleting user:', error);
        return apiError('Internal server error', 500, null);
    }
}
