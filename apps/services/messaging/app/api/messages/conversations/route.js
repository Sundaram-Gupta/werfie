import { MessagingService } from '../../../../services/messaging.service.js'
import { getUserFromRequest, withAuth } from '../../../../lib/auth.js'
import { apiSuccess, apiError } from '../../../../lib/api-response.js'
import { createConversationSchema } from '../../../../lib/validations.js'
import { PrismaClient } from '@prisma/client'

const prisma = global.prisma || new PrismaClient()
if (process.env.NODE_ENV !== 'production') global.prisma = prisma

export const GET = withAuth(async (request) => {
    try {
        console.log('GET /api/messages/conversations triggered')
        const user = await getUserFromRequest(request)
        const userId = user.userId
        console.log('Resolved userId from request:', userId)

        if (!userId) {
            console.error('No userId found in request')
            return apiError('User not authenticated', 401)
        }

        const conversations = await MessagingService.getConversations(userId)
        console.log(`Found ${conversations.length} conversations for user ${userId}`)

        return apiSuccess(conversations, 'Conversations fetched successfully')
    } catch (error) {
        console.error('GET /conversations Error Trace:', error)
        return apiError('Failed to fetch conversations', 500, { details: error.message })
    }
}, { gracefulGet: true })

export const POST = withAuth(async (request) => {
    try {
        console.log('POST /api/messages/conversations triggered')
        const user = await getUserFromRequest(request)
        const userId = user.userId
        console.log('Resolved userId from request:', userId)

        const body = await request.json()
        console.log('POST body:', body)

        // Validation
        const result = createConversationSchema.safeParse(body)
        if (!result.success) {
            console.error('Validation failed:', result.error.format())
            return apiError('Validation failed', 400, { details: result.error.format() })
        }

        const { recipientId } = result.data

        if (recipientId === userId) {
            return apiError('Cannot chat with yourself', 400)
        }

        let conversation = await MessagingService.findDirectConversation(userId, recipientId)

        if (!conversation) {
            conversation = await MessagingService.createDirectConversation(userId, recipientId)
        }

        return apiSuccess(conversation, 'Conversation created successfully')

    } catch (error) {
        console.error('POST /conversations Error:', error)
        return apiError('Failed to create conversation', 500, { details: error.message })
    }
})

