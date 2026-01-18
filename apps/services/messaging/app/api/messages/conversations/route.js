import { MessagingService } from '@/services/messaging.service'

export async function GET(request) {
    try {
        const userId = request.headers.get('x-user-id') || 'user_1'
        const conversations = await MessagingService.getConversations(userId)
        return new Response(JSON.stringify(conversations), { headers: { 'Content-Type': 'application/json' } })
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to fetch conversations' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
}
