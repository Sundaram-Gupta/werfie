import { MessagingService } from '@/services/messaging.service'
import { getUserFromRequest } from '@/lib/auth'

export async function POST(request) {
    try {
        const user = getUserFromRequest(request)
        const senderId = user.userId

        if (!senderId) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
        }

        const body = await request.json()
        const { recipientId, content } = body

        const message = await MessagingService.sendMessage({ senderId, recipientId, content })
        return new Response(JSON.stringify(message), { headers: { 'Content-Type': 'application/json' } })
    } catch (error) {
        console.error(error)
        return new Response(JSON.stringify({ error: 'Failed to send message' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
}
