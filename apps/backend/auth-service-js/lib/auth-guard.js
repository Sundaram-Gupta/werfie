import { NextResponse } from 'next/server';
import { verifyToken } from './jwt';
import { prisma } from './prisma';

export async function validateAdmin(request) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }

        const token = authHeader.split(' ')[1];
        const payload = await verifyToken(token);

        if (!payload || !payload.sub) {
            return null;
        }

        const user = await prisma.user.findUnique({
            where: { id: payload.sub },
            select: { id: true, email: true, role: true, name: true } // Fetch name for logging if needed
        });

        if (!user) {
            return null;
        }

        if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
            return null;
        }

        return user;
    } catch (error) {
        console.error('Admin validation error:', error);
        return null;
    }
}

export function unauthorizedResponse() {
    return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
    );
}
