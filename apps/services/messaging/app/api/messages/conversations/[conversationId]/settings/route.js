import { MessagingService } from '../../../../../../services/messaging.service.js'
import { getUserFromRequest, withAuth } from '../../../../../../lib/auth.js'
import { apiSuccess, apiError } from '../../../../../../lib/api-response.js'

const allowedModes = new Set(['off', '1h', '24h', '7d'])

export const GET = withAuth(async (request, { params }) => {
    try {
        const user = await getUserFromRequest(request)
        const userId = user?.userId
        if (!userId) return apiError('Unauthorized', 401)

        const { conversationId } = params
        const settings = await MessagingService.getConversationSettings(conversationId, userId)
        return apiSuccess(settings, 'Conversation settings fetched successfully')
    } catch (error) {
        console.error('GET conversation settings error:', error)
        const code = /Unauthorized/i.test(error?.message || '') ? 403 : 500
        return apiError(error?.message || 'Failed to fetch conversation settings', code)
    }
})

export const PATCH = withAuth(async (request, { params }) => {
    try {
        const user = await getUserFromRequest(request)
        const userId = user?.userId
        if (!userId) return apiError('Unauthorized', 401)

        const body = await request.json()
        const updates = {}

        if (body.disappearingMode !== undefined) {
            if (!allowedModes.has(body.disappearingMode)) {
                return apiError('Invalid disappearingMode. Allowed: off, 1h, 24h, 7d', 400)
            }
            updates.disappearingMode = body.disappearingMode
        }
        if (body.blockScreenshots !== undefined) {
            if (typeof body.blockScreenshots !== 'boolean') return apiError('blockScreenshots must be boolean', 400)
            updates.blockScreenshots = body.blockScreenshots
        }
        if (body.blockMessages !== undefined) {
            if (typeof body.blockMessages !== 'boolean') return apiError('blockMessages must be boolean', 400)
            updates.blockMessages = body.blockMessages
        }
        if (!Object.keys(updates).length) return apiError('No valid settings provided', 400)

        const { conversationId } = params
        const saved = await MessagingService.updateConversationSettings(conversationId, userId, updates)
        return apiSuccess(saved, 'Conversation settings updated successfully')
    } catch (error) {
        console.error('PATCH conversation settings error:', error)
        const code = /Unauthorized/i.test(error?.message || '') ? 403 : 500
        return apiError(error?.message || 'Failed to update conversation settings', code)
    }
})

