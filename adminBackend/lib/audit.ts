import { prisma } from './prisma';

export async function logAdminAction(
    adminId: string,
    action: string,
    targetType?: string,
    targetId?: string,
    details?: any,
    ipAddress?: string
) {
    try {
        await prisma.auditLog.create({
            data: {
                adminId,
                action,
                targetType,
                targetId,
                details: details ? JSON.stringify(details) : null,
                ipAddress
            }
        });
    } catch (error) {
        console.error('Failed to log admin action:', error);
    }
}
