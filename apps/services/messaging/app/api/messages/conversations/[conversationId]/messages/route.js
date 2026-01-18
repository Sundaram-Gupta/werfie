import { MessagingService } from '@/services/messaging.service'

export async function GET(request, { params }) {
    try {
        const { conversationId } = params
        const messages = await MessagingService.getMessages(conversationId)
        return new Response(JSON.stringify(messages), { headers: { 'Content-Type': 'application/json' } })
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to fetch messages' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
}
