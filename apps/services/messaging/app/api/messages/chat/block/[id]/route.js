import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromRequest } from '../../../../../../lib/auth.js';
import { upsertChatSetting } from '../../../../../../lib/chat-settings.js';
import { getIO } from '../../../../../../lib/socket.js';

const prisma = global.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

export async function DELETE(request, { params }) {
    try {
        const user = await getUserFromRequest(request);
        const userId = user?.userId;

        if (!userId) {
            return NextResponse.json({ status: false, message: 'Unauthorized' }, { status: 401 });
        }

        const targetUserId = params.id;
        if (!targetUserId) {
            return NextResponse.json({ status: false, message: 'Missing targetId' }, { status: 400 });
        }

        const setting = await upsertChatSetting(userId, targetUserId, { isBlocked: false });

        // Update IO
        const io = getIO();
        if (io) {
            io.to(`user:${userId}`).emit('SETTINGS_UPDATED', { targetUserId, isBlocked: false });
            io.to(`user:${targetUserId}`).emit('SETTINGS_UPDATED', { targetUserId: userId, amIBlocked: false });
        }

        return NextResponse.json({ status: true, message: 'User unblocked', data: setting });
    } catch (error) {
        console.error('Error unblocking user:', error);
        return NextResponse.json({ status: false, message: 'Internal Server Error' }, { status: 500 });
    }
}
