import { MessagingService } from '../../../../../../services/messaging.service.js'
import { getUserFromRequest, withAuth } from '../../../../../../lib/auth.js'
import { apiSuccess, apiError } from '../../../../../../lib/api-response.js'

export const GET = withAuth(async (request, { params }) => {
    try {
        const user = await getUserFromRequest(request)
        const userId = user?.userId
        if (!userId) return apiError('Unauthorized', 401)

        const { conversationId } = params
        const messages = await MessagingService.getMessages(conversationId, userId)
        return apiSuccess(messages, 'Messages fetched successfully')
    } catch (error) {
        console.error('Error fetching messages:', error)
        return apiError('Failed to fetch messages', 500)
    }
})
