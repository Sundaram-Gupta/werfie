import { MessagingService } from '@/services/messaging.service'
import { apiSuccess, apiError } from '@/lib/api-response'

export async function GET(request, { params }) {
    try {
        const { conversationId } = params
        const messages = await MessagingService.getMessages(conversationId)
        return apiSuccess(messages, 'Messages fetched successfully')
    } catch (error) {
        return apiError('Failed to fetch messages', 500)
    }
}
