import { NotificationService } from '@/services/notification.service'

export async function PUT(request, { params }) {
    try {
        const { id } = params
        const notification = await NotificationService.markAsRead(id)
        return new Response(JSON.stringify(notification), { headers: { 'Content-Type': 'application/json' } })
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to mark as read' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
}
