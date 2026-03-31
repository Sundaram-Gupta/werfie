import { getUserFromRequest } from '../../../../lib/auth.js';
import { upsertChatSetting } from '../../../../lib/chat-settings.js';
import { getIO } from '../../../../lib/socket.js';

export async function PUT(request) {
    try {
        const user = await getUserFromRequest(request);
        const userId = user?.userId;

        if (!userId) {
            return Response.json({ status: false, message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { targetUserId, mode } = body;

        if (!targetUserId || !mode) {
            return Response.json({ status: false, message: 'Invalid targetUserId or mode' }, { status: 400 });
        }

        const setting = await upsertChatSetting(userId, targetUserId, { disappearingMode: mode });

        // Emit via WebSocket
        try {
            const io = getIO();
            if (io) {
                io.to(`user:${userId}`).emit('SETTINGS_UPDATED', { targetUserId, disappearingMode: mode });
            }
        } catch (socketErr) {
            console.error('[DisappearingAPI] Socket failed:', socketErr.message);
        }

        return Response.json({ status: true, message: 'Disappearing mode updated', data: setting });
    } catch (error) {
        console.error('[DisappearingAPI] Error:', error);
        return Response.json({ status: false, message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}
