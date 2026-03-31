import { NextResponse } from 'next/server';
import { getUserFromRequest } from '../../../../../lib/auth.js';
import { upsertChatSetting } from '../../../../../lib/chat-settings.js';
// We emit settings updated to the active websocket connection if possible
import { getIO } from '../../../../../lib/socket.js';

export async function PUT(request) {
    try {
        const user = await getUserFromRequest(request);
        const userId = user?.userId;

        if (!userId) {
            return Response.json({ status: false, message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { targetUserId, mode } = body;

        if (!targetUserId || !['off', '24h', '7d'].includes(mode)) {
            return Response.json({ status: false, message: 'Invalid targetUserId or mode' }, { status: 400 });
        }

        const setting = await upsertChatSetting(userId, targetUserId, { disappearingMode: mode });
        console.log('[DisappearingAPI] Upsert complete:', setting?.id);

        // Real-time update via WebSocket
        try {
            const io = getIO();
            if (io) {
                console.log('[DisappearingAPI] Emitting SETTINGS_UPDATED');
                io.to(`user:${userId}`).emit('SETTINGS_UPDATED', { targetUserId, disappearingMode: mode });
                io.to(`user:${targetUserId}`).emit('SETTINGS_UPDATED', { targetUserId: userId, disappearingMode: mode });
            } else {
                console.warn('[DisappearingAPI] Socket.IO instance (io) not found!');
            }
        } catch (socketErr) {
            console.error('[DisappearingAPI] Socket emit failed (non-fatal):', socketErr.message);
        }

        return Response.json({ status: true, message: 'Disappearing mode updated', data: setting });
    } catch (error) {
        console.error('[DisappearingAPI] FATAL ERROR:', {
            message: error.message,
            stack: error.stack,
            userId,
            targetUserId: request.url
        });
        return Response.json({ status: false, message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}
