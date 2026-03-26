import { MessagingService } from '../../../../services/messaging.service.js'
import { getUserFromRequest, withAuth } from '../../../../lib/auth.js'
import { apiSuccess, apiError } from '../../../../lib/api-response.js'
import { PrismaClient } from '@prisma/client'

const prisma = global.prisma || new PrismaClient()

export const PATCH = withAuth(async (request, { params }) => {
    try {
        const user = await getUserFromRequest(request)
        const userId = user?.userId
        if (!userId) return apiError('Unauthorized', 401)

        const { messageId } = params
        const { content } = await request.json()
        if (!content) return apiError('Content is required', 400)

        const message = await MessagingService.updateMessage(messageId, userId, content)
        return apiSuccess(message, 'Message updated successfully')
    } catch (error) {
        console.error('PATCH message error:', error)
        return apiError(error.message || 'Failed to update message', 500)
    }
})

export const GET = withAuth(async (request, { params }) => {
    try {
        const { messageId } = params
        const message = await prisma.message.findUnique({
            where: { id: messageId },
            include: {
                sender: {
                    select: { id: true, email: true, profile: true }
                },
                reactions: true,
                replyTo: true
            }
        })
        if (!message) return apiError('Message not found', 404)
        return apiSuccess(message)
    } catch (error) {
        console.error('GET message error:', error)
        return apiError(error.message || 'Failed to get message info', 500)
    }
})

export const DELETE = withAuth(async (request, { params }) => {
    try {
        const user = await getUserFromRequest(request)
        const userId = user?.userId
        if (!userId) return apiError('Unauthorized', 401)

        const { messageId } = params
        await MessagingService.deleteMessage(messageId, userId)

        return apiSuccess(null, 'Message deleted successfully')
    } catch (error) {
        console.error('DELETE message error:', error)
        return apiError(error.message || 'Failed to delete message', 500)
    }
})
