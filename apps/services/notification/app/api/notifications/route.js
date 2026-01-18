import { NotificationService } from '@/services/notification.service'

export async function GET(request) {
    try {
        const userId = request.headers.get('x-user-id') || 'user_1'
        const notifications = await NotificationService.getNotifications(userId)
        return new Response(JSON.stringify(notifications), { headers: { 'Content-Type': 'application/json' } })
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to fetch notifications' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
}
