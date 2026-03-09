import { NotificationService } from '@/services/notification.service'
import { apiSuccess, apiError } from '@/lib/api-response'

export async function PUT(request, { params }) {
    try {
        const { id } = params
        const notification = await NotificationService.markAsRead(id)
        return apiSuccess(notification, 'Notification marked as read')
    } catch (error) {
        return apiError('Failed to mark as read', 500)
    }
}
