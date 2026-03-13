import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAdminAction } from '@/lib/audit';
import { apiSuccess, apiError } from '@/lib/api-response';

export async function GET(req: NextRequest) {
    try {
        const broadcasts = await prisma.broadcastNotification.findMany({
            orderBy: { createdAt: 'desc' },
            take: 20
        });
        return apiSuccess(broadcasts, 'Broadcasts fetched successfully');
    } catch (error) {
        return apiError('Failed to fetch broadcasts', 500);
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

        return apiSuccess({ broadcast }, 'Broadcast sent successfully');
    } catch (error: any) {
        return apiError(error.message, 500);
    }
}
