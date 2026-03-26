import { MessagingService } from '../../../../../services/messaging.service.js'
import { getUserFromRequest, withAuth } from '../../../../../lib/auth.js'
import { apiSuccess, apiError } from '../../../../../lib/api-response.js'

export const DELETE = withAuth(async (request, { params }) => {
    try {
        const user = await getUserFromRequest(request)
        const userId = user?.userId
        if (!userId) return apiError('Unauthorized', 401)

        const { messageId } = params
        await MessagingService.hideMessage(messageId, userId)

        return apiSuccess(null, 'Message hidden for you')
    } catch (error) {
        console.error('DELETE hide message error:', error)
        return apiError(error.message || 'Failed to hide message', 500)
    }
})
