import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromRequest } from '../../../../../../lib/auth.js';
import { getChatSetting } from '../../../../../../lib/chat-settings.js';

const prisma = global.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

export async function GET(request, { params }) {
    try {
        const user = await getUserFromRequest(request);
        const currentUserUserId = user?.userId;

        if (!currentUserUserId) {
            return NextResponse.json({ status: false, message: 'Unauthorized' }, { status: 401 });
        }

        const targetUserId = params.userId;

        if (!targetUserId) {
            return Response.json({ status: false, message: 'Missing targetUserId' }, { status: 400 });
        }

        console.log(`[ProfileAPI] Fetching profile for targetUserId: ${targetUserId} by currentUserId: ${currentUserUserId}`);
        const [targetUser, mySettingsToTarget, targetSettingsToMe] = await Promise.all([
            prisma.user.findUnique({
                where: { id: targetUserId },
                select: { id: true, email: true, profile: true }
            }).catch(e => { console.error('[ProfileAPI] targetUser fetch failed:', e); throw e; }),
            getChatSetting(currentUserUserId, targetUserId).catch(e => { console.error('[ProfileAPI] mySettings fetch failed:', e); throw e; }),
            getChatSetting(targetUserId, currentUserUserId).catch(e => { console.error('[ProfileAPI] targetSettings fetch failed:', e); throw e; })
        ]);

        console.log('[ProfileAPI] Fetches completed:', { targetFound: !!targetUser, hasMySettings: !!mySettingsToTarget, hasTargetSettings: !!targetSettingsToMe });

        if (!targetUser) {
            return Response.json({ status: false, message: 'User not found' }, { status: 404 });
        }

        const name = targetUser.profile?.name || targetUser.email?.split('@')[0] || 'User';
        const handle = targetUser.profile?.handle || targetUser.email?.split('@')[0] || 'user';

        return Response.json({
            status: true,
            data: {
                user: {
                    id: targetUser.id,
                    name,
                    handle,
                    avatarUrl: targetUser.profile?.avatarUrl || null,
                    bio: targetUser.profile?.bio || null,
                },
                settings: {
                    isBlocked: mySettingsToTarget?.isBlocked || false,
                    isMuted: mySettingsToTarget?.isMuted || false,
                    disappearingMode: mySettingsToTarget?.disappearingMode || 'off',
                    screenshotBlock: mySettingsToTarget?.screenshotBlock || false,
                    amIBlocked: targetSettingsToMe?.isBlocked || false
                }
            }
        });
    } catch (error) {
        console.error('Error fetching chat profile [DETAILED]:', {
            message: error.message,
            stack: error.stack,
            targetUserId: params.userId
        });
        return Response.json({ status: false, message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}
