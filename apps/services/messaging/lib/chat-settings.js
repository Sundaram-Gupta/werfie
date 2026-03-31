import { PrismaClient, Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = global.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

export async function getChatSetting(userId, targetUserId) {
    try {
        const records = await prisma.$queryRaw`SELECT * FROM "ChatSetting" WHERE "userId" = ${userId} AND "targetUserId" = ${targetUserId} LIMIT 1`;
        if (Array.isArray(records) && records.length > 0) {
            return records[0];
        }
        return null;
    } catch (error) {
        console.error('[ChatSettings] getChatSetting failed:', error.message);
        throw error;
    }
}

export async function upsertChatSetting(userId, targetUserId, data) {
    try {
        console.log(`[ChatSettings] Upserting for ${userId} -> ${targetUserId}`, data);
        const existing = await getChatSetting(userId, targetUserId);
        
        const isBlocked = data.isBlocked !== undefined ? data.isBlocked : (existing ? existing.isBlocked : false);
        const isMuted = data.isMuted !== undefined ? data.isMuted : (existing ? existing.isMuted : false);
        const disappearingMode = data.disappearingMode !== undefined ? data.disappearingMode : (existing ? existing.disappearingMode : 'off');
        const screenshotBlock = data.screenshotBlock !== undefined ? data.screenshotBlock : (existing ? existing.screenshotBlock : false);

        if (existing) {
            const records = await prisma.$queryRaw`
                UPDATE "ChatSetting" 
                SET "isBlocked" = ${isBlocked}, 
                    "isMuted" = ${isMuted}, 
                    "disappearingMode" = ${disappearingMode}, 
                    "screenshotBlock" = ${screenshotBlock}, 
                    "updatedAt" = CURRENT_TIMESTAMP 
                WHERE "id" = ${existing.id} 
                RETURNING *
            `;
            return Array.isArray(records) ? records[0] : null;
        } else {
            const newId = uuidv4();
            const records = await prisma.$queryRaw`
                INSERT INTO "ChatSetting" ("id", "userId", "targetUserId", "isBlocked", "isMuted", "disappearingMode", "screenshotBlock") 
                VALUES (${newId}, ${userId}, ${targetUserId}, ${isBlocked}, ${isMuted}, ${disappearingMode}, ${screenshotBlock}) 
                RETURNING *
            `;
            return Array.isArray(records) ? records[0] : null;
        }
    } catch (error) {
        console.error('[ChatSettings] upsertChatSetting failed:', error.message);
        throw error;
    }
}
