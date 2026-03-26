import { MessagingService } from '../../../../../services/messaging.service.js'
import { getUserFromRequest, withAuth } from '../../../../../lib/auth.js'
import { apiSuccess, apiError } from '../../../../../lib/api-response.js'

export const POST = withAuth(async (request, { params }) => {
    try {
        const user = await getUserFromRequest(request)
        const userId = user?.userId
        if (!userId) return apiError('Unauthorized', 401)

        const { messageId } = params
        const { content, type, mediaUrl, thumbnailUrl, duration, size, mimeType } = await request.json()
        
        const originalMessage = await MessagingService.getMessage(messageId)
        if (!originalMessage) return apiError('Original message not found', 404)

        const message = await MessagingService.sendMessageToConversation({
            conversationId: originalMessage.conversationId,
            senderId: userId,
            content,
            type,
            mediaUrl,
            thumbnailUrl,
            duration,
            size,
            mimeType,
            replyToId: messageId
        })

        return apiSuccess(message, 'Reply sent successfully')
    } catch (error) {
        console.error('POST reply error:', error)
        const message = error?.message || 'Failed to send reply'
        const status = /not accepting messages|unauthorized/i.test(message) ? 403 : 500
        return apiError(message, status)
    }
})
