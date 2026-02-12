
import { MessagingService } from '../../../../services/messaging.service.js'
import { getUserFromRequest, withAuth } from '../../../../lib/auth.js'
import { sendMessageSchema } from '../../../../lib/validations.js'

export const POST = withAuth(async (request) => {
    try {
        const user = getUserFromRequest(request)
        const senderId = user.userId

        const body = await request.json()

        // Validation
        const result = sendMessageSchema.safeParse(body)
        if (!result.success) {
            return new Response(JSON.stringify({ error: 'Validation failed', details: result.error.format() }), { status: 400 })
        }

        const { recipientId, content, type, mediaUrl } = result.data

        const message = await MessagingService.sendMessage({ senderId, recipientId, content, type, mediaUrl })
        return new Response(JSON.stringify(message), { headers: { 'Content-Type': 'application/json' } })
    } catch (error) {
        console.error(error)
        return new Response(JSON.stringify({ error: 'Failed to send message' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
})
