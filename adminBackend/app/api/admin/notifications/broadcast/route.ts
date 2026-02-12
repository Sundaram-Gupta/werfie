import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAdminAction } from '@/lib/audit';

export async function GET(req: NextRequest) {
    try {
        const broadcasts = await prisma.broadcastNotification.findMany({
            orderBy: { createdAt: 'desc' },
            take: 20
        });
        return NextResponse.json(broadcasts);
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const adminId = req.headers.get('x-admin-id') || 'unknown';
        const body = await req.json();
        const { title, message, targetType } = body;

        // 1. Create record
        const broadcast = await prisma.broadcastNotification.create({
            data: {
                title,
                message,
                targetType: targetType || 'all',
                authorId: adminId,
                status: 'sent', // Mock sending
                metrics: JSON.stringify({ delivered: 1250, failures: 3 }) // Mock stats
            }
        });

        // 2. Log Action
        await logAdminAction(adminId, 'SEND_BROADCAST', 'BroadcastNotification', broadcast.id, { title });

        // 3. TODO: Integrate with real Push Service (FCM/Socket.io)
        // For now, this mimics the control flow.

        return NextResponse.json({ success: true, broadcast });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
