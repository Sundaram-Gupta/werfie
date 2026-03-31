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
        const { targetUserId, isBlocked } = body;

        if (!targetUserId || typeof isBlocked !== 'boolean') {
            return Response.json({ status: false, message: 'Invalid targetUserId or isBlocked' }, { status: 400 });
        }

        const setting = await upsertChatSetting(userId, targetUserId, { isBlocked });
        console.log('[BlockAPI] Upsert complete:', setting?.id);

        try {
            const io = getIO();
            if (io) {
                io.to(`user:${userId}`).emit('SETTINGS_UPDATED', { targetUserId, isBlocked });
                io.to(`user:${targetUserId}`).emit('BLOCKED_BY_USER', { blockerId: userId, isBlocked });
            }
        } catch (socketErr) {}

        return Response.json({ status: true, message: `Block ${isBlocked ? 'enabled' : 'disabled'}`, data: setting });
    } catch (error) {
        return Response.json({ status: false, message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}
