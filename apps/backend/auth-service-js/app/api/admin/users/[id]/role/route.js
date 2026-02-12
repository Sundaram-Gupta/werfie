import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateAdmin, unauthorizedResponse } from '@/lib/auth-guard';
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
            return NextResponse.json(
                { error: 'Cannot update your own role' },
                { status: 400 }
            );
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { role },
            select: { id: true, role: true }
        });

        console.log(`Admin update: User ${userId} role changed to ${role} by ${adminUser.email}`);

        return NextResponse.json(updatedUser);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation error', details: error.issues },
                { status: 400 }
            );
        }
        console.error('Error updating user role:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
