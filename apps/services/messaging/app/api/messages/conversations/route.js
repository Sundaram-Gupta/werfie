import { MessagingService } from '../../../../services/messaging.service.js'
import { getUserFromRequest, withAuth } from '../../../../lib/auth.js'
import { createConversationSchema } from '../../../../lib/validations.js'
import { PrismaClient } from '@prisma/client'

const prisma = global.prisma || new PrismaClient()
if (process.env.NODE_ENV !== 'production') global.prisma = prisma

export const GET = withAuth(async (request) => {
    try {
        console.log('GET /api/messages/conversations triggered')
        const user = getUserFromRequest(request)
        const userId = user.userId
        console.log('Resolved userId from request:', userId)

        if (!userId) {
            console.error('No userId found in request')
            return new Response(JSON.stringify({ error: 'User not authenticated' }), { status: 401 })
        }

        const conversations = await MessagingService.getConversations(userId)
        console.log(`Found ${conversations.length} conversations for user ${userId}`)

        return new Response(JSON.stringify(conversations), { headers: { 'Content-Type': 'application/json' } })
    } catch (error) {
        console.error('GET /conversations Error Trace:', error)
        return new Response(JSON.stringify({
            error: 'Failed to fetch conversations',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
})

export const POST = withAuth(async (request) => {
    try {
        console.log('POST /api/messages/conversations triggered')
        const user = getUserFromRequest(request)
        const userId = user.userId
        console.log('Resolved userId from request:', userId)

        const body = await request.json()
        console.log('POST body:', body)

        // Validation
        const result = createConversationSchema.safeParse(body)
        if (!result.success) {
            console.error('Validation failed:', result.error.format())
            return new Response(JSON.stringify({ error: 'Validation failed', details: result.error.format() }), { status: 400 })
        }

        const { recipientId } = result.data

        if (recipientId === userId) {
            return new Response(JSON.stringify({ error: 'Cannot chat with yourself' }), { status: 400 })
        }

        // Use Service to find or create
        let conversation = await MessagingService.findDirectConversation(userId, recipientId)

        if (!conversation) {
            conversation = await MessagingService.createDirectConversation(userId, recipientId)
        }

        return new Response(JSON.stringify(conversation), { headers: { 'Content-Type': 'application/json' } })

    } catch (error) {
        console.error('POST /conversations Error:', error)
        return new Response(JSON.stringify({
            error: 'Failed to create conversation',
            details: error.message
        }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
})

