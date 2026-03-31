import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromRequest } from '../../../../../lib/auth.js';
import { upsertChatSetting } from '../../../../../lib/chat-settings.js';
import { getIO } from '../../../../../lib/socket.js';

const prisma = global.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

export async function POST(request) {
    try {
        const user = await getUserFromRequest(request);
        const userId = user?.userId;

        if (!userId) {
            return Response.json({ status: false, message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { targetUserId } = body;

        if (!targetUserId) {
            return Response.json({ status: false, message: 'Missing targetUserId' }, { status: 400 });
        }

        const setting = await upsertChatSetting(userId, targetUserId, { isBlocked: true });

        // Update IO
        const io = getIO();
        if (io) {
            io.to(`user:${userId}`).emit('SETTINGS_UPDATED', { targetUserId, isBlocked: true });
            io.to(`user:${targetUserId}`).emit('SETTINGS_UPDATED', { targetUserId: userId, amIBlocked: true });
        }

        return Response.json({ status: true, message: 'User blocked', data: setting });
    } catch (error) {
        console.error('Error blocking user:', error);
        return Response.json({ status: false, message: 'Internal Server Error' }, { status: 500 });
    }
}
