import { PrismaClient, Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = global.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

export async function getChatSetting(userId, targetUserId) {
    try {
        return await prisma.chatSetting.findUnique({
            where: {
                userId_targetUserId: { userId, targetUserId }
            }
        });
    } catch (error) {
        console.error('[ChatSettings] getChatSetting failed:', error.message);
        throw error;
    }
}

export async function upsertChatSetting(userId, targetUserId, data) {
    try {
        console.log(`[ChatSettings] Upserting for ${userId} -> ${targetUserId}`, data);
        
        return await prisma.chatSetting.upsert({
            where: {
                userId_targetUserId: { userId, targetUserId }
            },
            update: {
                ...(data.isBlocked !== undefined && { isBlocked: data.isBlocked }),
                ...(data.isMuted !== undefined && { isMuted: data.isMuted }),
                ...(data.disappearingMode !== undefined && { disappearingMode: data.disappearingMode }),
                ...(data.screenshotBlock !== undefined && { screenshotBlock: data.screenshotBlock })
            },
            create: {
                id: uuidv4(),
                userId,
                targetUserId,
                isBlocked: data.isBlocked || false,
                isMuted: data.isMuted || false,
                disappearingMode: data.disappearingMode || 'off',
                screenshotBlock: data.screenshotBlock || false
            }
        });
    } catch (error) {
        console.error('[ChatSettings] upsertChatSetting failed:', error.message);
        throw error;
    }
}
