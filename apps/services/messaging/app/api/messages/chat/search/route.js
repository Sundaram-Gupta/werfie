import { MessagingService } from '../../../../../services/messaging.service.js'
import { getUserFromRequest, withAuth } from '../../../../../lib/auth.js'
import { apiSuccess, apiError } from '../../../../../lib/api-response.js'

export const GET = withAuth(async (request) => {
    try {
        const { searchParams } = new URL(request.url)
        const conversationId = searchParams.get('conversationId')
        const query = searchParams.get('q')
        
        const user = await getUserFromRequest(request)
        const userId = user.userId

        if (!userId) {
            return apiError('User not authenticated', 401)
        }

        if (!conversationId || !query) {
            return apiError('Missing conversationId or search query', 400)
        }

        const results = await MessagingService.searchMessages(conversationId, userId, query)
        return apiSuccess(results, 'Search successful')
    } catch (error) {
        console.error('GET search messages Error:', error)
        return apiError(error.message || 'Failed to search messages', 500)
    }
})
