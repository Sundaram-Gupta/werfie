import { NotificationService } from '@/services/notification.service'
import { apiSuccess, apiError } from '@/lib/api-response'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'

export async function GET(request) {
    try {
        const authHeader = request.headers.get('authorization')
        const token = authHeader && authHeader.split(' ')[1]

        let userId = 'user_1'

        if (token) {
            try {
                const decoded = jwt.verify(token, JWT_SECRET)
                userId = decoded.sub || decoded.id || decoded.userId
            } catch (err) {
                return apiError('Invalid token', 401)
            }
        } else {
            console.warn('No token provided for notifications, defaulting to user_1')
        }

        const notifications = await NotificationService.getNotifications(userId)
        return apiSuccess(notifications, 'Notifications fetched successfully')
    } catch (error) {
        console.error('Notification Error:', error)
        return apiError('Failed to fetch notifications', 500)
    }
}
