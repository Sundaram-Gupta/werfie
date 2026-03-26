import { MessagingService } from '@/services/messaging.service'
import { getUserFromRequest, withAuth } from '@/lib/auth'
import { apiSuccess, apiError } from '@/lib/api-response'

export const GET = withAuth(async (request, { params }) => {
    try {
        const { conversationId } = params
        const user = await getUserFromRequest(request)
        const userId = user.userId

        if (!userId) {
            return apiError('User not authenticated', 401)
        }

        const conversation = await MessagingService.getConversation(conversationId, userId)

        if (!conversation) {
            return apiError('Conversation not found', 404)
        }

        return apiSuccess(conversation, 'Conversation fetched successfully')
    } catch (error) {
        console.error('GET conversation Error:', error)
        return apiError('Failed to fetch conversation', 500)
    }
})
