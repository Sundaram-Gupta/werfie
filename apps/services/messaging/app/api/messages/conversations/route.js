import { MessagingService } from '@/services/messaging.service'
import { PrismaClient } from '@prisma/client'
import { getUserFromRequest } from '@/lib/auth'

let prisma

if (!global.prisma) {
    global.prisma = new PrismaClient()
}
prisma = global.prisma

export async function GET(request) {
    try {
        const user = getUserFromRequest(request)
        const userId = user.userId

        if (!userId) {
            console.error('GET /conversations: Unauthorized - No userId found')
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
        }

        const conversations = await MessagingService.getConversations(userId)
        return new Response(JSON.stringify(conversations), { headers: { 'Content-Type': 'application/json' } })
    } catch (error) {
        console.error('GET /conversations Error:', error)
        return new Response(JSON.stringify({ error: 'Failed to fetch conversations', details: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
}

export async function POST(request) {
    try {
        const user = getUserFromRequest(request)
        const userId = user.userId || request.headers.get('x-user-id')

        if (!userId) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
        }

        const body = await request.json()
        const { recipientId } = body

        if (!recipientId) {
            return new Response(JSON.stringify({ error: 'Recipient required' }), { status: 400 })
        }

        // Use Service to find or create
        // Logic similar to sendMessage but without sending
        let conversation = await MessagingService.findDirectConversation(userId, recipientId)

        if (!conversation) {
            conversation = await prisma.conversation.create({
                data: {
                    type: 'direct',
                    participants: {
                        create: [
                            { userId },
                            { userId: recipientId }
                        ]
                    }
                },
                include: {
                    participants: true,
                    messages: { take: 1 }
                }
            })
        }

        return new Response(JSON.stringify(conversation), { headers: { 'Content-Type': 'application/json' } })

    } catch (error) {
        console.error(error)
        return new Response(JSON.stringify({ error: 'Failed to create conversation' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
}
