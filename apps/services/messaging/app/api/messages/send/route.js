import { MessagingService } from '@/services/messaging.service'

export async function POST(request) {
    try {
        const body = await request.json()
        const { recipientId, content } = body
        const senderId = request.headers.get('x-user-id') || 'user_1'
        const message = await MessagingService.sendMessage({ senderId, recipientId, content })
        return new Response(JSON.stringify(message), { headers: { 'Content-Type': 'application/json' } })
    } catch (error) {
        console.error(error)
        return new Response(JSON.stringify({ error: 'Failed to send message' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
}
