import { MessagingService } from '../../../../services/messaging.service.js'
import { getUserFromRequest, withAuth } from '../../../../lib/auth.js'
import { sendMessageSchema } from '../../../../lib/validations.js'
import { apiSuccess, apiError } from '../../../../lib/api-response.js'

export const POST = withAuth(async (request) => {
    try {
        const user = await getUserFromRequest(request)
        const senderId = user.userId

        const body = await request.json()

        const result = sendMessageSchema.safeParse(body)
        if (!result.success) {
            return apiError('Validation failed', 400, { details: result.error.format() })
        }

        const { recipientId, content, type, mediaUrl } = result.data

        const message = await MessagingService.sendMessage({ senderId, recipientId, content, type, mediaUrl })
        return apiSuccess(message, 'Message sent successfully')
    } catch (error) {
        console.error(error)
        return apiError('Failed to send message', 500)
    }
})
