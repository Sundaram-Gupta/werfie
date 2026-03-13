/**
 * @swagger
 * /api/admin/config/push:
 *   get:
 *     summary: Get push notification configurations
 *     tags: [Push Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of push configurations
 *   patch:
 *     summary: Update push notification configuration
 *     tags: [Push Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Configuration updated
 */
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';
import { logAdminAction } from '@/lib/audit';

// GET Push Configuration
export async function GET(req: NextRequest) {
    try {
        const configs = await prisma.pushConfig.findMany();
        return apiSuccess(configs, 'Push configs fetched successfully');
    } catch (error) {
        return apiError('Failed to fetch push config', 500);
    }
}

// PATCH Update Push Configuration
export async function PATCH(req: NextRequest) {
    try {
        const adminId = req.headers.get('x-admin-id') || 'unknown';
        const body = await req.json();
        const { id, provider, credentials, enabled, allowedTypes } = body;

        let config;
        if (id) {
            config = await prisma.pushConfig.update({
                where: { id },
                data: { provider, credentials, enabled, allowedTypes }
            });
        } else {
            // Create if doesn't exist (assuming one per provider for simplicity)
            config = await prisma.pushConfig.create({
                data: { provider, credentials, enabled, allowedTypes }
            });
        }

        await logAdminAction(adminId, 'UPDATE_PUSH_CONFIG', 'PushConfig', config.id, { provider, enabled });

        return apiSuccess({ config }, 'Push config updated successfully');
    } catch (error) {
        return apiError('Failed to update push config', 500);
    }
}
