import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';

export async function GET() {
    try {
        const recentActivity = await prisma.auditLog.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            // We want to include some admin info if possible, but AuditLog only has adminId
            // If we have a many-to-one relation to User, we could include it.
            // Based on schema, it doesn't have a formal relation, but let's see.
        });

        // Map AuditLog to UI format
        const activities = await Promise.all(recentActivity.map(async (log) => {
            const admin = await prisma.user.findUnique({
                where: { id: log.adminId },
                include: { profile: true }
            });

            return {
                id: log.id,
                user: admin?.profile?.name || admin?.email || 'System',
                action: log.action.toLowerCase().replace(/_/g, ' '),
                time: formatTimeAgo(log.createdAt),
                color: getActionColor(log.action),
                type: admin ? 'user' : 'system'
            };
        }));

        return apiSuccess(activities, 'Recent activity fetched successfully');
    } catch (error: any) {
        console.error('Recent Activity API Error:', error);
        return apiError('Internal Server Error', 500);
    }
}

function formatTimeAgo(date: Date) {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";

    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";

    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";

    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";

    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";

    return Math.floor(seconds) + "s ago";
}

function getActionColor(action: string) {
    if (action.includes('BANNED') || action.includes('DELETE') || action.includes('REVOKE')) return 'red';
    if (action.includes('VERIFY') || action.includes('APPROVE') || action.includes('CREATE')) return 'green';
    if (action.includes('UPDATE') || action.includes('REVIEW')) return 'purple';
    if (action.includes('FLAG') || action.includes('WARN')) return 'yellow';
    return 'blue';
}
