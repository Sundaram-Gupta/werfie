import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = {
    params: Promise<{ id: string }>
}

export async function PATCH(
    req: NextRequest,
    { params }: Params
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { role } = body;
        const adminId = req.headers.get('x-admin-id');

        // Validate Status Logic
        const validRoles = ['USER', 'BUSINESS', 'MODERATOR', 'ADMIN'];
        if (!validRoles.includes(role)) {
            return NextResponse.json(
                { success: false, error: `Invalid role. Allowed: ${validRoles.join(', ')}` },
                { status: 400 }
            );
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: { role }
        });

        console.log(`[AUDIT] Admin ${adminId} updated role of ${id} to ${role}`);

        return NextResponse.json({
            success: true,
            message: `User role updated to ${role}`,
            user: { id: updatedUser.id, role: updatedUser.role }
        });

    } catch (error: any) {
        console.error('Update Role Error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update user role' },
            { status: 500 }
        );
    }
}
