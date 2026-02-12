import { MessagingService } from '@/services/messaging.service'
import { getUserFromRequest, withAuth } from '@/lib/auth'

export const GET = withAuth(async (request, { params }) => {
    try {
        const { conversationId } = params
        const user = getUserFromRequest(request)
        const userId = user.userId

        if (!userId) {
            return new Response(JSON.stringify({ error: 'User not authenticated' }), { status: 401 })
        }

        const conversation = await MessagingService.getConversation(conversationId, userId)

        if (!conversation) {
            return new Response(JSON.stringify({ error: 'Conversation not found' }), { status: 404 })
        }

        return new Response(JSON.stringify(conversation), { headers: { 'Content-Type': 'application/json' } })
    } catch (error) {
        console.error('GET conversation Error:', error)
        return new Response(JSON.stringify({ error: 'Failed to fetch conversation' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
})
