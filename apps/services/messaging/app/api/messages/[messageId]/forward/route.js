import { MessagingService } from '../../../../../services/messaging.service.js'
import { getUserFromRequest, withAuth } from '../../../../../lib/auth.js'
import { apiSuccess, apiError } from '../../../../../lib/api-response.js'

export const POST = withAuth(async (request, { params }) => {
    try {
        const user = await getUserFromRequest(request)
        const userId = user?.userId
        if (!userId) return apiError('Unauthorized', 401)

        const { messageId } = params
        const { targetConversationId } = await request.json()
        if (!targetConversationId) return apiError('targetConversationId is required', 400)
        
        const message = await MessagingService.forwardMessage(messageId, userId, targetConversationId)

        return apiSuccess(message, 'Message forwarded successfully')
    } catch (error) {
        console.error('POST forward error:', error)
        const message = error?.message || 'Failed to forward message'
        const status = /not accepting messages|unauthorized/i.test(message) ? 403 : 500
        return apiError(message, status)
    }
})
