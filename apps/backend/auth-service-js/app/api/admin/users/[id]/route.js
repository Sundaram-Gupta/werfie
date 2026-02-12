import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateAdmin, unauthorizedResponse } from '@/lib/auth-guard';

export async function DELETE(request, { params }) {
    const adminUser = await validateAdmin(request);
    if (!adminUser) {
        return unauthorizedResponse();
    }

    const { id: userId } = await params;

    try {
        if (userId === adminUser.id) {
            return NextResponse.json(
                { error: 'Cannot delete yourself' },
                { status: 400 }
            );
        }

        // Soft delete: Set status to DELETED
        // Note: We are using String for status, so we can use "DELETED" even if not in the status update enum
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { status: 'DELETED' },
            select: { id: true, status: true }
        });

        console.log(`Admin update: User ${userId} soft deleted by ${adminUser.email}`);

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error('Error deleting user:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
