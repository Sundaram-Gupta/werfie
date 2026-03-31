import { NextResponse } from 'next/server';
import { getUserFromRequest } from '../../../../../../lib/auth.js';
import { getChatSetting } from '../../../../../../lib/chat-settings.js';

export async function GET(request, { params }) {
    try {
        const user = await getUserFromRequest(request);
        const userId = user?.userId;

        if (!userId) {
            return Response.json({ status: false, message: 'Unauthorized' }, { status: 401 });
        }

        const { userId: targetUserId } = params;

        if (!targetUserId || targetUserId === 'unknown') {
            return Response.json({ status: false, message: 'Invalid targetUserId' }, { status: 400 });
        }

        // Get my settings for this target user
        const settings = await getChatSetting(userId, targetUserId);
        
        // Check if I am blocked by them
        const targetSettingsOnMe = await getChatSetting(targetUserId, userId);

        const data = {
            settings: {
                isBlocked: settings?.isBlocked || false,
                isMuted: settings?.isMuted || false,
                disappearingMode: settings?.disappearingMode || 'off',
                screenshotBlock: settings?.screenshotBlock || false,
                amIBlocked: targetSettingsOnMe?.isBlocked || false
            }
        };

        return Response.json({ status: true, message: 'Success', data });
    } catch (error) {
        console.error('[ProfileAPI] Error:', error);
        return Response.json({ status: false, message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}
