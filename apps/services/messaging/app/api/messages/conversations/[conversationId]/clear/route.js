import { MessagingService } from '../../../../../../services/messaging.service.js'
import { getUserFromRequest, withAuth } from '../../../../../../lib/auth.js'
import { apiSuccess, apiError } from '../../../../../../lib/api-response.js'

export const POST = withAuth(async (request, { params }) => {
    try {
        const { conversationId } = params
        const user = await getUserFromRequest(request)
        const userId = user.userId

        if (!userId) {
            return apiError('User not authenticated', 401)
        }

        const result = await MessagingService.clearConversation(conversationId, userId)
        return apiSuccess(result, 'Conversation cleared successfully')
    } catch (error) {
        console.error('POST clear conversation Error:', error)
        return apiError(error.message || 'Failed to clear conversation', 500)
    }
})
