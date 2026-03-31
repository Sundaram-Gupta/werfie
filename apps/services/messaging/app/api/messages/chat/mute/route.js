import { NextResponse } from 'next/server';
import { getUserFromRequest } from '../../../../../lib/auth.js';
import { upsertChatSetting } from '../../../../../lib/chat-settings.js';
import { getIO } from '../../../../../lib/socket.js';

export async function PUT(request) {
    try {
        const user = await getUserFromRequest(request);
        const userId = user?.userId;

        if (!userId) {
            return Response.json({ status: false, message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { targetUserId, isMuted } = body;

        if (!targetUserId || typeof isMuted !== 'boolean') {
            return Response.json({ status: false, message: 'Invalid targetUserId or isMuted' }, { status: 400 });
        }

        const setting = await upsertChatSetting(userId, targetUserId, { isMuted });
        console.log('[MuteAPI] Upsert complete:', setting?.id);

        // Real-time update via WebSocket
        try {
            const io = getIO();
            if (io) {
                console.log('[MuteAPI] Emitting SETTINGS_UPDATED');
                io.to(`user:${userId}`).emit('SETTINGS_UPDATED', { targetUserId, isMuted });
            }
        } catch (socketErr) {
            console.error('[MuteAPI] Socket emit failed (non-fatal):', socketErr.message);
        }

        return Response.json({ status: true, message: `Mute ${isMuted ? 'enabled' : 'disabled'}`, data: setting });
    } catch (error) {
        console.error('[MuteAPI] FATAL ERROR:', error);
        return Response.json({ status: false, message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}
