import { MessagingService } from '../../../../../services/messaging.service.js'
import { getUserFromRequest, withAuth } from '../../../../../lib/auth.js'
import { apiSuccess, apiError } from '../../../../../lib/api-response.js'

export const POST = withAuth(async (request, { params }) => {
    try {
        const user = await getUserFromRequest(request)
        const userId = user?.userId
        if (!userId) return apiError('Unauthorized', 401)

        const { messageId } = params
        const { emoji } = await request.json()

        if (!emoji) return apiError('Emoji is required', 400)

        console.log(`POST reaction: messageId=${messageId}, emoji=${emoji}, userId=${userId}`);
        const reaction = await MessagingService.addReaction(messageId, userId, emoji)
        return apiSuccess(reaction, 'Reaction added successfully')
    } catch (error) {
        console.error('POST reaction error:', error)
        return apiError(error.message || 'Failed to add reaction', 500)
    }
})

export const DELETE = withAuth(async (request, { params }) => {
    try {
        const user = await getUserFromRequest(request)
        const userId = user?.userId
        if (!userId) return apiError('Unauthorized', 401)

        const { messageId } = params
        const { emoji } = await request.json()

        if (!emoji) return apiError('Emoji is required', 400)

        await MessagingService.removeReaction(messageId, userId, emoji)
        return apiSuccess(null, 'Reaction removed successfully')
    } catch (error) {
        console.error('DELETE reaction error:', error)
        return apiError(error.message || 'Failed to remove reaction', 500)
    }
})
