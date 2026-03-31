import { NextResponse } from 'next/server';
import { getUserFromRequest } from '../../../../../../lib/auth.js';
import { getIO } from '../../../../../../lib/socket.js';

export async function POST(request) {
    try {
        const user = await getUserFromRequest(request);
        const userId = user?.userId;

        if (!userId) {
            return NextResponse.json({ status: false, message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { targetUserId, type = 'audio' } = body;

        if (!targetUserId) {
            return NextResponse.json({ status: false, message: 'Missing targetUserId' }, { status: 400 });
        }

        // Emit call start event via WebSocket
        const io = getIO();
        if (io) {
            io.to(`user:${targetUserId}`).emit('INCOMING_CALL', {
                fromUserId: userId,
                type: type,
                timestamp: new Date().toISOString()
            });
        }

        return NextResponse.json({ status: true, message: 'Call notification sent' });
    } catch (error) {
        console.error('Error starting call:', error);
        return NextResponse.json({ status: false, message: 'Internal Server Error' }, { status: 500 });
    }
}
